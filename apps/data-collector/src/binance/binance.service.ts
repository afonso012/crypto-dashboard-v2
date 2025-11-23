// Ficheiro: apps/data-collector/src/binance/binance.service.ts (CORRIGIDO)

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Kline } from '../entities/kline.entity';
import { BboTick } from '../entities/bbo-tick.entity';
import { TrackedSymbol, SymbolStatus } from '../entities/tracked-symbol.entity';
import axios from 'axios';
import WebSocket from 'ws';
import { RSI, MACD } from 'technicalindicators';

const DAYS_OF_HISTORY_TO_LOAD = 7; 
const RECONNECT_DELAY = 5000;
const SYMBOL_CHECK_INTERVAL = 60000;

const RSI_PERIOD = 14;
const MACD_FAST_PERIOD = 12;
const MACD_SLOW_PERIOD = 26;
const MACD_SIGNAL_PERIOD = 9;
const INDICATOR_WARMUP_PERIOD = MACD_SLOW_PERIOD + MACD_SIGNAL_PERIOD;

@Injectable()
export class BinanceService implements OnModuleInit {
  private readonly logger = new Logger(BinanceService.name);
  private currentAvgSpread = new Map<string, { total: number; count: number }>();
  private activeSockets = new Map<string, { klineSocket: WebSocket; bboSocket: WebSocket }>();

  constructor(
    @InjectRepository(Kline) private readonly klineRepository: Repository<Kline>,
    @InjectRepository(BboTick) private readonly bboTickRepository: Repository<BboTick>,
    @InjectRepository(TrackedSymbol)
    private readonly symbolRepository: Repository<TrackedSymbol>,
  ) {}

  async onModuleInit() {
    this.logger.log('Módulo Binance inicializado.');
    await this.symbolManagerLoop(); 
    setInterval(() => this.symbolManagerLoop(), SYMBOL_CHECK_INTERVAL); 
  }

  private async symbolManagerLoop() {
    this.logger.log('[SymbolManager] A verificar símbolos...');
    const symbolsInDb = await this.symbolRepository.find();
    const symbolsToTrack = new Set(symbolsInDb.map(s => s.symbol));
    const symbolsRunning = new Set(this.activeSockets.keys());

    // --- SÍMBOLOS NOVOS / REINICIADOS ---
    for (const symbol of symbolsToTrack) {
      if (!symbolsRunning.has(symbol)) {
        
        const symbolEntity = symbolsInDb.find(s => s.symbol === symbol);

        // CASO 1: Símbolo novo (precisa de histórico completo)
        if (symbolEntity && symbolEntity.status === SymbolStatus.BACKFILLING) {
          this.logger.log(`[${symbol}] Status: BACKFILLING. A iniciar backfill total...`);
          try {
            await this.fillDataGaps(symbol); 
            await this.backfillHistory(symbol);
            await this.calculateMissingIndicators(symbol);
            
            symbolEntity.status = SymbolStatus.ACTIVE;
            await this.symbolRepository.save(symbolEntity);
            this.logger.log(`[${symbol}] Backfill concluído. A iniciar tempo real.`);
            
            this.startRealtimeCollectionForSymbol(symbol);
          } catch (err) {
            this.logger.error(`[${symbol}] Falha no setup: ${err.message}`);
          }
        } 
        
        // << 🔥 CORREÇÃO AQUI 🔥 >>
        // CASO 2: Símbolo já ativo (o servidor reiniciou)
        // Agora verificamos SEMPRE se há lacunas antes de ligar o socket
        else if (symbolEntity && symbolEntity.status === SymbolStatus.ACTIVE) {
          this.logger.log(`[${symbol}] Status: ACTIVE. A verificar lacunas antes de reiniciar...`);
          try {
            // 1. Preenche o tempo em que estivemos desligados
            await this.fillDataGaps(symbol);
            // 2. Calcula indicadores para esses dados novos
            await this.calculateMissingIndicators(symbol);
            
            // 3. Só depois inicia o tempo real
            this.startRealtimeCollectionForSymbol(symbol);
          } catch (err) {
            this.logger.error(`[${symbol}] Erro ao recuperar lacunas: ${err.message}`);
            // Se falhar a recuperação, tenta iniciar o tempo real na mesma para não perder mais dados
            this.startRealtimeCollectionForSymbol(symbol);
          }
        }
      }
    }

    // --- SÍMBOLOS REMOVIDOS ---
    for (const symbol of symbolsRunning) {
      const entity = symbolsInDb.find(s => s.symbol === symbol);
      if (!entity || entity.status === SymbolStatus.INACTIVE) {
        this.logger.log(`[SymbolManager] Símbolo removido/inativo: ${symbol}. A parar.`);
        this.stopRealtimeCollectionForSymbol(symbol);
      }
    }
  }

  // --- Funções Auxiliares (Lógica inalterada) ---

