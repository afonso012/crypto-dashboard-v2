export enum IndicatorType {
  RSI = 'RSI',
  MACD = 'MACD',
  SMA = 'SMA',
  EMA = 'EMA',
  ADX = 'ADX',
  CORR_BTC = 'CORR_BTC'
}

export enum ComparisonOperator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  CROSS_OVER = 'CROSS_OVER',
  CROSS_UNDER = 'CROSS_UNDER',
}

// ⚡ A GRELHA INSTITUCIONAL (Partilhada)
export const INDICATOR_GRID = {
  RSI_PERIODS: [14, 21],
  EMA_PERIODS: [9, 21, 50, 100, 200],
  SMA_PERIODS: [20, 50, 200],
  ATR_PERIODS: [14],
  ADX_PERIODS: [14],
  CORR_PERIODS: [14]
};

export interface StrategyRule {
  indicator: IndicatorType;
  period: number;
  operator: ComparisonOperator;
  value: number | 'PRICE'; 
  weight: number;
}

export interface StrategyGene {
  // Regras
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
  
  // Proteção
  breakEvenPct: number; 

  // Filtros
  trendFilter: boolean;
  adxMin: number;

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
    sharpe: number;
    sortino: number;
  };
}