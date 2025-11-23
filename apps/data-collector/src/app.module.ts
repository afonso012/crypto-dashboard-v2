// Ficheiro: apps/data-collector/src/app.module.ts (VERSÃO FINAL E LIMPA)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BinanceModule } from './binance/binance.module'; // Importa o nosso novo módulo
import { Kline } from './entities/kline.entity';
import { BboTick } from './entities/bbo-tick.entity';
import { TrackedSymbol } from './entities/tracked-symbol.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'mysecretpassword',
      database: 'postgres',
      entities: [Kline, BboTick, TrackedSymbol],
      synchronize: true,
    }),
    BinanceModule, // Adiciona o nosso módulo de lógica aqui
  ],
  // Já não precisamos do Controller nem do Service principais
  controllers: [],
  providers: [],
})
export class AppModule {}