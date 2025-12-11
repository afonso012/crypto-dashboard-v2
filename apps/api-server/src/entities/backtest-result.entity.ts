import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('backtest_results')
export class BacktestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  symbol: string; // ex: BTCUSDT

  @Column()
  strategyName: string; // ex: "RSI_MACD_CROSS"

  @Column('jsonb')
  parameters: any; // ex: { rsiPeriod: 14, macdFast: 12 }

  @Column('float')
  totalReturnPct: number; // ROI final (ex: 15.5%)

  @Column('float')
  maxDrawdownPct: number; // Risco máximo (ex: -5.2%)

  @Column('float')
  winRate: number; // ex: 0.65 (65%)

  @Column('int')
  totalTrades: number;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @CreateDateColumn()
  executedAt: Date;
}