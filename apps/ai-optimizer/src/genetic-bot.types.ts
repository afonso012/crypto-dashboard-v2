export enum IndicatorType {
  RSI = 'RSI',
  MACD = 'MACD',
  SMA = 'SMA',
  EMA = 'EMA',
}

export enum ComparisonOperator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  CROSS_OVER = 'CROSS_OVER', // 🔥 NOVO: Cruzamento é mais forte que apenas > ou <
  CROSS_UNDER = 'CROSS_UNDER',
}

export interface StrategyRule {
  indicator: IndicatorType;
  period: number;
  operator: ComparisonOperator;
  value: number | 'PRICE'; 
  weight: number;
}

export interface StrategyGene {
  // Regras separadas para Long (Compra) e Short (Venda a Descoberto)
  entryRulesLong: StrategyRule[];
  entryRulesShort: StrategyRule[];
  
  exitRulesLong: StrategyRule[];
  exitRulesShort: StrategyRule[];
  
  // Gestão de Risco
  stopLossType: 'FIXED' | 'ATR'; 
  stopLossPct: number;
  atrMultiplier: number;
  atrPeriod: number;
  takeProfitPct: number;
  
  // 🔥 NOVO: Move o stop para o preço de entrada após X% de lucro
  breakEvenPct: number; 

  // Filtros
  trendFilter: boolean; // Se true: Long só > EMA200, Short só < EMA200

  // Custos
  slippagePct: number;
  feePct: number;
}

export interface SimulationResult {
  gene: StrategyGene;
  fitness: number;
  stats: {
    roi: number;
    trades: number;
    winRate: number;
    drawdown: number;
    sharpe: number;   // 🔥 NOVO
    sortino: number;  // 🔥 NOVO
  };
}

export const INDICATOR_GRID = {
  RSI_PERIODS: [14, 21, 28],      // Curto, Médio, Longo
  EMA_PERIODS: [9, 21, 50, 200],  // As médias móveis mais respeitadas
  MACD_SETTINGS: ['STD'],         // Standard (12, 26, 9)
  ATR_PERIODS: [14],              // Padrão de indústria
};