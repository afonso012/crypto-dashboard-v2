import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Kline } from '../entities/kline.entity';
import { BboTick } from '../entities/bbo-tick.entity';
import { TrackedSymbol, SymbolStatus } from '../entities/tracked-symbol.entity';
import axios from 'axios';
import WebSocket from 'ws';
// Importamos todas as classes necessárias
import { RSI, MACD, SMA, EMA } from 'technicalindicators';

const DAYS_OF_HISTORY_TO_LOAD = 7;
const RECONNECT_DELAY = 5000;
const SYMBOL_CHECK_INTERVAL = 60000;

// Configurações de Indicadores
const RSI_PERIOD = 14;
const MACD_FAST_PERIOD = 12;
const MACD_SLOW_PERIOD = 26;
const MACD_SIGNAL_PERIOD = 9;
const SMA_PERIOD = 20;
const EMA_PERIOD = 50;

// Aumentámos o warmup para 200 para garantir que a EMA-50 tem dados suficientes para convergir
const INDICATOR_WARMUP_PERIOD = 200;

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

        // Se estiver em BACKFILLING ou ACTIVE (após restart), garantimos integridade
        if (symbolEntity && (symbolEntity.status === SymbolStatus.BACKFILLING || symbolEntity.status === SymbolStatus.ACTIVE)) {
          this.logger.log(`[${symbol}] A preparar arranque (Status: ${symbolEntity.status})...`);
          
          try {
            // 1. Preencher lacunas de tempo (se o servidor teve desligado)
            await this.fillDataGaps(symbol);
            
            // 2. Se for novo, sacar histórico completo
            if (symbolEntity.status === SymbolStatus.BACKFILLING) {
              await this.backfillHistory(symbol);
            }

            // 3. Calcular TODOS os indicadores em falta (incluindo SMA/EMA novos)
            await this.calculateMissingIndicators(symbol);

            // 4. Atualizar estado e iniciar WebSockets
            if (symbolEntity.status !== SymbolStatus.ACTIVE) {
              symbolEntity.status = SymbolStatus.ACTIVE;
              await this.symbolRepository.save(symbolEntity);
            }
            
            this.startRealtimeCollectionForSymbol(symbol);
          } catch (err) {
            this.logger.error(`[${symbol}] Falha no setup: ${err.message}`);
            // Tenta iniciar realtime mesmo com erro para não perder dados novos
            this.startRealtimeCollectionForSymbol(symbol);
          }
        }
      }
    }

    // --- SÍMBOLOS REMOVIDOS ---
    for (const symbol of symbolsRunning) {
      const entity = symbolsInDb.find(s => s.symbol === symbol);
      if (!entity || entity.status === SymbolStatus.INACTIVE) {
        this.stopRealtimeCollectionForSymbol(symbol);
      }
    }
  }

  // --- Lógica Principal de Indicadores em Tempo Real ---
  private async enrichKlineWithIndicators(kline: Kline): Promise<Kline> {
    const recentKlines = await this.klineRepository.find({
      select: ['close'],
      where: { symbol: kline.symbol, time: LessThan(kline.time) },
      order: { time: 'DESC' },
      take: INDICATOR_WARMUP_PERIOD,
    });
    
    // Array: [..., preço_antigo, preço_atual]
    const closes = [...recentKlines.reverse().map(k => k.close), kline.close];

    // 1. RSI
    if (closes.length > RSI_PERIOD) {
      const rsiResult = RSI.calculate({ values: closes, period: RSI_PERIOD });
      kline.rsi = rsiResult.pop() || null;
    } else { kline.rsi = null; }

    // 2. MACD
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

    // 3. SMA (20)
    if (closes.length >= SMA_PERIOD) {
      const smaResult = SMA.calculate({ values: closes, period: SMA_PERIOD });
      kline.sma_20 = smaResult.pop() || null;
    } else { kline.sma_20 = null; }

    // 4. EMA (50)
    if (closes.length >= EMA_PERIOD) {
      const emaResult = EMA.calculate({ values: closes, period: EMA_PERIOD });
      kline.ema_50 = emaResult.pop() || null;
    } else { kline.ema_50 = null; }

    return kline;
  }

  private async backfillHistory(symbol: string) {
    const totalCandlesInDb = await this.klineRepository.count({ where: { symbol } });
    const totalCandlesNeeded = DAYS_OF_HISTORY_TO_LOAD * 24 * 60;
    
    if (totalCandlesInDb >= totalCandlesNeeded) return;

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
          timestamp_ms: k[0], avg_spread: null, 
          rsi: null, macd_value: null, macd_signal: null, macd_histogram: null,
          sma_20: null, ema_50: null // Inicializa a null
        }));

        await this.klineRepository.upsert(entities, ['time', 'symbol']);
        totalSaved += klines.length;
        endTime = klines[0][0] - 1;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        this.logger.error(`[${symbol}] Erro Backfill: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
      }
    }
  }

  private async fillDataGaps(symbol: string) {
    const lastKline = await this.klineRepository.findOne({ where: { symbol }, order: { time: 'DESC' } });
    if (!lastKline) return;

    const lastTimeMs = lastKline.timestamp_ms;
    const now = Date.now();
    
    if ((now - lastTimeMs) / (1000 * 60) > 2) {
      this.logger.log(`[${symbol}] A preencher lacuna de dados...`);
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
            timestamp_ms: k[0], avg_spread: null,
            rsi: null, macd_value: null, macd_signal: null, macd_histogram: null,
            sma_20: null, ema_50: null
          }));
          
          await this.klineRepository.upsert(entities, ['time', 'symbol']);
          startTime = klines[klines.length - 1][0] + 1;
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (e) { break; }
      }
    }
  }

  // --- Cálculo em Lote para Histórico (Agora com SMA/EMA) ---
  private async calculateMissingIndicators(symbol: string) {
    this.logger.log(`[${symbol}] A recalcular indicadores em falta...`);
    const allKlines = await this.klineRepository.find({ where: { symbol }, order: { time: 'ASC' } });
    if (allKlines.length < INDICATOR_WARMUP_PERIOD) return;

    const closePrices = allKlines.map(k => k.close);

    // Calcular tudo de uma vez
    const rsiResults = RSI.calculate({ values: closePrices, period: RSI_PERIOD });
    const macdResults = MACD.calculate({ values: closePrices, fastPeriod: MACD_FAST_PERIOD, slowPeriod: MACD_SLOW_PERIOD, signalPeriod: MACD_SIGNAL_PERIOD, SimpleMAOscillator: false, SimpleMASignal: false });
    const smaResults = SMA.calculate({ values: closePrices, period: SMA_PERIOD });
    const emaResults = EMA.calculate({ values: closePrices, period: EMA_PERIOD });

    // Offsets
    const rsiOffset = allKlines.length - rsiResults.length;
    const macdOffset = allKlines.length - macdResults.length;
    const smaOffset = allKlines.length - smaResults.length;
    const emaOffset = allKlines.length - emaResults.length;

    const entitiesToUpdate: Kline[] = [];

    for (let i = 0; i < allKlines.length; i++) {
      const kline = allKlines[i];
      let needsUpdate = false;

      // Update RSI
      if (i >= rsiOffset && kline.rsi !== rsiResults[i - rsiOffset]) { 
        kline.rsi = rsiResults[i - rsiOffset]; needsUpdate = true; 
      }
      
      // Update MACD
      if (i >= macdOffset) {
        const m = macdResults[i - macdOffset];
        if (kline.macd_value !== (m.MACD ?? null)) {
          kline.macd_value = m.MACD ?? null; kline.macd_signal = m.signal ?? null; kline.macd_histogram = m.histogram ?? null;
          needsUpdate = true;
        }
      }

      // Update SMA (NOVO)
      if (i >= smaOffset && kline.sma_20 !== smaResults[i - smaOffset]) {
        kline.sma_20 = smaResults[i - smaOffset]; needsUpdate = true;
      }

      // Update EMA (NOVO)
      if (i >= emaOffset && kline.ema_50 !== emaResults[i - emaOffset]) {
        kline.ema_50 = emaResults[i - emaOffset]; needsUpdate = true;
      }

      if (needsUpdate) entitiesToUpdate.push(kline);
    }

    if (entitiesToUpdate.length > 0) {
      this.logger.log(`[${symbol}] A atualizar ${entitiesToUpdate.length} velas...`);
      const CHUNK_SIZE = 500;
      for (let i = 0; i < entitiesToUpdate.length; i += CHUNK_SIZE) {
        await this.klineRepository.save(entitiesToUpdate.slice(i, i + CHUNK_SIZE));
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
        timestamp_ms: k.t, avg_spread: avgSpread,
        rsi: null, macd_value: null, macd_signal: null, macd_histogram: null,
        sma_20: null, ema_50: null
      };

      // O "enrich" agora calcula os 4 indicadores em tempo real
      klineEntity = await this.enrichKlineWithIndicators(klineEntity);
      await this.klineRepository.upsert(klineEntity, ['time', 'symbol']);

      if (k.x) this.currentAvgSpread.set(symbol, { total: 0, count: 0 });
    });
    
    klineSocket.on('close', () => { this.activeSockets.delete(symbol); });
    klineSocket.on('error', () => klineSocket.close());

    // Socket do Order Book (Spread)
    const bboSocket = new WebSocket(`wss://stream.binance.com/ws/${lowerCaseSymbol}@bookTicker`);
    bboSocket.on('message', async (data: Buffer) => {
      const message = JSON.parse(data.toString());
      const spreadInfo = this.currentAvgSpread.get(symbol);
      if (spreadInfo) {
        spreadInfo.total += (parseFloat(message.a) - parseFloat(message.b));
        spreadInfo.count += 1;
        this.currentAvgSpread.set(symbol, spreadInfo);
      }
    });
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