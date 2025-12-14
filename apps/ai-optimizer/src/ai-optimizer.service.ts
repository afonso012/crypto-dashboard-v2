import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StrategyGene, SimulationResult, StrategyRule, IndicatorType, ComparisonOperator, INDICATOR_GRID } from './genetic-bot.types';

@Injectable()
export class AiOptimizerService {
  private readonly logger = new Logger(AiOptimizerService.name);
  
  private readonly BACKTEST_URL = process.env.BACKTEST_URL || 'http://backtest-engine:3002/backtest/run'; 
  private readonly API_URL = process.env.API_URL || 'http://api-server:8081/strategies';

  constructor(private readonly httpService: HttpService) {}

  // ===========================================================================
  // ⛏️ MINERAÇÃO
  // ===========================================================================
  async mineStrategy(symbol: string, maxAttempts: number = 10) {
    this.logger.log(`⛏️ INICIAR MINERAÇÃO HÍBRIDA para ${symbol}...`);

    // Janela de Tempo: Últimos 12 meses (Foco no mercado recente)
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - 18); 

    for (let i = 1; i <= maxAttempts; i++) {
        this.logger.log(`🔄 Tentativa ${i}/${maxAttempts}...`);
        const champion = await this.runOptimization(dataInicio, hoje, symbol);

        if (champion) {
            this.logger.log(`💎 SUCESSO! ROI: ${champion.stats.roi.toFixed(2)}% | DD: ${champion.stats.drawdown.toFixed(2)}%`);
            return champion;
        }
    }
    this.logger.error('❌ Nenhuma estratégia robusta encontrada.');
    return null;
  }

  // ===========================================================================
  // 🚀 WFA (Walk-Forward Analysis)
  // ===========================================================================
  async runOptimization(startDate: Date, endDate: Date, symbol: string) {
    this.logger.log(`🚀 WFA em curso...`);

    const trainWindowMonths = 3;
    const testWindowMonths = 1;

    let currentStart = new Date(startDate);
    let totalProfit = 0;
    const log: any[] = [];
    let fullHistory: any[] = [];
    let bestGene: StrategyGene | null = null;

    while (true) {
        const trainEnd = new Date(currentStart);
        trainEnd.setMonth(trainEnd.getMonth() + trainWindowMonths);
        const testEnd = new Date(trainEnd);
        testEnd.setMonth(testEnd.getMonth() + testWindowMonths);

        if (testEnd > endDate) break;

        this.logger.log(`📅 TREINO: [${trainEnd.toISOString().slice(0,7)}] -> TESTE: [${testEnd.toISOString().slice(0,7)}]`);

        // OTIMIZAÇÃO
        const best = await this.optimizeForPeriod(currentStart, trainEnd, symbol);
        
        if (!best) {
            this.logger.warn('⚠️ Sem estratégia viável no treino.');
            currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
            continue;
        }

        // VALIDAÇÃO (OOS)
        const res = await this.runBacktest(best.gene, trainEnd, testEnd, symbol);
        
        if (res) {
            this.logger.log(`📊 OOS Resultado: ROI ${res.totalReturnPct.toFixed(2)}% | DD ${res.maxDrawdownPct.toFixed(2)}%`);
            totalProfit += res.totalReturnPct;
            log.push({ period: testEnd.toISOString().slice(0,7), roi: res.totalReturnPct, dd: res.maxDrawdownPct });
            if (res.history) fullHistory = [...fullHistory, ...res.history];
            bestGene = best.gene;
        }

        currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
    }

    const maxDD = Math.max(...log.map(p => p.dd));
    
    // CRITÉRIOS DE ACEITAÇÃO MENOS RÍGIDOS
    // Aceitamos lucro pequeno se o DD for baixo
    const isViable = totalProfit > 0 && maxDD < 20;

    if (isViable && bestGene) {
        await this.saveStrategy(bestGene, symbol, totalProfit, maxDD, fullHistory);
        return { gene: bestGene, stats: { roi: totalProfit, drawdown: maxDD, sortino: 0, trades: 0, winRate: 0 } };
    }
    return null;
  }

  // ===========================================================================
  // 🌱 SEMENTES INTELIGENTES (AQUI ESTÁ A CHAVE!)
  // ===========================================================================
  private getClassicStrategies(): StrategyGene[] {
    const seeds: StrategyGene[] = [];

    // 1. "CRASH HUNTER" (Short Agressivo)
    // Se o preço subir muito rápido (RSI > 75) numa tendência de baixa (Preço < EMA 50), VENDE.
    seeds.push({
        entryRulesLong: [], // Este bot só faz Short
        entryRulesShort: [
            { indicator: IndicatorType.RSI, period: 14, operator: ComparisonOperator.GREATER_THAN, value: 70, weight: 1 },
            { indicator: IndicatorType.EMA, period: 50, operator: ComparisonOperator.LESS_THAN, value: 'PRICE', weight: 1 }
        ],
        exitRulesLong: [], exitRulesShort: [],
        stopLossType: 'ATR', stopLossPct: 0, atrMultiplier: 2, atrPeriod: 14,
        takeProfitPct: 0.08, breakEvenPct: 0.02, trendFilter: false, adxMin: 15,
        feePct: 0.001, slippagePct: 0.0005
    });

    // 2. "TREND SURFER" (Long Only - Conservador)
    // Compra Pullbacks (RSI < 40) mas apenas se tendência for de alta (Preço > EMA 200)
    seeds.push({
        entryRulesLong: [
            { indicator: IndicatorType.RSI, period: 14, operator: ComparisonOperator.LESS_THAN, value: 40, weight: 1 },
        ],
        entryRulesShort: [],
        exitRulesLong: [], exitRulesShort: [],
        stopLossType: 'ATR', stopLossPct: 0, atrMultiplier: 2.5, atrPeriod: 14,
        takeProfitPct: 0.12, breakEvenPct: 0.015, trendFilter: true, adxMin: 20,
        feePct: 0.001, slippagePct: 0.0005
    });

    // 3. "BREAKOUT" (Híbrido)
    // Se preço cruzar SMA 20 e houver volatilidade, entra.
    seeds.push({
        entryRulesLong: [{ indicator: IndicatorType.SMA, period: 20, operator: ComparisonOperator.LESS_THAN, value: 'PRICE', weight: 1 }],
        entryRulesShort: [{ indicator: IndicatorType.SMA, period: 20, operator: ComparisonOperator.GREATER_THAN, value: 'PRICE', weight: 1 }],
        exitRulesLong: [], exitRulesShort: [],
        stopLossType: 'FIXED', stopLossPct: 0.02, atrMultiplier: 0, atrPeriod: 0,
        takeProfitPct: 0.05, breakEvenPct: 0.01, trendFilter: false, adxMin: 25, // Exige tendência forte
        feePct: 0.001, slippagePct: 0.0005
    });

    return seeds;
  }

  // ===========================================================================
  // 🧬 EVOLUÇÃO
  // ===========================================================================
  private async optimizeForPeriod(start: Date, end: Date, symbol: string): Promise<SimulationResult | null> {
    const POPULATION_SIZE = 60; // Tamanho médio para rapidez
    const GENERATIONS = 15;

    const seeds = this.getClassicStrategies();
    const randomCount = POPULATION_SIZE - seeds.length;
    let population: StrategyGene[] = [...seeds, ...Array.from({ length: randomCount }, () => this.generateRandomGene())];
    
    let bestResult: SimulationResult | null = null;

    for (let generation = 1; generation <= GENERATIONS; generation++) {
      const results: SimulationResult[] = [];
      
      for (const gene of population) {
         const data = await this.runBacktest(gene, start, end, symbol);
         if (data) {
             const fitness = this.calculateFitness(data);
             results.push({ gene, fitness, stats: { roi: data.totalReturnPct, trades: data.totalTrades, winRate: data.winRate, drawdown: data.maxDrawdownPct, sharpe: 0, sortino: 0 } });
         }
      }
      
      if (results.length === 0) continue;
      results.sort((a, b) => b.fitness - a.fitness);
      if (!bestResult || results[0].fitness > bestResult.fitness) bestResult = results[0];

      // Elitismo e Reprodução
      const survivors = results.slice(0, 10).map(r => r.gene);
      const children: StrategyGene[] = [];
      
      while (children.length < POPULATION_SIZE) {
          const parent = survivors[Math.floor(Math.random() * survivors.length)];
          const child = JSON.parse(JSON.stringify(parent));
          
          // MUTAÇÃO: Relaxar regras para encontrar trades
          if (Math.random() < 0.3) {
             if (child.adxMin > 10) child.adxMin -= 2; // Tenta ser menos exigente
          }
          if (Math.random() < 0.3) {
             child.breakEvenPct = Math.random() * 0.02 + 0.005; // Ajusta proteção
          }

          children.push(child);
      }
      population = [...survivors, ...children];
    }
    return bestResult;
  }

  private calculateFitness(data: any): number {
    if (data.totalTrades < 3) return -100; // Pelo menos 3 trades para ter significância
    if (data.totalReturnPct <= 0) return data.totalReturnPct; 

    // Fitness Institucional: Retorno ajustado ao Risco (Calmar Ratio simplificado)
    // Se DD for 0, usamos 0.5 para não dividir por zero
    const dd = data.maxDrawdownPct === 0 ? 0.5 : data.maxDrawdownPct;
    const score = data.totalReturnPct / dd;
    
    return score;
  }

  private generateRandomGene(): StrategyGene {
    const numEntry = Math.floor(Math.random() * 2) + 1;

    return {
      entryRulesLong: Array.from({ length: numEntry }, () => this.generateRandomRule()),
      entryRulesShort: Array.from({ length: numEntry }, () => this.generateRandomRule()),
      exitRulesLong: [], exitRulesShort: [],
      
      stopLossType: Math.random() > 0.5 ? 'ATR' : 'FIXED', 
      stopLossPct: [0.015, 0.02, 0.03][Math.floor(Math.random() * 3)],
      atrMultiplier: [1.5, 2.0, 2.5, 3.0][Math.floor(Math.random() * 4)],
      atrPeriod: 14,
      takeProfitPct: [0.04, 0.06, 0.10, 0.15][Math.floor(Math.random() * 4)],
      breakEvenPct: [0.01, 0.015, 0.02][Math.floor(Math.random() * 3)],
      
      // 🔥 AQUI ESTÁ A MUDANÇA: ADX MAIS BAIXO (10-20)
      trendFilter: Math.random() > 0.4, 
      adxMin: [10, 15, 20][Math.floor(Math.random() * 3)], 

      feePct: 0.001, slippagePct: 0.0005 
    };
  }

  private generateRandomRule(): StrategyRule {
    // Usar GRELHA para consistência
    const indicator = ['RSI', 'SMA', 'EMA'][Math.floor(Math.random() * 3)];
    const op = [ComparisonOperator.GREATER_THAN, ComparisonOperator.LESS_THAN][Math.floor(Math.random() * 2)];
    
    let value: number | 'PRICE' = 0;
    let period = 14;

    if (indicator === 'RSI') { 
        value = [25, 30, 35, 65, 70, 75][Math.floor(Math.random() * 6)]; 
        period = INDICATOR_GRID.RSI_PERIODS[Math.floor(Math.random() * INDICATOR_GRID.RSI_PERIODS.length)];
    } else { 
        value = 'PRICE'; 
        period = INDICATOR_GRID.EMA_PERIODS[Math.floor(Math.random() * INDICATOR_GRID.EMA_PERIODS.length)];
    }
    
    return { indicator: indicator as IndicatorType, period, operator: op, value, weight: 1 };
  }

  // --- HELPERS DE REDE ---
  private async runBacktest(gene: StrategyGene, start: Date, end: Date, symbol: string): Promise<any> {
      try {
        const response = await firstValueFrom(this.httpService.post(this.BACKTEST_URL, {
            symbol, startDate: start, endDate: end, initialCapital: 1000, strategy: gene
        }));
        return response.data;
      } catch (e) { return null; }
  }

  private async saveStrategy(gene: StrategyGene, symbol: string, roi: number, dd: number, history: any[]) {
      try {
        await firstValueFrom(this.httpService.post(this.API_URL, {
            name: `Institucional-${new Date().getTime().toString().slice(-4)}`,
            symbol, config: gene, roi, drawdown: dd, winRate: 0, trades: history.length, tradeHistory: history,
            trainStartDate: new Date(), trainEndDate: new Date()
        }));
        this.logger.log(`💾 ESTRATÉGIA SALVA COM SUCESSO!`);
      } catch (e) { this.logger.error('Erro ao salvar estratégia'); }
  }
}