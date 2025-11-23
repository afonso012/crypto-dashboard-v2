// Ficheiro: apps/api-server/src/main.ts (ATUALIZADO)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MarketService } from './market/market.service';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { ValidationPipe } from '@nestjs/common';
// << 🔥 1. IMPORTAR o 'AppModule' para aceder ao 'MarketService' 🔥 >>
import { INestApplicationContext } from '@nestjs/common';
import { Repository } from 'typeorm'; 
import { TrackedSymbol } from './entities/tracked-symbol.entity';
import { SymbolStatus } from './entities/tracked-symbol.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

// << 🔥 2. REMOVER A LISTA ESTÁTICA 🔥 >>
// const SYMBOLS_TO_TRACK = ['BTCUSDT', 'ETHUSDT'];
const SYMBOL_CHECK_INTERVAL = 30000; // Verifica a BD a cada 30 segundos

async function bootstrap() {

  console.log('--- DEBUG DE CONEXÃO ---');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_PORT:', process.env.DB_PORT);
  console.log('DB_USERNAME:', process.env.DB_USERNAME);
  console.log('------------------------');

  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: 'http://localhost:5173' });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    transform: true, 
    transformOptions: { enableImplicitConversion: true },
  }));

  const server = http.createServer(app.getHttpAdapter().getInstance());
  const wss = new WebSocketServer({ server });

  await app.init(); 
  
  // << 🔥 3. OBTER O 'MarketService' E O 'Repository' DA APP 🔥 >>
  const marketService = app.get(MarketService);
  const symbolRepository = app.get<Repository<TrackedSymbol>>(getRepositoryToken(TrackedSymbol));


  // << 🔥 4. NOVA LÓGICA DINÂMICA DO WEBSOCKET 🔥 >>
  const broadcastUpdates = async () => {
    try {
      // 1. Vai à BD buscar os símbolos ATIVOS
      const symbols = await symbolRepository.find({
        where: { status: SymbolStatus.ACTIVE }
      });
      const symbolsToTrack = symbols.map(s => s.symbol);

      // 2. Busca os últimos dados para esses símbolos
      const updates = await marketService.getRealtimeUpdates(symbolsToTrack);

      // 3. Envia para todos os clientes
      wss.clients.forEach(client => {
        if (client.readyState !== WebSocket.OPEN) return;
        
        for (const symbol in updates) {
          const updateData = updates[symbol];

          if (updateData.kline) {
            client.send(JSON.stringify({
              type: 'kline_update',
              data: updateData.kline // Esta kline JÁ TEM rsi, macd, avg_spread
            }));
          }
          
          // (Já não precisamos do 'spread_update' separado)
        }
      });
    } catch (error) {
      console.error("Erro no pulsar de tempo real:", error);
    }
  };
  
  // 5. Inicia o loop
  setInterval(broadcastUpdates, 2000); // O loop continua a correr a cada 2 segundos

  // 6. Inicia o servidor
  server.listen(8081, () => {
    console.log(`[API] Servidor da API e WebSocket a correr na porta 8081`);
  });
}
bootstrap();