import { DynamicStrategyConfig } from './strategy.types';

export class BacktestInputDto {
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  
  // 🔥 A Nova Estrutura da Estratégia
  strategy: DynamicStrategyConfig;
}

export class BacktestOutputDto {
  totalReturnPct: number;
  finalBalance: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  sortinoRatio: number; // Novo!
  sqn: number;          // Novo!
  totalTrades: number;
  winRate: number;
  history: any[];
}