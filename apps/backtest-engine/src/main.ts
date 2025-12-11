import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { BacktestEngineModule } from './backtest-engine.module'; // Ou './app.module' se não mudaste o nome

async function bootstrap() {
  const logger = new Logger('BacktestEngine');
  
  // Cria a aplicação sem servidor HTTP padrão (se quiséssemos ser puristas), 
  // mas para manter simples e ter healthchecks, usamos o padrão.
  const app = await NestFactory.create(BacktestEngineModule);
  
  // 🔥 CORREÇÃO: Usar porta 3002 para não chocar com a API (3000)
  const PORT = process.env.BACKTEST_PORT || 3002;
  
  await app.listen(PORT);
  
  logger.log(`🚀 Backtest Engine a correr na porta ${PORT}`);
}
bootstrap();