  private async enrichKlineWithIndicators(kline: Kline): Promise<Kline> {
    const recentKlines = await this.klineRepository.find({
      select: ['close'], 
      where: { symbol: kline.symbol, time: LessThan(kline.time) },
      order: { time: 'DESC' },
      take: INDICATOR_WARMUP_PERIOD, 
    });
    const closes = [...recentKlines.reverse().map(k => k.close), kline.close];

    if (closes.length > RSI_PERIOD) {
      const rsiResult = RSI.calculate({ values: closes, period: RSI_PERIOD });
      kline.rsi = rsiResult.pop() || null; 
    } else { kline.rsi = null; }

    if (closes.length > MACD_SLOW_PERIOD + MACD_SIGNAL_PERIOD) {
      const macdResult = MACD.calculate({
        values: closes, fastPeriod: MACD_FAST_PERIOD, slowPeriod: MACD_SLOW_PERIOD, signalPeriod: MACD_SIGNAL_PERIOD,
        SimpleMAOscillator: false, SimpleMASignal: false
      });
      const lastMacd = macdResult.pop();
      if (lastMacd) {
        kline.macd_value = lastMacd.MACD ?? null;
        kline.macd_signal = lastMacd.signal ?? null;
        kline.macd_histogram = lastMacd.histogram ?? null;
      }
    } else {
      kline.macd_value = null; kline.macd_signal = null; kline.macd_histogram = null;
    }
    return kline;
  }

  private async fillDataGaps(symbol: string) {
    this.logger.log(`[${symbol}] A verificar se existem lacunas de dados...`);
    const lastKline = await this.klineRepository.findOne({ where: { symbol }, order: { time: 'DESC' } });
    if (!lastKline) {
      this.logger.log(`[${symbol}] Nenhuma vela encontrada (provavelmente novo).`);
      return;
    }
    const lastTimeMs = lastKline.timestamp_ms;
    const now = Date.now();
    const gapInMinutes = (now - lastTimeMs) / (1000 * 60);

    if (gapInMinutes > 2) {
      this.logger.warn(`[${symbol}] Lacuna de ${gapInMinutes.toFixed(0)} minutos detetada. A preencher...`);
      let startTime = lastTimeMs;
      while (startTime < now) {
        try {
          const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000&startTime=${startTime}`;
          const response = await axios.get(url);
          const klines: any[] = response.data;
          if (klines.length === 0) break;
          
          const entities = klines.map(k => ({
            time: Math.round(k[0] / 1000), symbol, 
            open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]), 
            timestamp_ms: k[0], avg_spread: null, rsi: null, macd_value: null, macd_signal: null, macd_histogram: null
          }));
          
          // Guarda apenas os dados crus
          await this.klineRepository.upsert(entities, ['time', 'symbol']);
          
          startTime = klines[klines.length - 1][0] + 1;
          this.logger.log(`[${symbol}] Preenchidas ${klines.length} velas da lacuna.`);
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          this.logger.error(`[${symbol}] Erro ao preencher lacuna: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
        }
      }
      this.logger.log(`[${symbol}] Lacuna preenchida.`);
    } else {
      this.logger.log(`[${symbol}] Dados atualizados.`);
    }
  }

