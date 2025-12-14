import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StrategyGene, SimulationResult, StrategyRule, IndicatorType, ComparisonOperator } from './genetic-bot.types';

@Injectable()
export class AiOptimizerService {
  private readonly logger = new Logger(AiOptimizerService.name);
  
  // Lê do .env ou usa defaults
  private readonly BACKTEST_URL = process.env.BACKTEST_URL || 'http://backtest-engine:3002/backtest/run'; 
  private readonly API_URL = process.env.API_URL || 'http://api-server:8081/strategies';

  constructor(private readonly httpService: HttpService) {}

  // ===========================================================================
  // ⛏️ MÉTODO PÚBLICO: MINERAÇÃO DE ESTRATÉGIAS
  // ===========================================================================
  async mineStrategy(symbol: string, maxAttempts: number = 10) {
    this.logger.log(`⛏️ INICIAR MINERAÇÃO INSTITUCIONAL para ${symbol} (Tentativas: ${maxAttempts})...`);

    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - 18); // Treinar nos últimos 18 meses

    for (let i = 1; i <= maxAttempts; i++) {
        this.logger.log(`🔄 Tentativa ${i}/${maxAttempts}...`);
        
        // Executa o WFA
        const champion = await this.runOptimization(dataInicio, hoje, symbol);

        if (champion) {
            this.logger.log(`💎 SUCESSO! Estratégia encontrada na tentativa ${i}.`);
            this.logger.log(`📈 ROI VALIDADO: ${champion.stats.roi.toFixed(2)}% | Sortino: ${champion.stats.sortino.toFixed(2)}`);
            return champion;
        } else {
            this.logger.warn(`⚠️ Tentativa ${i} falhou. A reiniciar evolução...`);
        }
    }

