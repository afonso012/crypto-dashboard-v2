// Ficheiro: apps/data-collector/src/app.module.ts (CORRIGIDO)

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Módulos
import { BinanceModule } from './binance/binance.module';

// Entidades
import { Kline } from './entities/kline.entity';
import { BboTick } from './entities/bbo-tick.entity';
import { TrackedSymbol } from './entities/tracked-symbol.entity';

@Module({
  imports: [
    // Carrega as variáveis de ambiente
    ConfigModule.forRoot({ isGlobal: true }),
    
    // (Opcional: para tarefas agendadas se precisarmos no futuro)
    ScheduleModule.forRoot(),
    
    // << 🔥 CONFIGURAÇÃO ROBUSTA DA BD 🔥 >>
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<number>('DB_PORT');
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        const database = configService.get<string>('DB_NAME');

        console.log(`[DataCollector] A conectar a: ${host}:${port} (User: ${username}, DB: ${database})`);

        return {
          type: 'postgres',
          host: host,
          port: port,
          username: username,
          password: password,
          database: database,
          // Garante que todas as entidades estão aqui
          entities: [Kline, BboTick, TrackedSymbol],
          synchronize: true,
        };
      },
    }),
    
    BinanceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}