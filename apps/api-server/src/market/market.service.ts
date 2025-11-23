// Ficheiro: apps/api-server/src/market/market.service.ts (VERSÃO COM TEMPO REAL)

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BboTick } from '../entities/bbo-tick.entity';
import { Kline } from '../entities/kline.entity';
import { Between, Repository } from 'typeorm';
import { TrackedSymbol, SymbolStatus } from '../entities/tracked-symbol.entity';

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  constructor(
    @InjectRepository(Kline)
    private readonly klineRepository: Repository<Kline>,
    // << ADICIONADO: Injetamos o repositório de BBO >>
    @InjectRepository(BboTick)
    private readonly bboTickRepository: Repository<BboTick>,
    @InjectRepository(TrackedSymbol)
    private readonly symbolRepository: Repository<TrackedSymbol>,
  ) {}

  // ... (a tua função getHistory(...) permanece igual) ...
  async getHistory(symbol: string, startTime: number, endTime: number) {
    this.logger.log(`Buscando histórico de velas para ${symbol}...`);
    return this.klineRepository.find({
      where: { symbol, time: Between(startTime, endTime) },
      order: { time: 'ASC' },
    });
  }

  // ... (a tua função getAggregatedSpread(...) permanece igual) ...

  // << NOVO MÉTODO PARA O "PULSAR" >>
  async getRealtimeUpdates(symbols: string[]) {
    const updates: { [key: string]: any } = {};

    for (const symbol of symbols) {
      // 1. Obter a última vela (a que está a ser atualizada)
      const lastKline = await this.klineRepository.findOne({
        where: { symbol },
        order: { time: 'DESC' }, // Ordena por tempo descendente e pega na primeira
      });

      // 2. Obter o último tick de BBO (para o spread "ao vivo")
      const lastBbo = await this.bboTickRepository.findOne({
        where: { symbol },
        order: { timestamp_ms: 'DESC' }, // Ordena por milissegundo descendente
      });

      let liveSpread = 0;
      if (lastBbo) {
        liveSpread = lastBbo.askPrice - lastBbo.bidPrice;
      }

      updates[symbol] = {
        kline: lastKline,
        spread: {
          time: lastKline?.time, // Usa o tempo da vela para sincronia
          value: liveSpread,
        },
      };
    }
    return updates;
  }

  async getActiveSymbols(): Promise<string[]> {
    const symbols = await this.symbolRepository.find({
      where: { status: SymbolStatus.ACTIVE }, // Só retorna símbolos ATIVOS
      order: { symbol: 'ASC' }, // Ordena alfabeticamente
    });
    // Retorna apenas os nomes, ex: ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
    return symbols.map(s => s.symbol);
  }
}