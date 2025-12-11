import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StrategyGene, SimulationResult, StrategyRule, IndicatorType, ComparisonOperator } from './genetic-bot.types';

@Injectable()
export class AiOptimizerService {
  private readonly logger = new Logger(AiOptimizerService.name);
  
  // Portas dos teus serviços (Backtest Engine e API Server)
  private readonly BACKTEST_URL = process.env.BACKTEST_URL || 'http://backtest-engine:3002/backtest/run'; 
  private readonly API_URL = process.env.API_URL || 'http://api-server:8081/strategies';

  constructor(private readonly httpService: HttpService) {}

  // ===========================================================================
  // ⛏️ MÉTODO PÚBLICO: MINERAÇÃO DE ESTRATÉGIAS (Loop de Persistência)
  // ===========================================================================
  async mineStrategy(symbol: string, maxAttempts: number = 10) {
    this.logger.log(`⛏️ INICIAR MINERAÇÃO MANUAL para ${symbol} (Tentativas Máx: ${maxAttempts})...`);

    // Definir a Janela de Treino Padrão (Últimos 18 Meses)
    // Isto garante que a estratégia é relevante para o mercado atual
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - 18); 

    for (let i = 1; i <= maxAttempts; i++) {
        this.logger.log(`🔄 Tentativa ${i}/${maxAttempts}...`);
        
        // Executa o WFA. Se falhar, retorna null. Se passar, retorna o campeão.
        const champion = await this.runOptimization(dataInicio, hoje, symbol);

        if (champion) {
            this.logger.log(`💎 SUCESSO! Estratégia vencedora encontrada na tentativa ${i}.`);
            this.logger.log(`📈 ROI VALIDADO: ${champion.stats.roi.toFixed(2)}%`);
            return champion; // Encontrámos ouro! Retorna e para o loop.
        } else {
            this.logger.warn(`⚠️ Tentativa ${i} falhou (Rejeitada pelo WFA). A tentar outra vez...`);
        }
    }

