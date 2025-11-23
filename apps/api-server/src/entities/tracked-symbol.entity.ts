import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum SymbolStatus {
  ACTIVE = 'active', // A ser ativamente monitorizado e atualizado
  INACTIVE = 'inactive', // Pausado (não monitorizado)
  BACKFILLING = 'backfilling', // A ser preenchido com dados históricos
}

@Entity({ name: 'tracked_symbols' })
export class TrackedSymbol {
  @PrimaryColumn({ type: 'text' })
  symbol: string; // ex: "BTCUSDT"

  @Column({
    type: 'enum',
    enum: SymbolStatus,
    default: SymbolStatus.BACKFILLING, // Começa como "backfilling"
  })
  status: SymbolStatus;

  @CreateDateColumn()
  addedAt: Date;
}