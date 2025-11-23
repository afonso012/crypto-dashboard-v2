import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MarketService } from './market/market.service';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm'; 
import { getRepositoryToken } from '@nestjs/typeorm';
import { TrackedSymbol, SymbolStatus } from './entities/tracked-symbol.entity';

const SYMBOLS_TO_TRACK = ['BTCUSDT', 'ETHUSDT'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // << 🔥 A CORREÇÃO ESTÁ AQUI 🔥 >>
  // Permitimos o Localhost (para os teus testes) E o domínio de Produção
  app.enableCors({ 
    origin: [
      'http://localhost:5173', 
      'https://optafund.com', 
      'https://www.optafund.com'
    ],
    credentials: true, // Importante para cookies/auth headers
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
  const symbolRepository = app.get<Repository<TrackedSymbol>>(getRepositoryToken(TrackedSymbol));

  const broadcastUpdates = async () => {
    try {
      const symbols = await symbolRepository.find({
        where: { status: SymbolStatus.ACTIVE }
      });
      const symbolsToTrack = symbols.map(s => s.symbol);

      // Se não houver símbolos ativos, não faz nada
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
  
  setInterval(broadcastUpdates, 2000); 

  server.listen(8081, () => {
    console.log(`[API] Servidor da API e WebSocket a correr na porta 8081`);
  });
}
bootstrap();