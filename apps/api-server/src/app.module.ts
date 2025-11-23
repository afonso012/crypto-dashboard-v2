// Ficheiro: apps/api-server/src/app.module.ts (VERSÃO CORRIGIDA)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Kline } from './entities/kline.entity';
import { BboTick } from './entities/bbo-tick.entity';
import { TrackedSymbol } from './entities/tracked-symbol.entity';
import { MarketModule } from './market/market.module'; // O import está correto
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { OtpCode } from './entities/otp-code.entity'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'mysecretpassword',
      database: 'postgres',
      entities: [Kline, BboTick, User, TrackedSymbol, OtpCode],

      synchronize: true,
    }), // << A configuração do TypeOrmModule termina aqui
    
    MarketModule, // << O MarketModule deve estar aqui, como um item separado na lista
    AuthModule,
    AdminModule,
  ],
  controllers: [], // Os controllers principais podem ficar vazios
  providers: [],   // Os providers principais podem ficar vazios
})
export class AppModule {}