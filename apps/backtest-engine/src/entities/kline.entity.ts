import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('klines_1m')
@Index(['symbol', 'time'], { unique: true }) 
export class Kline {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  symbol: string;

  @Column({ type: 'bigint' })
  time: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  open: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  high: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  low: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  close: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  volume: string;
}