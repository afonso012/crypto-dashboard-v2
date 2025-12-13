import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Kline } from './entities/kline.entity'; // Certifica-te que o caminho está correto
import * as TA from 'technicalindicators';

// Tipos para as regras (iguais aos do optimizer)
export interface StrategyRule {
  indicator: string;
  period: number;
  operator: string;
  value: number | 'PRICE';
}

export interface StrategyConfig {
  entryRules: StrategyRule[];
  exitRules: StrategyRule[];
  stopLossPct: number;
  takeProfitPct: number;
  slippagePct?: number; 
  feePct?: number;
}

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);
  
 

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
    // 1. Buscar Dados Históricos
    const klines = await this.klineRepo.find({
      where: {
        symbol: params.symbol,
        // 🔥 CORREÇÃO: Math.floor garante que enviamos inteiros para o Postgres
        time: Between(
            Math.floor(params.startDate.getTime() / 1000), 
            Math.floor(params.endDate.getTime() / 1000)
        ),
      },
      order: { time: 'ASC' },
    });

    if (klines.length < 200) {
      return { error: 'Dados insuficientes para calcular indicadores (min 200 velas).' };
    }

    // 2. Preparar Indicadores (Pre-calculation para performance)
    const closes = klines.map(k => parseFloat(k.close));
    const indicators = this.calculateIndicators(closes, params.strategy);

    // 3. Simulação Loop
    let balance = params.initialCapital;
    let position: { entryPrice: number; size: number; entryIndex: number } | null = null;
    const trades = [];
    
    // Histórico de saldo para o gráfico (Equity Curve)
    const equityCurve = [{ date: new Date(klines[0].time * 1000), balance }];

    // Começamos no índice 200 para garantir que há dados para as médias móveis
    for (let i = 200; i < klines.length; i++) {
      const candle = klines[i];
      const currentPrice = parseFloat(candle.close);
      const currentDate = new Date(candle.time * 1000);

      // A. Se NÃO temos posição aberta -> Procurar Entrada
      if (!position) {
        if (this.checkEntryRules(i, currentPrice, params.strategy.entryRules, indicators)) {
          // COMPRAR
          // Deduzimos a taxa de entrada imediatamente
          const size = (balance * (1 - this.TRADING_FEE)) / currentPrice;
          
          position = {
            entryPrice: currentPrice,
            size: size,
            entryIndex: i
          };
        }
      } 
      
      // B. Se TEMOS posição aberta -> Procurar Saída (TP / SL ou Regra)
      else {
        let exitPrice = 0;
        let reason = '';

        // 1. Verificar Stop Loss
        const slPrice = position.entryPrice * (1 - params.strategy.stopLossPct);
        // Verificar Take Profit
        const tpPrice = position.entryPrice * (1 + params.strategy.takeProfitPct);
        
        // Verificamos os extremos da vela (Low e High) para ver se tocou no preço
        const low = parseFloat(candle.low);
        const high = parseFloat(candle.high);

        if (low <= slPrice) {
          exitPrice = slPrice; // Assumimos que saiu no preço do SL (pode haver slippage na real)
          reason = 'STOP_LOSS';
        } else if (high >= tpPrice) {
          exitPrice = tpPrice;
          reason = 'TAKE_PROFIT';
        } else if (this.checkExitRules(i, currentPrice, params.strategy.exitRules, indicators)) {
          exitPrice = currentPrice;
          reason = 'EXIT_RULE';
        }

        // Executar Venda
        if (exitPrice > 0) {
          // 1. Definir Taxas e Slippage (com valores por defeito conservadores)
          const fee = params.strategy.feePct ?? 0.001; // 0.1% default
          const slippage = params.strategy.slippagePct ?? 0.0005; // 0.05% default
          
          // 2. Aplicar Slippage ao Preço de Saída
          // Se estamos a VENDER, o slippage baixa o preço que recebemos.
          // (Se fosse COMPRA, aumentaria o preço que pagamos).
          let realExitPrice = exitPrice * (1 - slippage);

          // 3. Simulação de "Pior Caso" em Stop Loss
          // Se foi um Stop Loss, o deslize costuma ser maior (pânico de mercado)
          if (reason === 'STOP_LOSS') {
             realExitPrice = exitPrice * (1 - (slippage * 2)); 
          }

          // 4. Cálculos Financeiros
          const grossValue = position.size * realExitPrice;
          const netValue = grossValue * (1 - fee);
          
          const profit = netValue - balance; 
          const roiPct = ((netValue - balance) / balance) * 100;

          balance = netValue;

          trades.push({
            entryDate: new Date(klines[position.entryIndex].time * 1000),
            exitDate: currentDate,
            entryPrice: position.entryPrice,
            exitPrice: exitPrice,
            roi: roiPct,
            reason
          });

          position = null;
        }
      }

      // Registar evolução do saldo (1x por dia ou a cada trade para poupar memória)
      // Aqui registamos sempre que há trade ou a cada X velas
      if (!position || i % 60 === 0) { // Regista a cada hora
          equityCurve.push({ date: currentDate, balance: position ? balance : balance }); // Nota: Se tiver em trade, o saldo "flutuante" não conta aqui para simplificar
      }
    }

    // 4. Calcular Estatísticas Finais
    const totalReturnPct = ((balance - params.initialCapital) / params.initialCapital) * 100;
    
    // Calcular Drawdown
    let peak = params.initialCapital;
    let maxDrawdownPct = 0;
    
    // Simulação simples de DD baseada nos fechos de trade
    let runningBalance = params.initialCapital;
    for (const trade of trades) {
        const tradeProfit = runningBalance * (trade.roi / 100); // Aproximação
        runningBalance += tradeProfit;
        if (runningBalance > peak) peak = runningBalance;
        const dd = (peak - runningBalance) / peak;
        if (dd > maxDrawdownPct) maxDrawdownPct = dd;
    }

    const wins = trades.filter(t => t.roi > 0).length;
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;

    return {
      totalReturnPct,
      totalTrades: trades.length,
      maxDrawdownPct: maxDrawdownPct * 100, // Converter para percentagem (40.5)
      winRate,
      finalBalance: balance,
      history: trades,
      // Opcional: equityCurve (se quiseres desenhar o gráfico detalhado no frontend)
      equityCurve 
    };
  }

  // --- MÉTODOS AUXILIARES ---

  private calculateIndicators(closes: number[], strategy: StrategyConfig) {
    const indicators: any = {};
    const rules = [...strategy.entryRules, ...strategy.exitRules];

    // Extrair indicadores únicos necessários
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
        // MACD padrão geralmente é 12, 26, 9. O 'period' na regra pode ser usado para o sinal
        indicators['MACD_STD'] = TA.MACD.calculate({ 
            values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false 
        });
      }
    });
    return indicators;
  }

  private checkEntryRules(index: number, currentPrice: number, rules: StrategyRule[], indicators: any): boolean {
    if (rules.length === 0) return true; // Se não houver regras, entra logo (perigoso, mas lógico)

    return rules.every(rule => {
      const val = this.getIndicatorValue(index, rule, indicators);
      const target = rule.value === 'PRICE' ? currentPrice : rule.value;
      return this.compare(val, rule.operator, target);
    });
  }

  private checkExitRules(index: number, currentPrice: number, rules: StrategyRule[], indicators: any): boolean {
    if (rules.length === 0) return false; // Sem regras de saída explícitas (só TP/SL)

    return rules.some(rule => { // 'some' porque qualquer regra de saída deve fechar
      const val = this.getIndicatorValue(index, rule, indicators);
      const target = rule.value === 'PRICE' ? currentPrice : rule.value;
      return this.compare(val, rule.operator, target);
    });
  }

  private getIndicatorValue(index: number, rule: StrategyRule, indicators: any) {
    // LÓGICA DE ALINHAMENTO EXATO (Anti-Repintura)
    // A biblioteca 'technicalindicators' retorna arrays mais pequenos que o original.
    // Exemplo SMA(20): O primeiro valor válido aparece na vela 20.
    // O array de resultados começa no índice 0, que corresponde à vela 19 (0-indexed).
    // Portanto: Valor da Vela[i] = Resultado[i - Periodo]

    if (rule.indicator === 'MACD') {
        // O MACD é especial porque combina duas EMAs e um Signal.
        // Padrão (12, 26, 9):
        // 1. Slow EMA (26) começa a existir no índice 25.
        // 2. Signal (9) precisa de mais 8 valores sobre o MACD.
        // Offset Total = 26 + 9 - 1 = 34 velas de aquecimento.
        
        const offset = 34; // Ajustado para configurações padrão (12, 26, 9)
        
        const macdResults = indicators['MACD_STD'];
        if (!macdResults) return 0;

        // O índice no array do indicador é o índice atual MENOS o aquecimento
        const arrayIndex = index - offset;

        // Se ainda não temos dados suficientes (estamos nas primeiras velas), retorna 0
        if (arrayIndex < 0 || arrayIndex >= macdResults.length) return 0;

        // Retornamos o histograma, que é o gatilho mais comum
        return macdResults[arrayIndex]?.histogram || 0;
    }

    // Para indicadores simples (RSI, SMA, EMA)
    const key = `${rule.indicator}_${rule.period}`;
    const data = indicators[key];

    if (!data) {
        // Fallback de segurança se o indicador não tiver sido calculado
        return 0;
    }

    // O offset é exatamente o período do indicador
    const arrayIndex = index - rule.period;

    // Verificação de limites
    if (arrayIndex < 0 || arrayIndex >= data.length) return 0;

    return data[arrayIndex];
  }

  private compare(a: number, op: string, b: number): boolean {
    switch (op) {
      case '<': return a < b;
      case '>': return a > b;
      case '=': return Math.abs(a - b) < 0.0001;
      default: return false;
    }
  }
}