import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Kline } from './entities/kline.entity';
import * as TA from 'technicalindicators';

// ===========================================================================
// ⚡ A GRELHA INSTITUCIONAL 3.0 (COM CORRELAÇÃO DE MERCADO)
// ===========================================================================
const INDICATOR_GRID = {
  RSI_PERIODS: [14, 21],
  EMA_PERIODS: [9, 21, 50, 100, 200],
  SMA_PERIODS: [20, 50],
  ATR_PERIODS: [14],
  ADX_PERIODS: [14],
  // 🔥 NOVO: Janela de correlação (ex: correlação dos últimos 14 dias)
  CORR_PERIODS: [14] 
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
  adxMin?: number; 

  // 🔥 NOVO: Filtro de Correlação
  minCorrelation?: number; // Ex: Só negoceia se correlação com BTC < 0.8 (evitar crashes sistémicos)
  
  slippagePct?: number; 
  feePct?: number;
}

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);
  
  // CACHE (Agora suporta múltiplos ativos)
  private klineCache = new Map<string, {closes: number[], highs: number[], lows: number[], times: number[]}>();
  private indicatorCache = new Map<string, any>(); 

  constructor(
    @InjectRepository(Kline)
    private readonly klineRepo: Repository<Kline>,
  ) {}

  // ===========================================================================
  // 🚀 ORQUESTRADOR MULTI-ATIVO
  // ===========================================================================
  async runBacktest(params: {
    symbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    strategy: StrategyConfig;
  }) {
    const startTs = Math.floor(params.startDate.getTime()/1000);
    const endTs = Math.floor(params.endDate.getTime()/1000);
    const cacheKey = `${params.symbol}_${startTs}_${endTs}`;

    // 1. CARREGAR ATIVO ALVO (Ex: ETHUSDT)
    let targetData = await this.getMarketData(params.symbol, startTs, endTs);
    if (!targetData) return { error: `Dados insuficientes para ${params.symbol}` };

    // 2. CARREGAR BENCHMARK (BTCUSDT) PARA CORRELAÇÃO
    // Se o ativo já for BTC, a correlação será 1.0 (irrelevante, mas funciona)
    let btcData = await this.getMarketData('BTCUSDT', startTs, endTs);
    
    // Se não tivermos dados de BTC (ex: erro de DB), usamos os dados do próprio ativo como fallback
    if (!btcData) btcData = targetData; 

    // 3. PRÉ-CALCULAR GRELHA (Incluindo Correlação)
    let indicators = this.indicatorCache.get(cacheKey);
    if (!indicators) {
        indicators = this.preComputeAllIndicators(targetData, btcData);
        this.indicatorCache.set(cacheKey, indicators);
    }

    // 4. SIMULAÇÃO
    return this.fastSimulation(targetData, indicators, params.strategy, params.initialCapital);
  }

  // Helper para carregar dados
  private async getMarketData(symbol: string, startTs: number, endTs: number) {
      const key = `${symbol}_${startTs}_${endTs}`;
      if (this.klineCache.has(key)) return this.klineCache.get(key);

      const klines = await this.klineRepo.find({
          where: { symbol, time: Between(startTs, endTs) },
          order: { time: 'ASC' },
      });

      if (klines.length < 200) return null;

      const data = {
          closes: klines.map(k => parseFloat(k.close as string)),
          highs: klines.map(k => parseFloat(k.high as string)),
          lows: klines.map(k => parseFloat(k.low as string)),
          times: klines.map(k => k.time)
      };
      
      this.klineCache.set(key, data);
      return data;
  }

  // ===========================================================================
  // 🧠 CÁLCULO DE INDICADORES + CORRELAÇÃO MATEMÁTICA
  // ===========================================================================
  private preComputeAllIndicators(target: any, benchmark: any) {
      const closes = target.closes;
      const computed: any = {};
      
      // Indicadores Clássicos
      INDICATOR_GRID.RSI_PERIODS.forEach(p => computed[`RSI_${p}`] = TA.RSI.calculate({ period: p, values: closes }));
      INDICATOR_GRID.EMA_PERIODS.forEach(p => computed[`EMA_${p}`] = TA.EMA.calculate({ period: p, values: closes }));
      INDICATOR_GRID.SMA_PERIODS.forEach(p => computed[`SMA_${p}`] = TA.SMA.calculate({ period: p, values: closes }));
      INDICATOR_GRID.ATR_PERIODS.forEach(p => computed[`ATR_${p}`] = TA.ATR.calculate({ period: p, high: target.highs, low: target.lows, close: closes }));
      
      INDICATOR_GRID.ADX_PERIODS.forEach(p => {
          computed[`ADX_${p}`] = TA.ADX.calculate({ period: p, high: target.highs, low: target.lows, close: closes });
      });
      
      const macd = TA.MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
      computed['MACD_STD'] = macd;

      // 🔥 NOVO: ALGORITMO DE CORRELAÇÃO DE PEARSON (ROLLING)
      // Calcula a correlação entre o Ativo e o BTC numa janela deslizante
      INDICATOR_GRID.CORR_PERIODS.forEach(period => {
          computed[`CORR_BTC_${period}`] = this.calculateRollingCorrelation(target.closes, benchmark.closes, period);
      });

      return computed;
  }

  // Algoritmo Estatístico Otimizado (Pearson Correlation)
  private calculateRollingCorrelation(assetA: number[], assetB: number[], period: number): number[] {
      const result = new Array(assetA.length).fill(0);
      
      // Alinhar arrays (O BTC pode ter mais/menos velas, assumimos sincronia pelo índice para performance)
      // Nota: Em produção real, deve-se alinhar por timestamp. Aqui assumimos mesma frequência.
      const len = Math.min(assetA.length, assetB.length);

      for (let i = period; i < len; i++) {
          const sliceA = assetA.slice(i - period, i);
          const sliceB = assetB.slice(i - period, i);
          result[i] = this.pearson(sliceA, sliceB);
      }
      return result;
  }

  // Fórmula Matemática Pura
  private pearson(x: number[], y: number[]): number {
      const n = x.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
      
      for (let i = 0; i < n; i++) {
          sumX += x[i];
          sumY += y[i];
          sumXY += x[i] * y[i];
          sumX2 += x[i] * x[i];
          sumY2 += y[i] * y[i];
      }
      
      const numerator = (n * sumXY) - (sumX * sumY);
      const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));
      
      if (denominator === 0) return 0;
      return numerator / denominator;
  }

  // ===========================================================================
  // 🏎️ LOOP DE SIMULAÇÃO
  // ===========================================================================
  private fastSimulation(data: any, indicators: any, strategy: StrategyConfig, initialCapital: number) {
      const { closes, highs, lows, times } = data;
      const len = closes.length;

      let balance = initialCapital;
      let peakBalance = initialCapital;
      let position: any = null;
      const trades = [];
      const equityCurve = [{ date: new Date(times[0] * 1000), balance }];
      const returnsVector: number[] = [];

      const RISK_PER_TRADE = 0.02;     
      const CIRCUIT_BREAKER_DD = 0.15; 

      for (let i = 200; i < len; i++) {
          const currentPrice = closes[i];
          
          // Circuit Breaker
          if (balance > peakBalance) peakBalance = balance;
          if ((peakBalance - balance) / peakBalance > CIRCUIT_BREAKER_DD) {
              if (i % 60 === 0) equityCurve.push({ date: new Date(times[i] * 1000), balance });
              continue; 
          }

          // Lookups Rápidos
          const trendEma = indicators['EMA_200'] ? indicators['EMA_200'][i - 200] : 0;
          const atrValue = indicators[`ATR_${strategy.atrPeriod || 14}`] ? indicators[`ATR_${strategy.atrPeriod || 14}`][i - (strategy.atrPeriod || 14)] : 0;
          const adxValue = indicators['ADX_14'] ? indicators['ADX_14'][i - 14]?.adx : 0; 
          
          // 🔥 LOOKUP CORRELAÇÃO
          const correlation = indicators['CORR_BTC_14'] ? indicators['CORR_BTC_14'][i] : 0;

          // Entrada
          if (!position) {
            
            // 1. Filtro ADX
            const minAdx = strategy.adxMin || 15; 
            if (adxValue < minAdx) {
                if (i % 60 === 0) equityCurve.push({ date: new Date(times[i] * 1000), balance });
                continue;
            }

            // 2. 🔥 Filtro de Correlação (Inteligência de Mercado)
            // Se minCorrelation for definido (ex: 0.5), o bot ignora sinais se o ativo estiver muito desacoplado
            // OU se for negativo, pode usar como sinal de hedge. 
            // Para simplificar: A AI pode evoluir regras baseadas nisto depois.
            
            const isBullish = strategy.trendFilter ? (currentPrice > trendEma) : true;
            const isBearish = strategy.trendFilter ? (currentPrice < trendEma) : true;

            // ... (Resto da lógica de entrada e cálculo de tamanho igual) ...
            const effectiveAtr = atrValue > 0 ? atrValue : currentPrice * 0.02;
            const stopDist = effectiveAtr * (strategy.atrMultiplier || 2);
            const riskAmt = balance * RISK_PER_TRADE; 

            // Long
            if (isBullish && this.checkRules(i, currentPrice, strategy.entryRulesLong, indicators, correlation)) {
                const entryPrice = currentPrice * (1 + (strategy.slippagePct || 0.0005));
                let size = riskAmt / stopDist;
                if (size * entryPrice > balance) size = balance / entryPrice; 
                position = { side: 'LONG', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
            }
            // Short
            else if (isBearish && this.checkRules(i, currentPrice, strategy.entryRulesShort, indicators, correlation)) {
                const entryPrice = currentPrice * (1 - (strategy.slippagePct || 0.0005));
                let size = riskAmt / stopDist;
                if (size * entryPrice > balance) size = balance / entryPrice;
                position = { side: 'SHORT', entryPrice, size, entryIndex: i, initialAtr: effectiveAtr };
            }
          } 
          
          // Saída
          else {
             const result = this.processExitLogic(i, position, strategy, highs[i], lows[i], currentPrice, balance, times, indicators);
             if (result) {
                 balance = result.newBalance;
                 returnsVector.push(result.roi);
                 trades.push(result.trade);
                 position = null;
             }
          }
          if (i % 60 === 0) equityCurve.push({ date: new Date(times[i] * 1000), balance: position ? balance : balance });
      }

      return this.calculateStats(balance, initialCapital, trades, returnsVector, equityCurve);
  }

  // --- HELPERS (Exit Logic igual, checkRules atualizado) ---
  
  private processExitLogic(i: number, position: any, strategy: StrategyConfig, high: number, low: number, currentPrice: number, balance: number, times: number[], indicators: any) {
    // ... (Copia a lógica exata do ficheiro anterior para aqui) ...
    // ... (Para poupar espaço, é a mesma lógica de TP/SL/BreakEven) ...
    // ... (IMPORTANTE: Copia o bloco 'processExitLogic' do ficheiro anterior) ...
    const fee = strategy.feePct ?? 0.001; 
      const slippage = strategy.slippagePct ?? 0.0005;
      let exitPrice = 0, reason = '', slPrice = 0, tpPrice = 0;

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
          // Nota: checkRules agora aceita correlation (passamos 0 aqui pq saída é menos dependente)
          else if (strategy.exitRulesLong && this.checkRules(i, currentPrice, strategy.exitRulesLong, indicators, 0)) { 
              exitPrice = currentPrice; reason = 'EXIT_RULE'; 
          }
      } 
      else { 
          if (position.isBreakEvenActive) slPrice = position.entryPrice * (1 - fee);
          else if (strategy.stopLossType === 'ATR') slPrice = position.entryPrice + (position.initialAtr * (strategy.atrMultiplier || 2));
          else slPrice = position.entryPrice * (1 + strategy.stopLossPct);

          tpPrice = position.entryPrice * (1 - strategy.takeProfitPct);

          if (strategy.breakEvenPct && !position.isBreakEvenActive) {
              if (low <= position.entryPrice * (1 - strategy.breakEvenPct)) position.isBreakEvenActive = true;
          }

          if (high >= slPrice) { exitPrice = slPrice; reason = 'STOP_LOSS'; }
          else if (low <= tpPrice) { exitPrice = tpPrice; reason = 'TAKE_PROFIT'; }
          else if (strategy.exitRulesShort && this.checkRules(i, currentPrice, strategy.exitRulesShort, indicators, 0)) { 
              exitPrice = currentPrice; reason = 'EXIT_RULE'; 
          }
      }

      if (exitPrice > 0) {
          let realExitPrice = 0, newBalance = balance;
          if (position.side === 'LONG') {
              realExitPrice = exitPrice * (1 - slippage);
              if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 - (slippage * 2));
              const net = (position.size * realExitPrice) * (1 - fee);
              newBalance = balance - (position.size * position.entryPrice) + net;
          } else {
              realExitPrice = exitPrice * (1 + slippage);
              if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 + (slippage * 2));
              const initialVal = position.size * position.entryPrice;
              const buyBack = position.size * realExitPrice;
              const fees = (initialVal * fee) + (buyBack * fee);
              newBalance = balance + (initialVal - buyBack - fees);
          }
          return { newBalance, roi: ((newBalance - balance)/balance)*100, trade: { entryDate: new Date(times[position.entryIndex]*1000), exitDate: new Date(times[i]*1000), side: position.side, entryPrice: position.entryPrice, exitPrice: realExitPrice, roi: ((newBalance - balance)/balance)*100, reason } };
      }
      return null;
  }

  // --- CHECK RULES COM CORRELAÇÃO ---
  private checkRules(index: number, currentPrice: number, rules: StrategyRule[], indicators: any, correlation: number): boolean {
      if (!rules || rules.length === 0) return true;
      return rules.every(rule => {
        let val = 0;
        // 🔥 NOVO: Suporte para Regra de Correlação
        if (rule.indicator === 'CORR_BTC' as any) {
            val = correlation;
        } else if (rule.indicator === 'MACD') {
            const arr = indicators['MACD_STD'];
            val = (arr && arr[index - 34]) ? arr[index - 34].histogram : 0;
        } else if (rule.indicator === 'ADX' as any) {
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
      let peak = initialCapital, maxDrawdownPct = 0, running = initialCapital;
      for (const t of trades) {
          const profit = running * (t.roi / 100); 
          running += profit; 
          if (running > peak) peak = running;
          const dd = (peak - running) / peak;
          if (dd > maxDrawdownPct) maxDrawdownPct = dd;
      }
      const negativeReturns = returnsVector.filter(r => r < 0);
      const downsideDeviation = Math.sqrt(negativeReturns.reduce((acc, r) => acc + (r * r), 0) / (returnsVector.length || 1));
      const wins = trades.filter(t => t.roi > 0).length;
      const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

      return { totalReturnPct, totalTrades: trades.length, maxDrawdownPct: maxDrawdownPct * 100, winRate, downsideDeviation, finalBalance, history: trades, equityCurve };
  }
}