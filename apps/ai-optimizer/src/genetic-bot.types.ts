// --- Enumerações (O Vocabulário) ---
export enum IndicatorType {
  RSI = 'RSI',
  MACD = 'MACD',
  SMA = 'SMA',
  EMA = 'EMA',
}

export enum ComparisonOperator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
}

export enum ActionType {
  BUY_SIGNAL = 'BUY',
  SELL_SIGNAL = 'SELL',
  WAIT = 'WAIT'
}

// --- Estrutura da Regra ---
export interface StrategyRule {
  indicator: IndicatorType;
  period: number;
  operator: ComparisonOperator;
  value: number | 'PRICE'; 
  weight: number;
}

// --- O Novo DNA ---
export interface StrategyGene {
  entryRules: StrategyRule[];
  exitRules: StrategyRule[];
  stopLossPct: number;
  takeProfitPct: number;
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
  };
}