    this.logger.error('❌ FIM: Esgotámos as tentativas. O mercado está difícil hoje.');
    return null;
  }

  // ===========================================================================
  // 🚀 MÉTODO CENTRAL: WALK-FORWARD ANALYSIS (WFA)
  // ===========================================================================
  async runOptimization(startDate: Date, endDate: Date, symbol: string) {
    this.logger.log(`🚀 A iniciar Walk-Forward Analysis (WFA) para ${symbol}...`);

    // CONFIGURAÇÃO DO WFA (Janelas Deslizantes)
    // Treino: 3 Meses | Teste: 1 Mês
    const trainWindowMonths = 3;
    const testWindowMonths = 1;

    let currentStart = new Date(startDate);
    let totalWalkForwardProfit = 0;
    const performanceLog: any[] = [];
    
    // Vamos acumular o histórico de todas as trades de validação para o gráfico
    let fullTradeHistory: any[] = [];
    
    let bestGeneSoFar: StrategyGene | null = null;

    // LOOP WFA (Avança no tempo)
    while (true) {
        // 1. Definir Datas das Janelas
        const trainEnd = new Date(currentStart);
        trainEnd.setMonth(trainEnd.getMonth() + trainWindowMonths);

        const testEnd = new Date(trainEnd);
        testEnd.setMonth(testEnd.getMonth() + testWindowMonths);

        // Parar se ultrapassar a data final global
        if (testEnd > endDate) break;

        this.logger.log(`\n📅 CICLO: Treino [${trainEnd.toISOString().slice(0,7)}] -> Validação [${testEnd.toISOString().slice(0,7)}]`);

        // 2. FASE DE OTIMIZAÇÃO (IN-SAMPLE)
        // A AI treina no passado recente para encontrar a melhor config para este momento
        const bestOfPeriod = await this.optimizeForPeriod(currentStart, trainEnd, symbol);
        
        if (!bestOfPeriod) {
            this.logger.warn('⚠️ Nenhuma estratégia viável neste período de treino.');
            currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
            continue;
        }

        // 3. FASE DE VALIDAÇÃO (OUT-OF-SAMPLE)
        // Testamos a estratégia no mês seguinte (que ela desconhece)
        const validationResult = await this.runBacktest(bestOfPeriod.gene, trainEnd, testEnd, symbol);
        
        if (validationResult) {
            this.logger.log(`📊 Resultado Real (OOS): ROI ${validationResult.totalReturnPct.toFixed(2)}% | DD ${validationResult.maxDrawdownPct.toFixed(2)}%`);
            
            totalWalkForwardProfit += validationResult.totalReturnPct;
            
            // Log para tabela
            performanceLog.push({
                period: `${trainEnd.toISOString().slice(0,7)}`,
                roi: validationResult.totalReturnPct,
                drawdown: validationResult.maxDrawdownPct
            });

            // Guardar histórico real para o gráfico
            if (validationResult.history && Array.isArray(validationResult.history)) {
                fullTradeHistory = [...fullTradeHistory, ...validationResult.history];
            }

            // Atualizamos o "Campeão Atual"
            bestGeneSoFar = bestOfPeriod.gene;
        }

        // 4. Avançar a Janela
        currentStart.setMonth(currentStart.getMonth() + testWindowMonths);
    }

    // --- ANÁLISE FINAL ---
    this.logger.log('🏁 WFA Concluído!');
    this.logger.log(`💰 Retorno Acumulado (Líquido): ${totalWalkForwardProfit.toFixed(2)}%`);
    
    // Tabela bonita no terminal
    console.table(performanceLog);

    // CRITÉRIOS DE APROVAÇÃO (Com tolerância a taxas)
    // > 10% Lucro Total E Menos de 10 meses negativos (num período de 18 meses)
    const failedMonths = performanceLog.filter(p => p.roi < -2).length; 

    if (totalWalkForwardProfit > 10 && failedMonths <= 10 && bestGeneSoFar) {
        this.logger.log('✅ APROVADO: Estratégia robusta encontrada.');
        
        const avgRoi = totalWalkForwardProfit / (performanceLog.length || 1);

        // Guardar na API
        await this.saveStrategy(bestGeneSoFar, symbol, totalWalkForwardProfit, avgRoi, fullTradeHistory);

        // Retorna o resultado para o Mineiro saber que teve sucesso
        return { 
            gene: bestGeneSoFar, 
            stats: { roi: totalWalkForwardProfit } 
        };
    } else {
        this.logger.error(`❌ REJEITADO: Lucro ${totalWalkForwardProfit.toFixed(2)}% insuficiente ou instável.`);
        return null; // Retorna null para tentar de novo
    }
  }

  // ===========================================================================
  // 🧬 HELPER: OTIMIZADOR GENÉTICO (Para um período específico)
  // ===========================================================================
  private async optimizeForPeriod(start: Date, end: Date, symbol: string): Promise<SimulationResult | null> {
    // População pequena para ser rápido (WFA exige velocidade)
    let population: StrategyGene[] = Array.from({ length: 15 }, () => this.generateRandomGene()); 
    let bestResult: SimulationResult | null = null;

    // 5 Gerações de Evolução
    for (let generation = 1; generation <= 5; generation++) {
      const results: SimulationResult[] = [];
      
      for (const gene of population) {
         const data = await this.runBacktest(gene, start, end, symbol);
         if (data) {
             const fitness = this.calculateFitness(data);
             // Usar Profit Factor corrigido para evitar NaN
             const metrics = this.calculateAdvancedMetrics(data.history);
             
             // Função de Fitness com penalizações
             let adjustedFitness = fitness;
             if(metrics.profitFactor < 1) adjustedFitness -= 100;

             results.push({ 
                 gene, 
                 fitness: adjustedFitness, 
                 stats: { roi: data.totalReturnPct, trades: data.totalTrades, winRate: data.winRate, drawdown: data.maxDrawdownPct } 
             });
         }
      }
      
      if (results.length === 0) continue;
      
      // Ordenar por Fitness
      results.sort((a, b) => b.fitness - a.fitness);
      if (!bestResult || results[0].fitness > bestResult.fitness) bestResult = results[0];

      // Reprodução (Elitismo + Mutação)
      const survivors = results.slice(0, 5).map(r => r.gene); // Top 5 sobrevivem
      const children: StrategyGene[] = [];
      
      while (children.length < 15) {
          const parent = survivors[Math.floor(Math.random() * survivors.length)];
          const child = JSON.parse(JSON.stringify(parent));
          
          // 40% chance de mutação
          if (Math.random() < 0.4 && child.entryRules.length > 0) {
             const idx = Math.floor(Math.random() * child.entryRules.length);
             child.entryRules[idx] = this.generateRandomRule();
          }
          children.push(child);
      }
      population = [...survivors, ...children];
    }
    return bestResult;
  }

  // ===========================================================================
  // 📐 HELPERS: CÁLCULOS E REGRAS
  // ===========================================================================
  
  private calculateFitness(data: any): number {
    if (data.totalTrades < 5) return -1000; // Penaliza inatividade
    
    // Sharpe Ratio Simplificado: Retorno / Risco
    const risk = data.maxDrawdownPct === 0 ? 0.1 : data.maxDrawdownPct;
    return (data.totalReturnPct / risk) * 100;
  }

  private calculateAdvancedMetrics(trades: any[]) {
    if (!trades || trades.length === 0) {
      return { sortino: 0, sqn: 0, winRate: 0, profitFactor: 0 }; // Prevenir NaN
    }
    // (Cálculo simplificado para poupar espaço)
    let grossWin = 0;
    let grossLoss = 0;
    trades.forEach((t: any) => {
        const pnl = t.roi; // Assumindo ROI como proxy de PnL
        if (pnl > 0) grossWin += pnl;
        else grossLoss += Math.abs(pnl);
    });
    const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
    return { sortino: 0, sqn: 0, winRate: 0, profitFactor };
  }

  private generateRandomGene(): StrategyGene {
    const numEntry = Math.floor(Math.random() * 3) + 1;
    const numExit = Math.floor(Math.random() * 2);
    return {
      entryRules: Array.from({ length: numEntry }, () => this.generateRandomRule()),
      exitRules: Array.from({ length: numExit }, () => this.generateRandomRule()),
      stopLossPct: (Math.random() * 0.05) + 0.02, // 2% a 7% SL
      takeProfitPct: (Math.random() * 0.15) + 0.03, // 3% a 18% TP
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
  // 🔌 HELPERS: CONEXÕES HTTP
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
      } catch (e) { return null; }
  }

  private async saveStrategy(gene: StrategyGene, symbol: string, totalRoi: number, avgRoi: number, history: any[]) {
    
    this.logger.log(`💾 A analisar histórico... (Total: ${history?.length})`);
      if (history && history.length > 0) {
          // JSON.stringify vai mostrar TODAS as propriedades: { entryPrice: ..., exitPrice: ..., ???: ... }
          this.logger.log(`🔎 TRADE OBJECT: ${JSON.stringify(history[0])}`);
      }

    try {
      // 1. CALCULAR WIN RATE REAL
      const wins = history.filter(t => t.roi > 0).length;
      const winRate = history.length > 0 ? (wins / history.length) * 100 : 0;

      // 2. CALCULAR DRAWDOWN REAL (Máximo declínio acumulado)
      let peak = 1000; // Capital inicial base
      let currentBalance = 1000;
      let maxDrawdown = 0;

      for (const trade of history) {
          // Aplica o ROI da trade ao saldo
          // Nota: trade.roi vem em percentagem (ex: 5.5 para 5.5%)
          currentBalance = currentBalance * (1 + (trade.roi / 100));
          
          if (currentBalance > peak) {
              peak = currentBalance;
          }

          const dd = (peak - currentBalance) / peak;
          if (dd > maxDrawdown) {
              maxDrawdown = dd;
          }
      }

      const apiPayload = {
          name: `WFA-Pro-${new Date().getTime()}`,
          symbol: symbol,
          config: gene,
          roi: totalRoi,
          drawdown: maxDrawdown * 100, // Converter para % (ex: 25.5)
          winRate: winRate,
          trades: history.length,
          trainStartDate: new Date(), 
          trainEndDate: new Date(),
          tradeHistory: history // O histórico real vai aqui
      };

      await firstValueFrom(this.httpService.post(this.API_URL, apiPayload));
      this.logger.log(`💾 Estratégia WFA guardada! (WinRate: ${winRate.toFixed(1)}% | DD: ${(maxDrawdown*100).toFixed(1)}%)`);
    } catch (e) { 
        this.logger.error('Erro ao guardar: ' + e.message); 
    }
}
}