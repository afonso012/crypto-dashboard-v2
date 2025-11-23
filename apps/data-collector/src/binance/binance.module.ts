import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BinanceService } from './binance.service';
import { Kline } from '../entities/kline.entity';
import { BboTick } from '../entities/bbo-tick.entity';
// << 🔥 1. IMPORTAR A NOVA ENTIDADE 🔥 >>
import { TrackedSymbol } from '../entities/tracked-symbol.entity';

@Module({
  imports: [
    // << 🔥 2. ADICIONAR A ENTIDADE AO ARRAY 🔥 >>
    TypeOrmModule.forFeature([Kline, BboTick, TrackedSymbol]),
  ],
  providers: [BinanceService],
})
export class BinanceModule {}