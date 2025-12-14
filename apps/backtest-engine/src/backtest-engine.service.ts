import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Kline } from './entities/kline.entity';
import * as TA from 'technicalindicators';

// ===========================================================================
// ⚡ A GRELHA INSTITUCIONAL 2.0 (COM ADX)
// ===========================================================================
const INDICATOR_GRID = {
  RSI_PERIODS: [14, 21],
  EMA_PERIODS: [9, 21, 50, 100, 200],
  SMA_PERIODS: [20, 50, 200],
  ATR_PERIODS: [14],
  ADX_PERIODS: [14] // Filtro de força de tendência
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
  adxMin?: number; // Só negoceia se ADX > X (ex: 20)

  slippagePct?: number; 
  feePct?: number;
}

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);
  
  // CACHE
  private klineCache = new Map<string, {closes: number[], highs: number[], lows: number[], times: number[]}>();
  private indicatorCache = new Map<string, any>(); 

  constructor(
    @InjectRepository(Kline)
    private readonly klineRepo: Repository<Kline>,
  ) {}

  // ===========================================================================
  // 🚀 ORQUESTRADOR
  // ===========================================================================
  async runBacktest(params: {
    symbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    strategy: StrategyConfig;
  }) {
    const cacheKey = `${params.symbol}_${Math.floor(params.startDate.getTime()/1000)}_${Math.floor(params.endDate.getTime()/1000)}`;

    // 1. OBTER DADOS BRUTOS (Com Cache)
    let marketData = this.klineCache.get(cacheKey);
    if (!marketData) {
        const klines = await this.klineRepo.find({
          where: {
            symbol: params.symbol,
            time: Between(Math.floor(params.startDate.getTime()/1000), Math.floor(params.endDate.getTime()/1000)),
          },
          order: { time: 'ASC' },
        });

        if (klines.length < 200) return { error: 'Dados insuficientes (min 200 velas).' };

        marketData = {
            closes: klines.map(k => typeof k.close === 'string' ? parseFloat(k.close) : k.close),
            highs: klines.map(k => typeof k.high === 'string' ? parseFloat(k.high) : k.high),
            lows: klines.map(k => typeof k.low === 'string' ? parseFloat(k.low) : k.low),
            times: klines.map(k => k.time)
        };
        
        this.klineCache.set(cacheKey, marketData);
        // Limpeza preventiva
        if (this.klineCache.size > 20) { this.klineCache.clear(); this.indicatorCache.clear(); }
    }

    // 2. PRÉ-CALCULAR INDICADORES (Grelha)
    let indicators = this.indicatorCache.get(cacheKey);
    if (!indicators) {
        indicators = this.preComputeAllIndicators(marketData.closes, marketData.highs, marketData.lows);
        this.indicatorCache.set(cacheKey, indicators);
    }

    // 3. SIMULAÇÃO RÁPIDA
    return this.fastSimulation(marketData, indicators, params.strategy, params.initialCapital);
  }

  // ===========================================================================
  // 🧠 CÁLCULO DE INDICADORES (PRE-COMPUTE)
  // ===========================================================================
  private preComputeAllIndicators(closes: number[], highs: number[], lows: number[]) {
      const computed: any = {};
      
      INDICATOR_GRID.RSI_PERIODS.forEach(p => computed[`RSI_${p}`] = TA.RSI.calculate({ period: p, values: closes }));
      INDICATOR_GRID.EMA_PERIODS.forEach(p => computed[`EMA_${p}`] = TA.EMA.calculate({ period: p, values: closes }));
      INDICATOR_GRID.SMA_PERIODS.forEach(p => computed[`SMA_${p}`] = TA.SMA.calculate({ period: p, values: closes }));
      INDICATOR_GRID.ATR_PERIODS.forEach(p => computed[`ATR_${p}`] = TA.ATR.calculate({ period: p, high: highs, low: lows, close: closes }));
      
      // ADX retorna objeto {adx, pdi, mdi}
      INDICATOR_GRID.ADX_PERIODS.forEach(p => {
          computed[`ADX_${p}`] = TA.ADX.calculate({ period: p, high: highs, low: lows, close: closes });
      });

      const macd = TA.MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
      computed['MACD_STD'] = macd;

      return computed;
  }

  // ===========================================================================
  // 🏎️ LOOP DE SIMULAÇÃO (CORE)
  // ===========================================================================
  private fastSimulation(data: any, indicators: any, strategy: StrategyConfig, initialCapital: number) {
      const { closes, highs, lows, times } = data;
      const len = closes.length;

      let balance = initialCapital;
      let peakBalance = initialCapital; // Para Circuit Breaker

      let position: { 
        side: 'LONG'|'SHORT', 
        entryPrice: number, 
        size: number, 
        entryIndex: number, 
        initialAtr?: number, 
        isBreakEvenActive?: boolean 
      } | null = null;

      const trades = [];
      const equityCurve = [{ date: new Date(times[0] * 1000), balance }];
      const returnsVector: number[] = [];

      // --- CONFIGURAÇÃO DE RISCO INSTITUCIONAL ---
      const RISK_PER_TRADE = 0.02;     // Arrisca 2% da conta por trade
      const CIRCUIT_BREAKER_DD = 0.15; // Bloqueia trading se DD > 15%

      for (let i = 200; i < len; i++) {
          const currentPrice = closes[i];
          const high = highs[i];
          const low = lows[i];
          const currentDate = new Date(times[i] * 1000);

          // 🛑 CIRCUIT BREAKER CHECK
          if (balance > peakBalance) peakBalance = balance;
          const currentDD = (peakBalance - balance) / peakBalance;
          const isCircuitBreakerTripped = currentDD > CIRCUIT_BREAKER_DD;

          // Lookup Indicadores Globais
          const trendEmaArr = indicators['EMA_200'];
          const trendEma = trendEmaArr ? trendEmaArr[i - 200] : 0;
          
          const atrArr = indicators[`ATR_${strategy.atrPeriod || 14}`];
          const atrValue = atrArr ? atrArr[i - (strategy.atrPeriod || 14)] : 0;

          // Lookup ADX (Filtro de Chop)
          const adxArr = indicators['ADX_14'];
          const adxValue = adxArr ? adxArr[i - 14]?.adx : 0; 

          // -------------------------------------
          // A. SEM POSIÇÃO (ENTRADA)
          // -------------------------------------
          if (!position) {
            // Se o Circuit Breaker disparou, não abre novas posições
            if (isCircuitBreakerTripped) {
                if (i % 60 === 0) equityCurve.push({ date: currentDate, balance });
                continue; 
            }

            // 🔥 FILTRO DE RUÍDO ADX: Só negoceia se ADX > X
            const minAdx = strategy.adxMin || 20; 
            if (adxValue < minAdx) {
                if (i % 60 === 0) equityCurve.push({ date: currentDate, balance });
                continue;
            }

            const isBullish = strategy.trendFilter ? (currentPrice > trendEma) : true;
            const isBearish = strategy.trendFilter ? (currentPrice < trendEma) : true;

            // Variáveis de dimensionamento
            const effectiveAtr = atrValue > 0 ? atrValue : currentPrice * 0.02;
            const stopDist = effectiveAtr * (strategy.atrMultiplier || 2);
            const riskAmt = balance * RISK_PER_TRADE; // Valor monetário em risco (ex: $20)

            // 1. TENTAR LONG
            if (isBullish && this.checkRules(i, currentPrice, strategy.entryRulesLong, indicators)) {
                const entryPrice = currentPrice * (1 + (strategy.slippagePct || 0.0005));
                
                // Cálculo de Tamanho (Kelly Criterion simplificado)
                let size = riskAmt / stopDist;
                // Max Leverage 1x (Segurança)
                if (size * entryPrice > balance) size = balance / entryPrice; 

                position = { side: 'LONG', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
            }
            
            // 2. TENTAR SHORT
            else if (isBearish && this.checkRules(i, currentPrice, strategy.entryRulesShort, indicators)) {
                const entryPrice = currentPrice * (1 - (strategy.slippagePct || 0.0005));
                
                let size = riskAmt / stopDist;
                // Max Leverage 1x
                if (size * entryPrice > balance) size = balance / entryPrice;

                position = { side: 'SHORT', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
            }
          } 
          
          // -------------------------------------
          // B. COM POSIÇÃO (SAÍDA)
          // -------------------------------------
          else {
             const result = this.processExitLogic(i, position, strategy, high, low, currentPrice, balance, times, indicators);
             
             if (result) {
                 balance = result.newBalance;
                 returnsVector.push(result.roi);
                 trades.push(result.trade);
                 position = null;
             }
          }

          if (i % 60 === 0) equityCurve.push({ date: currentDate, balance: position ? balance : balance });
      }

      return this.calculateStats(balance, initialCapital, trades, returnsVector, equityCurve);
  }

  // ===========================================================================
  // 🚪 LÓGICA DE SAÍDA (REFACTORIZADA)
  // ===========================================================================
  private processExitLogic(i: number, position: any, strategy: StrategyConfig, high: number, low: number, currentPrice: number, balance: number, times: number[], indicators: any) {
      const fee = strategy.feePct ?? 0.001; 
      const slippage = strategy.slippagePct ?? 0.0005;
      let exitPrice = 0, reason = '', slPrice = 0, tpPrice = 0;

      // --- LONG ---
      if (position.side === 'LONG') {
          // Stop Loss
          if (position.isBreakEvenActive) slPrice = position.entryPrice * (1 + fee);
          else if (strategy.stopLossType === 'ATR') slPrice = position.entryPrice - (position.initialAtr * (strategy.atrMultiplier || 2));
          else slPrice = position.entryPrice * (1 - strategy.stopLossPct);
          
          tpPrice = position.entryPrice * (1 + strategy.takeProfitPct);

          // Trigger Break Even
          if (strategy.breakEvenPct && !position.isBreakEvenActive) {
              if (high >= position.entryPrice * (1 + strategy.breakEvenPct)) position.isBreakEvenActive = true;
          }

          if (low <= slPrice) { exitPrice = slPrice; reason = 'STOP_LOSS'; }
          else if (high >= tpPrice) { exitPrice = tpPrice; reason = 'TAKE_PROFIT'; }
          else if (strategy.exitRulesLong && this.checkRules(i, currentPrice, strategy.exitRulesLong, indicators)) { 
              exitPrice = currentPrice; reason = 'EXIT_RULE'; 
          }
      } 
      // --- SHORT ---
      else { 
          // Stop Loss (Acima da entrada)
          if (position.isBreakEvenActive) slPrice = position.entryPrice * (1 - fee);
          else if (strategy.stopLossType === 'ATR') slPrice = position.entryPrice + (position.initialAtr * (strategy.atrMultiplier || 2));
          else slPrice = position.entryPrice * (1 + strategy.stopLossPct);

          tpPrice = position.entryPrice * (1 - strategy.takeProfitPct);

          // Trigger Break Even
          if (strategy.breakEvenPct && !position.isBreakEvenActive) {
              if (low <= position.entryPrice * (1 - strategy.breakEvenPct)) position.isBreakEvenActive = true;
          }

          if (high >= slPrice) { exitPrice = slPrice; reason = 'STOP_LOSS'; }
          else if (low <= tpPrice) { exitPrice = tpPrice; reason = 'TAKE_PROFIT'; }
          else if (strategy.exitRulesShort && this.checkRules(i, currentPrice, strategy.exitRulesShort, indicators)) { 
              exitPrice = currentPrice; reason = 'EXIT_RULE'; 
          }
      }

      // EXECUTAR
      if (exitPrice > 0) {
          let realExitPrice = 0;
          let newBalance = balance;

          if (position.side === 'LONG') {
              realExitPrice = exitPrice * (1 - slippage);
              if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 - (slippage * 2)); // Pânico
              
              const gross = position.size * realExitPrice;
              const net = gross * (1 - fee);
              // Balanço = Saldo Anterior - Custo Entrada + Receita Líquida
              newBalance = balance - (position.size * position.entryPrice) + net;
          } else {
              realExitPrice = exitPrice * (1 + slippage);
              if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 + (slippage * 2)); // Pânico
              
              const initialVal = position.size * position.entryPrice;
              const buyBack = position.size * realExitPrice;
              const fees = (initialVal * fee) + (buyBack * fee);
              // Balanço = Saldo Anterior + (Venda Inicial - Recompra - Taxas)
              newBalance = balance + (initialVal - buyBack - fees);
          }
          
          const pnl = newBalance - balance;
          const roi = (pnl / balance) * 100;

          return {
              newBalance,
              roi,
              trade: {
                  entryDate: new Date(times[position.entryIndex] * 1000),
                  exitDate: new Date(times[i] * 1000),
                  side: position.side,
                  entryPrice: position.entryPrice,
                  exitPrice: realExitPrice,
                  roi: roi,
                  reason
              }
          };
      }
      return null;
  }
  
  // ===========================================================================
  // 🔍 HELPERS
  // ===========================================================================
  private checkRules(index: number, currentPrice: number, rules: StrategyRule[], indicators: any): boolean {
      if (!rules || rules.length === 0) return true;
      return rules.every(rule => {
        let val = 0;
        if (rule.indicator === 'MACD') {
            const arr = indicators['MACD_STD'];
            val = (arr && arr[index - 34]) ? arr[index - 34].histogram : 0;
        } else if (rule.indicator === 'ADX') {
             const key = `ADX_${rule.period}`;
             const arr = indicators[key];
             val = (arr && arr[index - rule.period]) ? arr[index - rule.period].adx : 0;
        } else {
            const key = `${rule.indicator}_${rule.period}`;
            const arr = indicators[key];
            val = (arr && arr[index - rule.period]) ? arr[index - rule.period] : 0;
        }
        const target = rule.value === 'PRICE' ? currentPrice : rule.value;
        if (rule.operator === '>') return val > target;
        if (rule.operator === '<') return val < target;
        return false;
      });
  }
  
  private calculateStats(finalBalance: number, initialCapital: number, trades: any[], returnsVector: number[], equityCurve: any[]) {
      const totalReturnPct = ((finalBalance - initialCapital) / initialCapital) * 100;
      
      let peak = initialCapital;
      let maxDrawdownPct = 0;
      let running = initialCapital;
      
      for (const t of trades) {
          // Nota: Reconstrução simplificada do equity para stats
          const profit = running * (t.roi / 100); 
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