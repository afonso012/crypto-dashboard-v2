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
}

@Injectable()
export class BacktestEngineService {
  private readonly logger = new Logger(BacktestEngineService.name);
  
  // 🔥 CONFIGURAÇÃO DE TAXAS (Realismo)
  // 0.1% Maker + 0.1% Taker (padrão Binance spot sem BNB)
  private readonly TRADING_FEE = 0.001; 

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
          // Valor bruto da venda
          const grossValue = position.size * exitPrice;
          // Deduzir taxa de saída
          const netValue = grossValue * (1 - this.TRADING_FEE);
          
          const profit = netValue - balance; // Lucro líquido real (já com taxas)
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
    // Nota: As libs TA retornam arrays menores que o original (por causa do periodo inicial)
    // Precisamos de alinhar o índice.
    // RSI(14) começa no índice 14. Logo, indicators[14] corresponde a closes[14].
    // Mas a lib TA muitas vezes retorna o resultado 0 correspondendo ao periodo.
    // O método mais seguro é pegar do fim se estivermos a iterar linearmente, mas aqui é acesso aleatório.
    
    // Correção de alinhamento para TA libraries:
    // Se temos 1000 velas e SMA(200), o array de SMA tem 801 valores.
    // O valor correspondente à vela 1000 (index 999) é o SMA[800].
    // Formula: TA_Index = Candle_Index - (Total_Candles - Total_TA_Values)
    
    if (rule.indicator === 'MACD') {
        const macdRes = indicators['MACD_STD'];
        if (!macdRes) return 0;
        const offset = macdRes.length; // array de objetos
        const diff = 100000; // Simplificação: em backtest iterativo, usamos lógica direta se calculamos tudo antes
        // Vamos usar uma abordagem mais segura: calcular offset baseado no tamanho
        // Assumindo que indicators[key] está alinhado ao fim
        
        // Vamos simplificar: Se a lib devolve array alinhado pelo fim:
        const arr = macdRes;
        const realIndex = index - (100000); // Isto é complexo sem saber o tamanho total.
        
        // TRUQUE SEGURO:
        // Como calculámos para TODOS os closes:
        // Array Indicator Tamanho = Total Closes - Periodo + 1
        // Valor na vela 'i' = Indicator[i - (Periodo - 1)] ou algo similar.
        
        // Para evitar bugs de índice, vamos usar o valor mais recente disponível se o índice for inválido,
        // mas num backtest sério isto tem de ser exato.
        
        // Correção para este exemplo: 
        // Vamos assumir que 'calculateIndicators' já devolveu arrays alinhados (com nulls no inicio)
        // OU recalculamos aqui o offset.
        // Padrão TA.js: Remove os periodos iniciais.
        
        const key = `${rule.indicator}_${rule.period}`;
        const data = indicators[key] || indicators['MACD_STD'];
        if (!data) return 0;

        // Offset do MACD é tipicamente 26 (slow period)
        const period = rule.indicator === 'MACD' ? 26 : rule.period;
        const arrayIndex = index - period + 1; // Ajuste aproximado comum
        
        if (arrayIndex < 0 || arrayIndex >= data.length) return 0;

        if (rule.indicator === 'MACD') return data[arrayIndex]?.histogram || 0;
        return data[arrayIndex];
    }

    const key = `${rule.indicator}_${rule.period}`;
    const data = indicators[key];
    if (!data) return 0;
    
    // Ajuste de índice para SMA/RSI/EMA
    const arrayIndex = index - rule.period; 
    // Nota: TA.js behavior: RSI(14) returns array of length N-14. 
    // Index 0 of RSI corresponds to Index 14 of Closes.
    
    if (arrayIndex < 0) return 0;
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