  private async backfillHistory(symbol: string) {
    const totalCandlesInDb = await this.klineRepository.count({ where: { symbol } });
    const totalCandlesNeeded = DAYS_OF_HISTORY_TO_LOAD * 24 * 60; 
    if (totalCandlesInDb >= totalCandlesNeeded) {
        this.logger.log(`[${symbol}] Histórico profundo completo. Ignorar backfill.`);
        return;
    }
    this.logger.log(`[${symbol}] A iniciar backfill de histórico profundo...`);
    let endTime = Date.now();
    let totalSaved = totalCandlesInDb;
    while (totalSaved < totalCandlesNeeded) {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000&endTime=${endTime}`;
        const response = await axios.get(url);
        const klines: any[] = response.data;
        if (klines.length === 0) break;
        const entities = klines.map(k => ({ 
          time: Math.round(k[0] / 1000), symbol, 
          open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]), 
          timestamp_ms: k[0], avg_spread: null, rsi: null, macd_value: null, macd_signal: null, macd_histogram: null
        }));
        await this.klineRepository.upsert(entities, ['time', 'symbol']);
        totalSaved += klines.length;
        endTime = klines[0][0] - 1;
        this.logger.log(`[${symbol}] Processadas ${klines.length} velas. Total: ${totalSaved}.`);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
          this.logger.error(`[${symbol}] Erro no backfill: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
      }
    }
  }

  private async calculateMissingIndicators(symbol: string) {
    this.logger.log(`[${symbol}] A verificar indicadores em falta...`);
    const allKlines = await this.klineRepository.find({ where: { symbol }, order: { time: 'ASC' } });
    if (allKlines.length < INDICATOR_WARMUP_PERIOD) return;

    const closePrices = allKlines.map(k => k.close);
    const rsiResults = RSI.calculate({ values: closePrices, period: RSI_PERIOD });
    const macdResults = MACD.calculate({
      values: closePrices, fastPeriod: MACD_FAST_PERIOD, slowPeriod: MACD_SLOW_PERIOD, signalPeriod: MACD_SIGNAL_PERIOD,
      SimpleMAOscillator: false, SimpleMASignal: false
    });

    const rsiOffset = allKlines.length - rsiResults.length;
    const macdOffset = allKlines.length - macdResults.length;
    const entitiesToUpdate: Kline[] = [];

    for (let i = 0; i < allKlines.length; i++) {
      const kline = allKlines[i];
      let needsUpdate = false;
      if (i >= rsiOffset) {
        const val = rsiResults[i - rsiOffset];
        if (kline.rsi !== val) { kline.rsi = val; needsUpdate = true; }
      }
      if (i >= macdOffset) {
        const macd = macdResults[i - macdOffset];
        if (kline.macd_value !== (macd.MACD ?? null) || kline.macd_histogram !== (macd.histogram ?? null)) {
          kline.macd_value = macd.MACD ?? null; kline.macd_signal = macd.signal ?? null; kline.macd_histogram = macd.histogram ?? null;
          needsUpdate = true;
        }
      }
      if (needsUpdate) entitiesToUpdate.push(kline);
    }

    const CHUNK_SIZE = 500; 
    if (entitiesToUpdate.length > 0) {
      this.logger.log(`[${symbol}] Atualizando ${entitiesToUpdate.length} velas com indicadores...`);
      for (let i = 0; i < entitiesToUpdate.length; i += CHUNK_SIZE) {
        const chunk = entitiesToUpdate.slice(i, i + CHUNK_SIZE);
        try { await this.klineRepository.save(chunk); } catch (e) { this.logger.error(`Erro lote indicadores: ${e.message}`); }
      }
    }
  }

  private startRealtimeCollectionForSymbol(symbol: string) {
    if (this.activeSockets.has(symbol)) return;
    this.logger.log(`[${symbol}] A iniciar WebSockets...`);
    const lowerCaseSymbol = symbol.toLowerCase();
    this.currentAvgSpread.set(symbol, { total: 0, count: 0 });

    const klineSocket = new WebSocket(`wss://stream.binance.com/ws/${lowerCaseSymbol}@kline_1m`);
    klineSocket.on('open', () => this.logger.log(`[KLINE ${symbol}] Conectado.`));
    klineSocket.on('message', async (data: Buffer) => {
      const message = JSON.parse(data.toString());
      const k = message.k;
      const spreadInfo = this.currentAvgSpread.get(symbol);
      const avgSpread = (spreadInfo && spreadInfo.count > 0) ? (spreadInfo.total / spreadInfo.count) : null;
      
      let klineEntity: Kline = {
        time: Math.round(k.t / 1000), symbol,
        open: parseFloat(k.o), high: parseFloat(k.h), low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v),
        timestamp_ms: k.t, avg_spread: avgSpread, rsi: null, macd_value: null, macd_signal: null, macd_histogram: null
      };
      // Calcula indicadores em tempo real
      klineEntity = await this.enrichKlineWithIndicators(klineEntity);
      await this.klineRepository.upsert(klineEntity, ['time', 'symbol']);

      if (k.x) this.currentAvgSpread.set(symbol, { total: 0, count: 0 });
    });
    klineSocket.on('close', () => { this.activeSockets.delete(symbol); });
    klineSocket.on('error', () => klineSocket.close());

    const bboSocket = new WebSocket(`wss://stream.binance.com/ws/${lowerCaseSymbol}@bookTicker`);
    bboSocket.on('open', () => this.logger.log(`[BBO ${symbol}] Conectado.`));
    bboSocket.on('message', async (data: Buffer) => {
      const message = JSON.parse(data.toString());
      const spreadInfo = this.currentAvgSpread.get(symbol);
      if (spreadInfo) {
        spreadInfo.total += (parseFloat(message.a) - parseFloat(message.b));
        spreadInfo.count += 1;
        this.currentAvgSpread.set(symbol, spreadInfo);
      }
    });
    bboSocket.on('close', () => {}); // O klineSocket gere o estado
    bboSocket.on('error', () => bboSocket.close());

    this.activeSockets.set(symbol, { klineSocket, bboSocket });
  }

  private stopRealtimeCollectionForSymbol(symbol: string) {
    const sockets = this.activeSockets.get(symbol);
    if (sockets) {
      sockets.klineSocket.close();
      sockets.bboSocket.close();
      this.activeSockets.delete(symbol);
      this.currentAvgSpread.delete(symbol);
      this.logger.log(`[${symbol}] Sockets parados.`);
    }
  }
}