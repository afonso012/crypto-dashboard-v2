// Ficheiro: apps/api-server/src/app.module.ts (CORRIGIDO E ROBUSTO)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entidades
import { Kline } from './entities/kline.entity';
import { BboTick } from './entities/bbo-tick.entity';
import { User } from './entities/user.entity';
import { TrackedSymbol } from './entities/tracked-symbol.entity';
import { OtpCode } from './entities/otp-code.entity';
import { Strategy as StrategyEntity} from './entities/strategy.entity';

// Módulos
import { MarketModule } from './market/market.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { NewsModule } from './news/news.module';
import { BacktestResult } from './entities/backtest-result.entity';
import { Strategy } from 'passport-jwt';
import { StrategiesModule } from './strategies/strategies.module';

@Module({
  imports: [
    // Carrega as variáveis de ambiente globalmente
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '../../.env', // Sobe 2 níveis (apps/api-server -> apps -> root)
    }),
    
    // Configuração Assíncrona do TypeORM (Mais segura)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<number>('DB_PORT');
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        const database = configService.get<string>('DB_NAME');

        console.log('DEBUG PASSWORD:', password ? '********' : 'UNDEFINED');

        console.log(`[TypeORM] A conectar a: ${host}:${port} (User: ${username}, DB: ${database})`);

        return {
          type: 'postgres',
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          entities: [Kline, BboTick, User, TrackedSymbol, OtpCode, BacktestResult, StrategyEntity],
          synchronize: true,
        };
      },
    }),
    
    MarketModule,
    AuthModule,
    AdminModule,
    NewsModule,
    StrategiesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}