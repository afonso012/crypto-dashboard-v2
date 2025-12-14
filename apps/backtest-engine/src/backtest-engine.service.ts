import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Kline } from './entities/kline.entity';
import * as TA from 'technicalindicators';

// --- Interfaces Atualizadas para suportar Long/Short ---

export interface StrategyRule {
  indicator: string;
  period: number;
  operator: string;
  value: number | 'PRICE';
}

export interface StrategyConfig {
  // Regras separadas para Long e Short
  entryRulesLong: StrategyRule[];
  entryRulesShort: StrategyRule[];
  
  // Regras de Saída (Opcionais, usamos mais TP/SL)
  exitRulesLong?: StrategyRule[];
  exitRulesShort?: StrategyRule[];
  
  // Gestão de Risco
  stopLossType?: 'FIXED' | 'ATR'; 
  stopLossPct: number;           
  atrMultiplier?: number;        
  atrPeriod?: number;            
  takeProfitPct: number;
  
  // Proteção de Lucro
  breakEvenPct?: number; // Ex: 0.015 (1.5%)

  // Filtros
  trendFilter?: boolean;         

  // Custos de Mercado
  slippagePct?: number; 
  feePct?: number;
}

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);
  
  // ⚡ CACHE DE MEMÓRIA
  private dataCache = new Map<string, Kline[]>(); 

  constructor(
    @InjectRepository(Kline)
    private readonly klineRepo: Repository<Kline>,
  ) {}

  async runBacktest(params: {
    symbol: string;
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    strategy: StrategyConfig;
  }) {
    // 1. GESTÃO DE CACHE (Velocidade)
    const cacheKey = `${params.symbol}_${Math.floor(params.startDate.getTime()/1000)}_${Math.floor(params.endDate.getTime()/1000)}`;
    let klines: Kline[];

    if (this.dataCache.has(cacheKey)) {
        klines = this.dataCache.get(cacheKey);
    } else {
        this.logger.debug(`📉 Fetching DB: ${params.symbol}`);
        klines = await this.klineRepo.find({
          where: {
            symbol: params.symbol,
            time: Between(
                Math.floor(params.startDate.getTime() / 1000), 
                Math.floor(params.endDate.getTime() / 1000)
            ),
          },
          order: { time: 'ASC' },
        });
        this.dataCache.set(cacheKey, klines);
        if (this.dataCache.size > 50) this.dataCache.clear();
    }

    if (klines.length < 200) return { error: 'Dados insuficientes.' };

    // 2. PREPARAR DADOS
    const closes = klines.map(k => typeof k.close === 'string' ? parseFloat(k.close) : k.close);
    const highs = klines.map(k => typeof k.high === 'string' ? parseFloat(k.high) : k.high);
    const lows = klines.map(k => typeof k.low === 'string' ? parseFloat(k.low) : k.low);

    // Calcular Indicadores
    const indicators = this.calculateIndicators(closes, params.strategy, highs, lows);

    // 3. SIMULAÇÃO INSTITUCIONAL
    let balance = params.initialCapital;
    
    // Posição agora suporta 'LONG' ou 'SHORT'
    let position: { 
        side: 'LONG' | 'SHORT'; 
        entryPrice: number; 
        size: number; 
        entryIndex: number; 
        initialAtr?: number;
        isBreakEvenActive?: boolean; 
    } | null = null;

    const trades = [];
    const equityCurve = [{ date: new Date(klines[0].time * 1000), balance }];
    
    // Array para calcular Sortino (Desvio negativo)
    const returnsVector: number[] = [];

    for (let i = 200; i < klines.length; i++) {
      const candle = klines[i];
      const currentPrice = closes[i];
      const low = lows[i];
      const high = highs[i];
      const currentDate = new Date(candle.time * 1000);

      // Variáveis de Ambiente
      const fee = params.strategy.feePct ?? 0.001; 
      const slippage = params.strategy.slippagePct ?? 0.0005;
      
      const atrValue = indicators['ATR'] ? indicators['ATR'][i - (params.strategy.atrPeriod || 14)] : 0;
      const trendEma = indicators['TREND_EMA'] ? indicators['TREND_EMA'][i - 200] : 0;

      // -------------------------------------
      // A. SEM POSIÇÃO: Procurar Oportunidade
      // -------------------------------------
      if (!position) {
        
        // Regra de Filtro: Long só se Preço > EMA200, Short só se Preço < EMA200
        const isBullish = params.strategy.trendFilter ? (currentPrice > trendEma) : true;
        const isBearish = params.strategy.trendFilter ? (currentPrice < trendEma) : true;

        // 1. Tentar LONG
        if (isBullish && this.checkEntryRules(i, currentPrice, params.strategy.entryRulesLong, indicators)) {
            const entryPrice = currentPrice * (1 + slippage); // Compra no Ask (mais caro)
            const size = (balance * (1 - fee)) / entryPrice;
            
            position = { 
                side: 'LONG', 
                entryPrice, size, entryIndex: i, 
                initialAtr: atrValue 
            };
        }
        
        // 2. Tentar SHORT (Só se não entrou em Long)
        else if (isBearish && this.checkEntryRules(i, currentPrice, params.strategy.entryRulesShort, indicators)) {
            const entryPrice = currentPrice * (1 - slippage); // Vende no Bid (mais barato)
            // Em Short, "vendemos" o valor do saldo.
            const size = (balance * (1 - fee)) / entryPrice;
            
            position = { 
                side: 'SHORT', 
                entryPrice, size, entryIndex: i, 
                initialAtr: atrValue 
            };
        }
      } 
      
      // -------------------------------------
      // B. COM POSIÇÃO: Gerir Risco e Saída
      // -------------------------------------
      else {
        let exitPrice = 0;
        let reason = '';
        let slPrice = 0;
        let tpPrice = 0;

        // --- LÓGICA LONG ---
        if (position.side === 'LONG') {
            // 1. Calcular Stop Loss
            if (position.isBreakEvenActive) {
                slPrice = position.entryPrice * (1 + fee); // Stop no lucro mínimo
            } else if (params.strategy.stopLossType === 'ATR' && position.initialAtr > 0) {
                slPrice = position.entryPrice - (position.initialAtr * (params.strategy.atrMultiplier || 2));
            } else {
                slPrice = position.entryPrice * (1 - params.strategy.stopLossPct);
            }
            
            // 2. Calcular Take Profit
            tpPrice = position.entryPrice * (1 + params.strategy.takeProfitPct);

            // 3. Verificar Break-Even (Se subiu X%, protege)
            if (params.strategy.breakEvenPct && !position.isBreakEvenActive) {
                if (high >= position.entryPrice * (1 + params.strategy.breakEvenPct)) {
                    position.isBreakEvenActive = true;
                }
            }

            // 4. Verificar Saída (Low toca no Stop, High toca no TP)
            if (low <= slPrice) { exitPrice = slPrice; reason = 'STOP_LOSS'; }
            else if (high >= tpPrice) { exitPrice = tpPrice; reason = 'TAKE_PROFIT'; }
            else if (params.strategy.exitRulesLong && this.checkExitRules(i, currentPrice, params.strategy.exitRulesLong, indicators)) {
                exitPrice = currentPrice; reason = 'EXIT_RULE';
            }
        } 
        
        // --- LÓGICA SHORT ---
        else {
            // 1. Calcular Stop Loss (Short: Stop é acima do preço de entrada)
            if (position.isBreakEvenActive) {
                slPrice = position.entryPrice * (1 - fee); // Stop abaixo da entrada (lucro)
            } else if (params.strategy.stopLossType === 'ATR' && position.initialAtr > 0) {
                slPrice = position.entryPrice + (position.initialAtr * (params.strategy.atrMultiplier || 2));
            } else {
                slPrice = position.entryPrice * (1 + params.strategy.stopLossPct);
            }

            // 2. Calcular Take Profit (Short: TP é abaixo)
            tpPrice = position.entryPrice * (1 - params.strategy.takeProfitPct);

            // 3. Verificar Break-Even (Se desceu X%, protege)
            if (params.strategy.breakEvenPct && !position.isBreakEvenActive) {
                if (low <= position.entryPrice * (1 - params.strategy.breakEvenPct)) {
                    position.isBreakEvenActive = true;
                }
            }

            // 4. Verificar Saída (High toca no Stop, Low toca no TP)
            if (high >= slPrice) { exitPrice = slPrice; reason = 'STOP_LOSS'; }
            else if (low <= tpPrice) { exitPrice = tpPrice; reason = 'TAKE_PROFIT'; }
            else if (params.strategy.exitRulesShort && this.checkExitRules(i, currentPrice, params.strategy.exitRulesShort, indicators)) {
                exitPrice = currentPrice; reason = 'EXIT_RULE';
            }
        }

        // --- EXECUTAR SAÍDA ---
        if (exitPrice > 0) {
            let pnl = 0;
            let realExitPrice = 0;

            if (position.side === 'LONG') {
                // Venda Long: Recebemos menos com slippage
                realExitPrice = exitPrice * (1 - slippage);
                if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 - (slippage * 2)); // Pânico

                const grossValue = position.size * realExitPrice;
                const netValue = grossValue * (1 - fee);
                pnl = netValue - balance;
                balance = netValue;
            } else {
                // Compra Short (Cover): Pagamos mais com slippage
                realExitPrice = exitPrice * (1 + slippage);
                if (reason === 'STOP_LOSS') realExitPrice = exitPrice * (1 + (slippage * 2)); // Pânico

                // Lucro Short = (Entrada - Saída) * Tamanho - Taxas Totais
                const initialValue = position.size * position.entryPrice;
                const buyBackCost = position.size * realExitPrice;
                const totalFees = (initialValue * fee) + (buyBackCost * fee);
                
                pnl = initialValue - buyBackCost - totalFees;
                balance += pnl;
            }

            const roiPct = (pnl / (balance - pnl)) * 100;
            returnsVector.push(roiPct);

            trades.push({
                entryDate: new Date(klines[position.entryIndex].time * 1000),
                exitDate: currentDate,
                side: position.side,
                entryPrice: position.entryPrice,
                exitPrice: realExitPrice,
                roi: roiPct,
                reason
            });

            position = null;
        }
      }

      if (i % 60 === 0) equityCurve.push({ date: currentDate, balance: position ? balance : balance });
    }

    // 4. ESTATÍSTICAS AVANÇADAS
    const totalReturnPct = ((balance - params.initialCapital) / params.initialCapital) * 100;
    
    // Calcular Max Drawdown
    let peak = params.initialCapital;
    let maxDrawdownPct = 0;
    let runningBalance = params.initialCapital;
    for (const trade of trades) {
        const tradeProfit = runningBalance * (trade.roi / 100);
        runningBalance += tradeProfit;
        if (runningBalance > peak) peak = runningBalance;
        const dd = (peak - runningBalance) / peak;
        if (dd > maxDrawdownPct) maxDrawdownPct = dd;
    }

    // Calcular Downside Deviation (Para Sortino Ratio)
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
      downsideDeviation, // 🔥 Enviado para o Otimizador calcular Sortino
      finalBalance: balance,
      history: trades,
      equityCurve 
    };
  }

  // --- MÉTODOS AUXILIARES ---

  private calculateIndicators(closes: number[], strategy: StrategyConfig, highs?: number[], lows?: number[]) {
    const indicators: any = {};
    // Juntar todas as regras (Long + Short)
    const rules = [
        ...strategy.entryRulesLong, 
        ...strategy.entryRulesShort,
        ...(strategy.exitRulesLong || []),
        ...(strategy.exitRulesShort || [])
    ];

    rules.forEach(rule => {
      const key = `${rule.indicator}_${rule.period}`;
      if (indicators[key]) return;

      if (rule.indicator === 'RSI') {
        indicators[key] = TA.RSI.calculate({ period: rule.period, values: closes });
      } else if (rule.indicator === 'SMA') {
        indicators[key] = TA.SMA.calculate({ period: rule.period, values: closes });
      } else if (rule.indicator === 'EMA') {
        indicators[key] = TA.EMA.calculate({ period: rule.period, values: closes });
      } else if (rule.indicator === 'MACD') {
        indicators['MACD_STD'] = TA.MACD.calculate({ 
            values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false 
        });
      }
    });

    if (strategy.trendFilter) {
        indicators['TREND_EMA'] = TA.EMA.calculate({ period: 200, values: closes });
    }

    if (strategy.stopLossType === 'ATR' && highs && lows) {
        indicators['ATR'] = TA.ATR.calculate({ 
            period: strategy.atrPeriod || 14, 
            high: highs, 
            low: lows, 
            close: closes 
        });
    }

    return indicators;
  }

  private checkEntryRules(index: number, currentPrice: number, rules: StrategyRule[], indicators: any): boolean {
    if (!rules || rules.length === 0) return true;
    return rules.every(rule => {
      const val = this.getIndicatorValue(index, rule, indicators);
      const target = rule.value === 'PRICE' ? currentPrice : rule.value;
      return this.compare(val, rule.operator, target);
    });
  }

  private checkExitRules(index: number, currentPrice: number, rules: StrategyRule[], indicators: any): boolean {
    if (!rules || rules.length === 0) return false;
    return rules.some(rule => {
      const val = this.getIndicatorValue(index, rule, indicators);
      const target = rule.value === 'PRICE' ? currentPrice : rule.value;
      return this.compare(val, rule.operator, target);
    });
  }

  private getIndicatorValue(index: number, rule: StrategyRule, indicators: any) {
    if (rule.indicator === 'MACD') {
        const offset = 34; 
        const macdResults = indicators['MACD_STD'];
        if (!macdResults) return 0;
        const arrayIndex = index - offset;
        return (arrayIndex >= 0 && arrayIndex < macdResults.length) ? macdResults[arrayIndex]?.histogram || 0 : 0;
    }

    const key = `${rule.indicator}_${rule.period}`;
    const data = indicators[key];
    if (!data) return 0;

    const arrayIndex = index - rule.period;
    return (arrayIndex >= 0 && arrayIndex < data.length) ? data[arrayIndex] : 0;
  }

  private compare(a: number, op: string, b: number): boolean {
    switch (op) {
      case '>': return a > b;
      case '<': return a < b;
      case '=': return Math.abs(a - b) < 0.0001;
      // Adicionar suporte futuro para CrossOver se necessário
      default: return false;
    }
  }
}