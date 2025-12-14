import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config'; // <--- 1. Importar isto
import { AiOptimizerController } from './ai-optimizer.controller';
import { AiOptimizerService } from './ai-optimizer.service';

@Module({
  imports: [
    // 2. Configurar o carregamento do .env
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env', // Força a leitura do .env na raiz
    }), 
    HttpModule
  ], 
  controllers: [AiOptimizerController],
  providers: [AiOptimizerService],
})
export class AiOptimizerModule {}