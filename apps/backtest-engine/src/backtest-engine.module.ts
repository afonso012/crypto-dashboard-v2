import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { TechnicalAnalysisModule } from '@app/technical-analysis';
import { Kline } from '../../data-collector/src/entities/kline.entity';
import * as path from 'path';

import { BacktestEngineController } from './backtest-engine.controller';
import { BacktestEngineService } from './backtest-engine.service';

@Module({
  imports: [
    // 1. Carregar o ficheiro .env da raiz
    ConfigModule.forRoot({ 
      isGlobal: true, 
      envFilePath: path.join(process.cwd(), '.env') // Garante que encontra o ficheiro na raiz
    }),
    
    // 2. Base de Dados (Usando as chaves do .env)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // CORREÇÃO: Usar o NOME da variável no .env, não o valor direto
        const host = config.get('DB_HOST') || 'localhost';
        const port = config.get('DB_PORT') || 5432;
        const username = config.get('DB_USERNAME') || 'user';
        const password = config.get('DB_PASSWORD') || 'passwordSegura123';
        const database = config.get('DB_NAME') || 'optafund';

        console.log(`[BacktestEngine] A ligar a Postgres: ${host}:${port}`);

        return {
          type: 'postgres',
          host: host,
          port: Number(port),
          username: username,
          password: password,
          database: database,
          entities: [Kline], 
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature([Kline]),

    // 3. Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: 'localhost',
          port: 6379,
        },
      }),
    }),

    TechnicalAnalysisModule,
  ],
  controllers: [BacktestEngineController],
  providers: [BacktestEngineService],
})
export class BacktestEngineModule {}