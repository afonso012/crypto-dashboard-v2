import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

export enum SymbolStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BACKFILLING = 'backfilling',
}

@Entity({ name: 'tracked_symbols' })
export class TrackedSymbol {
  @PrimaryColumn({ type: 'text' })
  symbol: string; 

  @Column({
    type: 'enum',
    enum: SymbolStatus,
    default: SymbolStatus.BACKFILLING,
  })
  status: SymbolStatus;

  @CreateDateColumn()
  addedAt: Date;
}