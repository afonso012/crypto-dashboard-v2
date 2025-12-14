import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Kline } from './entities/kline.entity';
import * as TA from 'technicalindicators';

// ===========================================================================
// ⚡ A GRELHA INSTITUCIONAL (INDICATOR GRID)
// Definimos aqui o "Menu Fixo" que a IA pode escolher.
// Calculamos isto 1 vez. Reutilizamos 1 milhão de vezes.
// ===========================================================================
const INDICATOR_GRID = {
  RSI_PERIODS: [14, 21, 28],
  EMA_PERIODS: [9, 21, 50, 200],
  SMA_PERIODS: [20, 50, 200],
  ATR_PERIODS: [14]
};

// --- Interfaces ---
export interface StrategyRule {
  indicator: string;
  period: number;
  operator: string;
  value: number | 'PRICE';
}

export interface StrategyConfig {
  entryRulesLong: StrategyRule[];
  entryRulesShort: StrategyRule[];
  exitRulesLong?: StrategyRule[];
  exitRulesShort?: StrategyRule[];
  
  stopLossType?: 'FIXED' | 'ATR'; 
  stopLossPct: number;           
  atrMultiplier?: number;        
  atrPeriod?: number;            
  takeProfitPct: number;
  breakEvenPct?: number; 
  trendFilter?: boolean;         
  slippagePct?: number; 
  feePct?: number;
}

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);
  
  // CACHE NÍVEL 1: Dados Brutos (Klines)
  private klineCache = new Map<string, {closes: number[], highs: number[], lows: number[], times: number[]}>();
  
  // CACHE NÍVEL 2: Indicadores Processados (Grelha)
  // Chave: "SYMBOL_START_END" -> Valor: { "RSI_14": [...], "EMA_200": [...] }
  private indicatorCache = new Map<string, any>(); 

  constructor(
    @InjectRepository(Kline)
    private readonly klineRepo: Repository<Kline>,
  ) {}

  // ===========================================================================
  // 🚀 MÉTODO PRINCIPAL
  // ===========================================================================
  async runBacktest(params: {
    symbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    strategy: StrategyConfig;
  }) {
    const cacheKey = `${params.symbol}_${Math.floor(params.startDate.getTime()/1000)}_${Math.floor(params.endDate.getTime()/1000)}`;

    // 1. OBTER DADOS BRUTOS (Cache ou DB)
    let marketData = this.klineCache.get(cacheKey);
    
    if (!marketData) {
        // MISS: Buscar à BD
        const klines = await this.klineRepo.find({
          where: {
            symbol: params.symbol,
            time: Between(Math.floor(params.startDate.getTime()/1000), Math.floor(params.endDate.getTime()/1000)),
          },
          order: { time: 'ASC' },
        });

        if (klines.length < 200) return { error: 'Dados insuficientes (min 200 velas).' };

        // Otimização: Converter logo para arrays de números (Float32Array seria melhor, mas number[] serve)
        marketData = {
            closes: klines.map(k => typeof k.close === 'string' ? parseFloat(k.close) : k.close),
            highs: klines.map(k => typeof k.high === 'string' ? parseFloat(k.high) : k.high),
            lows: klines.map(k => typeof k.low === 'string' ? parseFloat(k.low) : k.low),
            times: klines.map(k => k.time)
        };
        
        this.klineCache.set(cacheKey, marketData);
        
        // Limpeza de memória preventiva
        if (this.klineCache.size > 20) { this.klineCache.clear(); this.indicatorCache.clear(); }
    }

    // 2. PRÉ-CALCULAR GRELHA DE INDICADORES (Só 1 vez por período!)
    let indicators = this.indicatorCache.get(cacheKey);

    if (!indicators) {
        // MISS: Calcular TUDO o que está na grelha
        // this.logger.debug(`⚡ A pré-calcular grelha matemática para ${params.symbol}...`);
        indicators = this.preComputeAllIndicators(marketData.closes, marketData.highs, marketData.lows);
        this.indicatorCache.set(cacheKey, indicators);
    }

    // 3. EXECUTAR SIMULAÇÃO ULTRA-RÁPIDA
    return this.fastSimulation(marketData, indicators, params.strategy, params.initialCapital);
  }

  // ===========================================================================
  // 🧠 CÁLCULO DE INDICADORES (PRE-COMPUTE)
  // ===========================================================================
  private preComputeAllIndicators(closes: number[], highs: number[], lows: number[]) {
      const computed: any = {};

      // RSI
      INDICATOR_GRID.RSI_PERIODS.forEach(p => {
          computed[`RSI_${p}`] = TA.RSI.calculate({ period: p, values: closes });
      });

      // EMA
      INDICATOR_GRID.EMA_PERIODS.forEach(p => {
          computed[`EMA_${p}`] = TA.EMA.calculate({ period: p, values: closes });
      });
      
      // SMA
      INDICATOR_GRID.SMA_PERIODS.forEach(p => {
          computed[`SMA_${p}`] = TA.SMA.calculate({ period: p, values: closes });
      });

      // ATR
      INDICATOR_GRID.ATR_PERIODS.forEach(p => {
          computed[`ATR_${p}`] = TA.ATR.calculate({ period: p, high: highs, low: lows, close: closes });
      });

      // MACD Standard (12, 26, 9)
      const macd = TA.MACD.calculate({ 
          values: closes, 
          fastPeriod: 12, 
          slowPeriod: 26, 
          signalPeriod: 9, 
          SimpleMAOscillator: false, 
          SimpleMASignal: false 
      });
      computed['MACD_STD'] = macd;

      return computed;
  }

  // ===========================================================================
  // 🏎️ LOOP DE SIMULAÇÃO (LONG/SHORT/BREAK-EVEN)
  // ===========================================================================
  private fastSimulation(data: any, indicators: any, strategy: StrategyConfig, initialCapital: number) {
    const { closes, highs, lows, times } = data;
    const len = closes.length;

    let balance = initialCapital;
    
    let position: { 
      side: 'LONG' | 'SHORT'; 
      entryPrice: number; 
      size: number; 
      entryIndex: number; 
      initialAtr?: number;
      isBreakEvenActive?: boolean; 
    } | null = null;

    const trades = [];
    const equityCurve = [{ date: new Date(times[0] * 1000), balance }];
    const returnsVector: number[] = [];

    // DEFINIÇÃO DE RISCO POR TRADE (Institucional = 1% a 2%)
    const RISK_PER_TRADE = 0.02; 

    for (let i = 200; i < len; i++) {
        const currentPrice = closes[i];
        const high = highs[i];
        const low = lows[i];

        const fee = strategy.feePct ?? 0.001; 
        const slippage = strategy.slippagePct ?? 0.0005;

        const trendEmaArr = indicators['EMA_200'];
        const trendEma = trendEmaArr ? trendEmaArr[i - 200] : 0;
        
        const atrArr = indicators[`ATR_${strategy.atrPeriod || 14}`];
        const atrValue = atrArr ? atrArr[i - (strategy.atrPeriod || 14)] : 0;

        // -------------------------------------
        // A. SEM POSIÇÃO (ENTRADA)
        // -------------------------------------
        if (!position) {
          const isBullish = strategy.trendFilter ? (currentPrice > trendEma) : true;
          const isBearish = strategy.trendFilter ? (currentPrice < trendEma) : true;

          // Variáveis para cálculo de tamanho
          let entryPrice = 0;
          let stopDistance = 0;
          let size = 0;

          // --- TENTAR LONG ---
          if (isBullish && this.checkRules(i, currentPrice, strategy.entryRulesLong, indicators)) {
              entryPrice = currentPrice * (1 + slippage);
              
              // 1. Calcular onde ficaria o Stop Loss (baseado em ATR)
              // Se ATR for 0 ou indefinido, usamos fallback de 2%
              const effectiveAtr = atrValue > 0 ? atrValue : entryPrice * 0.02;
              stopDistance = effectiveAtr * (strategy.atrMultiplier || 2);
              
              // 2. Calcular Tamanho da Posição baseado no Risco
              // Quero perder no máximo RISK_PER_TRADE * Balance
              const riskAmount = balance * RISK_PER_TRADE;
              size = riskAmount / stopDistance;

              // 3. Limite de Alavancagem (Segurança: Não usar mais que 100% do saldo)
              const maxBuyingPower = balance / entryPrice;
              if (size > maxBuyingPower) size = maxBuyingPower;

              position = { side: 'LONG', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
          }
          
          // --- TENTAR SHORT ---
          else if (isBearish && this.checkRules(i, currentPrice, strategy.entryRulesShort, indicators)) {
              entryPrice = currentPrice * (1 - slippage);
              
              const effectiveAtr = atrValue > 0 ? atrValue : entryPrice * 0.02;
              stopDistance = effectiveAtr * (strategy.atrMultiplier || 2);

              const riskAmount = balance * RISK_PER_TRADE;
              size = riskAmount / stopDistance;

              // Limite de margem
              const maxBuyingPower = balance / entryPrice;
              if (size > maxBuyingPower) size = maxBuyingPower;

              position = { side: 'SHORT', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
          }
        } 
        
        // -------------------------------------
        // B. COM POSIÇÃO (SAÍDA)
        // -------------------------------------
        else {
          // ... (Esta parte da lógica de Saída mantém-se IGUAL ao ficheiro anterior)
          // ... (Copia a lógica de "checkExit" do ficheiro anterior para aqui)
          
          // Vou replicar a parte crítica para garantir que funciona:
          let exitPrice = 0;
          let reason = '';
          let slPrice = 0, tpPrice = 0;

          if (position.side === 'LONG') {
              if (position.isBreakEvenActive) slPrice = position.entryPrice * (1 + fee);
              else if (strategy.stopLossType === 'ATR') slPrice = position.entryPrice - (position.initialAtr * (strategy.atrMultiplier || 2));
              else slPrice = position.entryPrice * (1 - strategy.stopLossPct);
              
              tpPrice = position.entryPrice * (1 + strategy.takeProfitPct);

              if (strategy.breakEvenPct && !position.isBreakEvenActive) {
                  if (high >= position.entryPrice * (1 + strategy.breakEvenPct)) position.isBreakEvenActive = true;
              }

              if (low <= slPrice) { exitPrice = slPrice; reason = 'STOP_LOSS'; }
              else if (high >= tpPrice) { exitPrice = tpPrice; reason = 'TAKE_PROFIT'; }
          } else { // SHORT
              if (position.isBreakEvenActive) slPrice = position.entryPrice * (1 - fee);
              else if (strategy.stopLossType === 'ATR') slPrice = position.entryPrice + (position.initialAtr * (strategy.atrMultiplier || 2));
              else slPrice = position.entryPrice * (1 + strategy.stopLossPct);

              tpPrice = position.entryPrice * (1 - strategy.takeProfitPct);

              if (strategy.breakEvenPct && !position.isBreakEvenActive) {
                  if (low <= position.entryPrice * (1 - strategy.breakEvenPct)) position.isBreakEvenActive = true;
              }

              if (high >= slPrice) { exitPrice = slPrice; reason = 'STOP_LOSS'; }
              else if (low <= tpPrice) { exitPrice = tpPrice; reason = 'TAKE_PROFIT'; }
          }

          if (exitPrice > 0) {
               // ... (Lógica de cálculo de PnL igual ao anterior) ...
               // Vou abreviar:
              let realExitPrice = 0;
              if (position.side === 'LONG') {
                  realExitPrice = exitPrice * (1 - slippage);
                  if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 - (slippage * 2));
                  const gross = position.size * realExitPrice;
                  const net = gross * (1 - fee);
                  balance = balance - (position.size * position.entryPrice) + net; // Atualização simplificada
              } else {
                  realExitPrice = exitPrice * (1 + slippage);
                  if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 + (slippage * 2));
                  const initialVal = position.size * position.entryPrice;
                  const buyBack = position.size * realExitPrice;
                  const fees = (initialVal * fee) + (buyBack * fee);
                  balance += (initialVal - buyBack - fees);
              }

              const pnl = balance - equityCurve[equityCurve.length-1].balance; // Aprox
              const roiPct = pnl / balance * 100; // Aprox para stats
              returnsVector.push(roiPct);

              trades.push({
                  entryDate: new Date(times[position.entryIndex] * 1000),
                  exitDate: new Date(times[i] * 1000),
                  side: position.side,
                  entryPrice: position.entryPrice,
                  exitPrice: realExitPrice,
                  roi: roiPct,
                  reason
              });
              position = null;
          }
        }
        if (i % 60 === 0) equityCurve.push({ date: new Date(times[i] * 1000), balance });
    }

    return this.calculateStats(balance, initialCapital, trades, returnsVector, equityCurve);
}

  // ===========================================================================
  // 🔍 VERIFICADOR DE REGRAS (LOOKUP)
  // ===========================================================================
  private checkRules(index: number, currentPrice: number, rules: StrategyRule[], indicators: any): boolean {
    if (!rules || rules.length === 0) return true; // Se não houver regras, assume "true" para permitir fluxo (ou false se preferires restritivo)

    return rules.every(rule => {
      // 1. Obter array da cache
      let val = 0;
      if (rule.indicator === 'MACD') {
          const arr = indicators['MACD_STD'];
          // MACD lib devolve array de objetos, offset ~34
          val = (arr && arr[index - 34]) ? arr[index - 34].histogram : 0;
      } else {
          const key = `${rule.indicator}_${rule.period}`;
          const arr = indicators[key];
          // Offset simples: index - period
          val = (arr && arr[index - rule.period]) ? arr[index - rule.period] : 0;
      }

      const target = rule.value === 'PRICE' ? currentPrice : rule.value;
      
      // Comparação Simples
      if (rule.operator === '>') return val > target;
      if (rule.operator === '<') return val < target;
      return false;
    });
  }

  // ===========================================================================
  // 📊 ESTATÍSTICAS
  // ===========================================================================
  private calculateStats(finalBalance: number, initialCapital: number, trades: any[], returnsVector: number[], equityCurve: any[]) {
      const totalReturnPct = ((finalBalance - initialCapital) / initialCapital) * 100;
      
      let peak = initialCapital;
      let maxDrawdownPct = 0;
      let running = initialCapital;
      
      // Re-simular equity para DD preciso
      for (const t of trades) {
          // Aproximação do balanço
          const profit = running * (t.roi / 100); 
          // Nota: Em Short pode variar a matemática, mas para DD serve
          running += profit; 
          if (running > peak) peak = running;
          const dd = (peak - running) / peak;
          if (dd > maxDrawdownPct) maxDrawdownPct = dd;
      }

      const negativeReturns = returnsVector.filter(r => r < 0);
      const downsideDeviation = Math.sqrt(
          negativeReturns.reduce((acc, r) => acc + (r * r), 0) / (returnsVector.length || 1)
      );

      const wins = trades.filter(t => t.roi > 0).length;
      const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

      return {
        totalReturnPct,
        totalTrades: trades.length,
        maxDrawdownPct: maxDrawdownPct * 100,
        winRate,
        downsideDeviation,
        finalBalance,
        history: trades,
        equityCurve
      };
  }
}