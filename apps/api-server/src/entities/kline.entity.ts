// Ficheiro: apps/api-server/src/entities/kline.entity.ts (ATUALIZADO)

import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'klines_1m' }) // Aponta para a tabela correta
export class Kline {
  @PrimaryColumn({ type: 'bigint' })
  time: number;

  @PrimaryColumn({ type: 'text' })
  symbol: string;

  @Column({ type: 'double precision' })
  open: number;

  @Column({ type: 'double precision' })
  high: number;

  @Column({ type: 'double precision' })
  low: number;

  @Column({ type: 'double precision' })
  close: number;

  @Column({ type: 'double precision' })
  volume: number;
  
  @Column({ type: 'bigint' })
  timestamp_ms: number;

  @Column({ type: 'double precision', nullable: true })
  avg_spread: number | null;;

  // << 🔥 ADICIONAR ESTAS COLUNAS (A CORREÇÃO) 🔥 >>

  @Column({ type: 'double precision', nullable: true })
  rsi: number | null;

  @Column({ type: 'double precision', nullable: true })
  macd_value: number | null;

  @Column({ type: 'double precision', nullable: true })
  macd_signal: number | null;

  @Column({ type: 'double precision', nullable: true })
  macd_histogram: number | null;

  // << 🔥 FIM DA CORREÇÃO 🔥 >>
}