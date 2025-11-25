// Ficheiro: apps/api-server/src/main.ts (VERSÃO FINAL DE PRODUÇÃO)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MarketService } from './market/market.service';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm'; 
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrackedSymbol, SymbolStatus } from './entities/tracked-symbol.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // << 🔥 1. CORREÇÃO DE CORS (CRÍTICO) 🔥 >>
  // Permite pedidos do teu domínio de produção
  app.enableCors({ 
    origin: [
      'http://localhost:5173', 
      'https://optafund.com', 
      'https://www.optafund.com'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    transform: true, 
    transformOptions: { enableImplicitConversion: true },
  }));

  const server = http.createServer(app.getHttpAdapter().getInstance());
  const wss = new WebSocketServer({ server });

  await app.init(); 
  
  const marketService = app.get(MarketService);
  // << 🔥 2. RECUPERAR LÓGICA DINÂMICA 🔥 >>
  const symbolRepository = app.get<Repository<TrackedSymbol>>(getRepositoryToken(TrackedSymbol));

  const broadcastUpdates = async () => {
    try {
      // Busca símbolos ativos na BD em vez de usar lista estática
      const symbols = await symbolRepository.find({
        where: { status: SymbolStatus.ACTIVE }
      });
      const symbolsToTrack = symbols.map(s => s.symbol);

      if (symbolsToTrack.length === 0) return;

      const updates = await marketService.getRealtimeUpdates(symbolsToTrack);

      wss.clients.forEach(client => {
        if (client.readyState !== WebSocket.OPEN) return;
        
        for (const symbol in updates) {
          const updateData = updates[symbol];
          if (updateData.kline) {
            client.send(JSON.stringify({
              type: 'kline_update',
              data: updateData.kline 
            }));
          }
        }
      });
    } catch (error) {
      console.error("Erro no pulsar de tempo real:", error);
    }
  };
  
  setInterval(broadcastUpdates, 1000); 

  server.listen(8081, () => {
    console.log(`[API] Servidor da API e WebSocket a correr na porta 8081`);
  });
}
bootstrap();