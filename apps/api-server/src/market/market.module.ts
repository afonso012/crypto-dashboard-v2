// Ficheiro: apps/api-server/src/market/market.module.ts (VERSÃO CORRIGIDA)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BboTick } from '../entities/bbo-tick.entity';
import { Kline } from '../entities/kline.entity';
import { MarketController } from './market.controller'; // << APENAS UMA LINHA
import { MarketService } from './market.service';
import { TrackedSymbol } from '../entities/tracked-symbol.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kline, BboTick, TrackedSymbol])],
  controllers: [MarketController],
  providers: [MarketService],
})
export class MarketModule {}