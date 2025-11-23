// Ficheiro: apps/data-collector/src/entities/bbo-tick.entity.ts (VERSÃO FINAL E CORRIGIDA)

import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'bbo_ticks' })
export class BboTick {
  // Chave Primária Composta: A combinação de 'timestamp_ms' e 'symbol' deve ser única.
  @PrimaryColumn({ type: 'bigint' })
  timestamp_ms: number;

  @PrimaryColumn({ type: 'text' }) // << ALTERAÇÃO CRÍTICA AQUI
  symbol: string;

  @Column({ type: 'double precision' })
  askPrice: number;

  @Column({ type: 'double precision' })
  bidPrice: number;

  @Column({ type: 'double precision' })
  askQty: number;

  @Column({ type: 'double precision' })
  bidQty: number;
}