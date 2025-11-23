// Ficheiro: apps/api-server/src/market/market.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BboTick } from '../entities/bbo-tick.entity';
import { Kline } from '../entities/kline.entity';
import { Between, Repository } from 'typeorm';
import { TrackedSymbol, SymbolStatus } from '../entities/tracked-symbol.entity';

// Interface para tipar a resposta da Binance
interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string; // Volume em USDT
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  constructor(
    @InjectRepository(Kline)
    private readonly klineRepository: Repository<Kline>,
    @InjectRepository(BboTick)
    private readonly bboTickRepository: Repository<BboTick>,
    @InjectRepository(TrackedSymbol)
    private readonly symbolRepository: Repository<TrackedSymbol>, // Nome correto aqui
  ) {}

  async getHistory(symbol: string, startTime: number, endTime: number) {
    this.logger.log(`Buscando histórico de velas para ${symbol}...`);
    return this.klineRepository.find({
      where: { symbol, time: Between(startTime, endTime) },
      order: { time: 'ASC' },
    });
  }

  async getRealtimeUpdates(symbols: string[]) {
    const updates: { [key: string]: any } = {};

    for (const symbol of symbols) {
      const lastKline = await this.klineRepository.findOne({
        where: { symbol },
        order: { time: 'DESC' },
      });

      const lastBbo = await this.bboTickRepository.findOne({
        where: { symbol },
        order: { timestamp_ms: 'DESC' },
      });

      let liveSpread = 0;
      if (lastBbo) {
        liveSpread = lastBbo.askPrice - lastBbo.bidPrice;
      }

      updates[symbol] = {
        kline: lastKline,
        spread: {
          time: lastKline?.time,
          value: liveSpread,
        },
      };
    }
    return updates;
  }

  async getActiveSymbols(): Promise<string[]> {
    const symbols = await this.symbolRepository.find({
      where: { status: SymbolStatus.ACTIVE },
      order: { symbol: 'ASC' },
    });
    return symbols.map(s => s.symbol);
  }

  // --- NOVA FUNÇÃO CORRIGIDA ---
  async getMarketOverview() {
    // 1. CORREÇÃO: Usar 'symbolRepository' e 'status: SymbolStatus.ACTIVE'
    const tracked = await this.symbolRepository.find({ 
      where: { status: SymbolStatus.ACTIVE } 
    });
    const mySymbols = tracked.map((t) => t.symbol);

    try {
      // 2. Buscar dados de TODOS os tickers da Binance
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!response.ok) throw new Error('Failed to fetch binance tickers');
      
      const allTickers = (await response.json()) as BinanceTicker[];

      // 3. Filtrar apenas as moedas que nos interessam
      const myTickers = allTickers
        .filter((t) => mySymbols.includes(t.symbol))
        .map((t) => ({
          symbol: t.symbol,
          price: parseFloat(t.lastPrice),
          changePercent: parseFloat(t.priceChangePercent),
          volume: parseFloat(t.quoteVolume),
        }));

      return myTickers;
    } catch (error) {
      console.error('Erro ao buscar tickers:', error);
      // Fallback
      return mySymbols.map(s => ({ symbol: s, price: 0, changePercent: 0, volume: 0 }));
    }
  }
}