export enum IndicatorType {
    RSI = 'RSI',
    MACD = 'MACD', // Usa o Histograma
    SMA = 'SMA',   // Preço vs SMA
    EMA = 'EMA',   // Preço vs EMA
  }
  
  export enum ComparisonOperator {
    GREATER_THAN = '>',
    LESS_THAN = '<',
    CROSS_UP = 'CROSS_UP',     // Cruzou para cima
    CROSS_DOWN = 'CROSS_DOWN', // Cruzou para baixo
  }
  
  export enum ActionType {
    BUY_SIGNAL = 'BUY',
    SELL_SIGNAL = 'SELL',
    WAIT = 'WAIT'
  }
  
  export interface StrategyRule {
    indicator: IndicatorType;
    period: number;       // ex: 14 para RSI
    source?: 'close' | 'open'; 
    operator: ComparisonOperator;
    value: number | 'PRICE'; // Comparar com um número (30) ou com o Preço Atual
    weight: number;       // Importância desta regra (0 a 1)
    action: ActionType;   // O que fazer se for verdade?
  }
  
  export interface DynamicStrategyConfig {
    entryRules: StrategyRule[];
    exitRules: StrategyRule[];
    stopLossPct: number;
    takeProfitPct: number;
    maxDrawdownLimitPct?: number; // Kill switch se a estratégia correr mal
  }