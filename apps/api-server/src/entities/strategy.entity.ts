import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('strategies')
export class Strategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ex: "BTC-Optimized-Gen5"

  @Column()
  symbol: string; // "BTCUSDT"

  // O "Cérebro" da estratégia (Regras, StopLoss, etc.)
  @Column('jsonb')
  config: any; 

  // Métricas de Performance (Snapshot do momento da criação)
  @Column('float')
  roi: number;

  @Column('float')
  drawdown: number;

  @Column('float')
  winRate: number;

  @Column('int')
  trades: number;

  // Intervalo de datas usado no treino
  @Column({ type: 'timestamp' })
  trainStartDate: Date;

  @Column({ type: 'timestamp' })
  trainEndDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column('jsonb', { nullable: true })
  tradeHistory: any[]; // Vamos guardar aqui as trades para fazer o gráfico
}