    this.logger.error('❌ FIM: O mercado está difícil. Nenhuma estratégia robusta encontrada hoje.');
    return null;
  }

  // ===========================================================================
  // 🚀 MÉTODO CENTRAL: WALK-FORWARD ANALYSIS (WFA)
  // ===========================================================================
  async runOptimization(startDate: Date, endDate: Date, symbol: string) {
    this.logger.log(`🚀 A iniciar WFA (Long/Short) para ${symbol}...`);

    // Configuração WFA
    const trainWindowMonths = 3;
    const testWindowMonths = 1;

    let currentStart = new Date(startDate);
    let totalWalkForwardProfit = 0;
    const performanceLog: any[] = [];
    let fullTradeHistory: any[] = [];
    let bestGeneSoFar: StrategyGene | null = null;

    while (true) {
        // 1. Definir Janelas
        const trainEnd = new Date(currentStart);
        trainEnd.setMonth(trainEnd.getMonth() + trainWindowMonths);

        const testEnd = new Date(trainEnd);
        testEnd.setMonth(testEnd.getMonth() + testWindowMonths);

        if (testEnd > endDate) break;

        this.logger.log(`📅 TREINO: [${trainEnd.toISOString().slice(0,7)}] -> TESTE: [${testEnd.toISOString().slice(0,7)}]`);

        // 2. OTIMIZAÇÃO (In-Sample)
        const bestOfPeriod = await this.optimizeForPeriod(currentStart, trainEnd, symbol);
        
        if (!bestOfPeriod) {
            this.logger.warn('⚠️ Nenhuma estratégia sobreviveu ao treino. A saltar mês...');
            currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
            continue;
        }

        // 3. VALIDAÇÃO (Out-of-Sample)
        const validationResult = await this.runBacktest(bestOfPeriod.gene, trainEnd, testEnd, symbol);
        
        if (validationResult) {
            this.logger.log(`📊 OOS Resultado: ROI ${validationResult.totalReturnPct.toFixed(2)}% | DD ${validationResult.maxDrawdownPct.toFixed(2)}%`);
            
            totalWalkForwardProfit += validationResult.totalReturnPct;
            
            performanceLog.push({
                period: `${trainEnd.toISOString().slice(0,7)}`,
                roi: validationResult.totalReturnPct,
                drawdown: validationResult.maxDrawdownPct
            });

            if (validationResult.history) {
                fullTradeHistory = [...fullTradeHistory, ...validationResult.history];
            }

            bestGeneSoFar = bestOfPeriod.gene;
        }

        currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
    }

    // --- ANÁLISE FINAL ---
    this.logger.log(`💰 Lucro Total WFA: ${totalWalkForwardProfit.toFixed(2)}%`);
    console.table(performanceLog);

    // Critérios de Aceitação (Mais flexíveis para começar)
    // ROI Positivo e Drawdown controlado
    const isProfitable = totalWalkForwardProfit > 5; 
    const maxDD = Math.max(...performanceLog.map(p => p.drawdown));
    
    if (isProfitable && maxDD < 30 && bestGeneSoFar) {
        const avgRoi = totalWalkForwardProfit / (performanceLog.length || 1);
        await this.saveStrategy(bestGeneSoFar, symbol, totalWalkForwardProfit, avgRoi, fullTradeHistory);
        return { gene: bestGeneSoFar, stats: { roi: totalWalkForwardProfit, sortino: 0, trades: 0, winRate: 0, drawdown: maxDD } };
    } else {
        return null;
    }
  }

  // ===========================================================================
  // 🧬 HELPER: OTIMIZADOR GENÉTICO (CORRIGIDO PARA LONG/SHORT)
  // ===========================================================================
  private async optimizeForPeriod(start: Date, end: Date, symbol: string): Promise<SimulationResult | null> {
    const POPULATION_SIZE = 20;
    const GENERATIONS = 5; // Rápido para WFA

    let population: StrategyGene[] = Array.from({ length: POPULATION_SIZE }, () => this.generateRandomGene()); 
    let bestResult: SimulationResult | null = null;

    for (let generation = 1; generation <= GENERATIONS; generation++) {
      const results: SimulationResult[] = [];
      
      // Avaliar cada indivíduo
      for (const gene of population) {
         const data = await this.runBacktest(gene, start, end, symbol);
         if (data) {
             const fitness = this.calculateFitness(data);
             results.push({ 
                 gene, 
                 fitness, 
                 stats: { 
                     roi: data.totalReturnPct, 
                     trades: data.totalTrades, 
                     winRate: data.winRate, 
                     drawdown: data.maxDrawdownPct,
                     sharpe: 0, 
                     sortino: 0 
                 } 
             });
         }
      }
      
      if (results.length === 0) continue;
      
      // Seleção Natural
      results.sort((a, b) => b.fitness - a.fitness);
      if (!bestResult || results[0].fitness > bestResult.fitness) bestResult = results[0];

      // Reprodução
      const survivors = results.slice(0, 5).map(r => r.gene); 
      const children: StrategyGene[] = [];
      
      while (children.length < POPULATION_SIZE) {
          // Copiar pai
          const parent = survivors[Math.floor(Math.random() * survivors.length)];
          const child = JSON.parse(JSON.stringify(parent));
          
          // 🔥 MUTAÇÃO CORRIGIDA (Suporta Long e Short)
          if (Math.random() < 0.4) {
             // 50/50 mudar regra de Long ou Short
             const isLong = Math.random() > 0.5;
             const rules = isLong ? child.entryRulesLong : child.entryRulesShort;
             
             // Mutar uma regra existente
             if (rules && rules.length > 0) {
                 const idx = Math.floor(Math.random() * rules.length);
                 rules[idx] = this.generateRandomRule();
             }
          }

          // Mutar parâmetros de risco (Opcional)
          if (Math.random() < 0.2) {
              child.stopLossPct = (Math.random() * 0.05) + 0.01;
          }

          children.push(child);
      }
      population = [...survivors, ...children];
    }
    return bestResult;
  }

  // ===========================================================================
  // 📐 HELPERS: LÓGICA E MATEMÁTICA
  // ===========================================================================
  
  private calculateFitness(data: any): number {
    if (data.totalTrades < 5) return -1000; 
    if (data.totalReturnPct <= 0) return data.totalReturnPct; // Se perde dinheiro, fitness é negativo

    // Fitness Híbrido: Sortino Ratio + Win Rate
    // Queremos lucro estável (Sortino) e consistência (WinRate)
    const downside = data.downsideDeviation || 1; 
    const sortino = data.totalReturnPct / downside;
    
    return (sortino * 50) + (data.winRate * 0.5);
  }

  private generateRandomGene(): StrategyGene {
    const numEntry = Math.floor(Math.random() * 2) + 1;

    return {
      // DNA Híbrido: Regras para Long e Short
      entryRulesLong: Array.from({ length: numEntry }, () => this.generateRandomRule()),
      entryRulesShort: Array.from({ length: numEntry }, () => this.generateRandomRule()),
      
      exitRulesLong: [], 
      exitRulesShort: [], 
      
      stopLossType: Math.random() > 0.6 ? 'ATR' : 'FIXED', 
      stopLossPct: (Math.random() * 0.04) + 0.01, 
      atrMultiplier: (Math.random() * 2.5) + 1.5,
      atrPeriod: 14,
      takeProfitPct: (Math.random() * 0.10) + 0.02, 
      breakEvenPct: (Math.random() * 0.03) + 0.01, 
      trendFilter: Math.random() > 0.2, // 80% ativo

      feePct: 0.001, 
      slippagePct: 0.0005 
    };
  }

  private generateRandomRule(): StrategyRule {
    const types = [IndicatorType.RSI, IndicatorType.MACD, IndicatorType.SMA, IndicatorType.EMA];
    const indicator = types[Math.floor(Math.random() * types.length)];
    const operators = [ComparisonOperator.GREATER_THAN, ComparisonOperator.LESS_THAN];
    const op = operators[Math.floor(Math.random() * operators.length)];
    
    let value: number | 'PRICE' = 0;
    let period = 14;

    if (indicator === IndicatorType.RSI) { 
        value = Math.floor(Math.random() * 80) + 10; 
        period = Math.floor(Math.random() * 20) + 5; 
    } else if (indicator === IndicatorType.MACD) { 
        value = 0; 
    } else { 
        value = 'PRICE'; 
        period = Math.random() > 0.5 ? 20 : (Math.random() > 0.5 ? 50 : 200); 
    }
    return { indicator, period, operator: op, value, weight: Math.random() };
  }

  // ===========================================================================
  // 🔌 HELPERS: CONEXÕES
  // ===========================================================================

  private async runBacktest(gene: StrategyGene, start: Date, end: Date, symbol: string): Promise<any> {
      try {
        const response = await firstValueFrom(this.httpService.post(this.BACKTEST_URL, {
            symbol: symbol,
            startDate: start,
            endDate: end,
            initialCapital: 1000,
            strategy: gene
        }));
        return response.data;
      } catch (e) {
        // Log discreto para não poluir
        // this.logger.warn(`Backtest falhou: ${e.message}`);
        return null; 
      }
  }

  private async saveStrategy(gene: StrategyGene, symbol: string, totalRoi: number, avgRoi: number, history: any[]) {
    try {
      const wins = history.filter(t => t.roi > 0).length;
      const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;

      let peak = 1000;
      let currentBalance = 1000;
      let maxDrawdown = 0;

      for (const trade of history) {
          currentBalance = currentBalance * (1 + (trade.roi / 100));
          if (currentBalance > peak) peak = currentBalance;
          const dd = (peak - currentBalance) / peak;
          if (dd > maxDrawdown) maxDrawdown = dd;
      }

      const apiPayload = {
          name: `Alpha-Gen-${new Date().getTime().toString().slice(-4)}`,
          symbol: symbol,
          config: gene,
          roi: totalRoi,
          drawdown: maxDrawdown * 100, 
          winRate: winRate,
          trades: history.length,
          trainStartDate: new Date(), 
          trainEndDate: new Date(),
          tradeHistory: history 
      };

      await firstValueFrom(this.httpService.post(this.API_URL, apiPayload));
      this.logger.log(`💾 ESTRATÉGIA GUARDADA! (WinRate: ${winRate.toFixed(1)}% | DD: ${(maxDrawdown*100).toFixed(1)}%)`);
    } catch (e) { 
        this.logger.error('Erro ao guardar: ' + e.message); 
    }
  }
}