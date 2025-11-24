// Ficheiro: apps/api-server/src/admin/admin.service.ts

import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, Between, In} from 'typeorm';
import { TrackedSymbol, SymbolStatus } from '../entities/tracked-symbol.entity';
import axios from 'axios';
import { User, UserRole } from '../entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Kline } from '../entities/kline.entity';
// Importar também SMA e EMA
import { RSI, MACD, SMA, EMA } from 'technicalindicators';

// Constantes de cálculo (iguais ao data-collector)
const RSI_PERIOD = 14;
const MACD_FAST_PERIOD = 12;
const MACD_SLOW_PERIOD = 26;
const MACD_SIGNAL_PERIOD = 9;
const SMA_PERIOD = 20; // << NOVO
const EMA_PERIOD = 50; // << NOVO
// Aumentar o warmup para garantir dados para a EMA 50
const INDICATOR_WARMUP_PERIOD = 200; 

const DATABASE_SIZE_LIMIT_GB = 5;
const BYTES_IN_GB = 1024 * 1024 * 1024;

@Injectable()
export class AdminService {
  private binanceSymbols: Set<string> = new Set();
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(TrackedSymbol)
    private symbolRepository: Repository<TrackedSymbol>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Kline)
    private klineRepository: Repository<Kline>,
  ) {
    this.loadBinanceSymbols();
  }

  private async loadBinanceSymbols() {
    try {
      const response = await axios.get('https://api.binance.com/api/v3/exchangeInfo');
      const symbols = response.data.symbols
        .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
        .map(s => s.symbol);
      
      this.binanceSymbols = new Set(symbols);
      console.log(`[AdminService] Carregados ${this.binanceSymbols.size} símbolos válidos da Binance.`);
    } catch (error) {
      console.error("Falha ao carregar símbolos da Binance:", error.message);
    }
  }

  async getBinanceSymbols(): Promise<string[]> {
    if (this.binanceSymbols.size === 0) {
      await this.loadBinanceSymbols();
    }
    return Array.from(this.binanceSymbols);
  }

  async getTrackedSymbols(): Promise<TrackedSymbol[]> {
    return this.symbolRepository.find();
  }

  async addTrackedSymbol(symbol: string): Promise<TrackedSymbol> {
    if (!this.binanceSymbols.has(symbol)) {
      throw new NotFoundException(`Símbolo ${symbol} não é válido ou não está a ser negociado na Binance (vs USDT).`);
    }

    const existing = await this.symbolRepository.findOneBy({ symbol });
    if (existing) {
      throw new ConflictException(`O símbolo ${symbol} já está a ser monitorizado.`);
    }

    const newSymbol = this.symbolRepository.create({
      symbol: symbol,
      status: SymbolStatus.BACKFILLING,
    });
    
    return this.symbolRepository.save(newSymbol);
  }

  async listUsers(): Promise<Omit<User, 'password'>[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async updateUserRole(id: string, updateRoleDto: UpdateRoleDto): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }
    user.role = updateRoleDto.role;
    return this.usersRepository.save(user);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }
    await this.usersRepository.remove(user);
    return { message: `Utilizador ${user.email} removido com sucesso.` };
  }

  async getSystemStatus(): Promise<object> {
    const startCheck = Date.now();
    const dbStart = Date.now();
    
    const sizeResult = await this.symbolRepository.query('SELECT pg_database_size(current_database()) as size');
    const usedBytes = parseInt(sizeResult[0].size, 10);
    const dbLatency = Date.now() - dbStart;
    
    const totalSymbols = await this.symbolRepository.count();
    const activeSymbols = await this.symbolRepository.count({ where: { status: SymbolStatus.ACTIVE } });

    const limitBytes = DATABASE_SIZE_LIMIT_GB * BYTES_IN_GB;
    const usagePercentage = Math.min(Math.round((usedBytes / limitBytes) * 100), 100);

    const latestKlines = await this.klineRepository.find({
      order: { timestamp_ms: 'DESC' },
      take: 1,
    });
    const latestKline = latestKlines.length > 0 ? latestKlines[0] : null;
    
    let collectorStatus: 'healthy' | 'lagging' | 'down' = 'down';
    let lastUpdateMs = 0;
    let secondsSinceUpdate = -1;

    if (latestKline) {
      lastUpdateMs = parseInt(latestKline.timestamp_ms as any, 10);
      const now = Date.now();
      const diffSeconds = Math.round((now - lastUpdateMs) / 1000);
      secondsSinceUpdate = diffSeconds;

      if (diffSeconds < 120) collectorStatus = 'healthy';
      else if (diffSeconds < 600) collectorStatus = 'lagging';
      else collectorStatus = 'down';
    }

    const uptimeSeconds = process.uptime();
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    return {
      apiServer: {
        status: 'online',
        uptime: uptimeSeconds,
        memory: `${memoryUsedMB} MB`,
      },
      database: {
        status: 'online',
        latency: `${dbLatency} ms`,
        trackedSymbols: `${activeSymbols} / ${totalSymbols}`,
        storage: {
          usedBytes: usedBytes,
          limitBytes: limitBytes,
          percentage: usagePercentage,
          label: `${(usedBytes / 1024 / 1024).toFixed(2)} MB / ${DATABASE_SIZE_LIMIT_GB} GB`
        }
      },
      dataCollector: {
        status: collectorStatus,
        lastUpdate: lastUpdateMs ? new Date(lastUpdateMs).toISOString() : null,
        secondsSinceUpdate: secondsSinceUpdate,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // << 🔥 ATUALIZADO: Calcula também SMA e EMA 🔥 >>
  private async enrichKline(kline: Kline): Promise<Kline> {
    const recentKlines = await this.klineRepository.find({
      select: ['close'], 
      where: { symbol: kline.symbol, time: LessThan(kline.time) },
      order: { time: 'DESC' },
      take: INDICATOR_WARMUP_PERIOD, 
    });

    const closes = [...recentKlines.reverse().map(k => k.close), kline.close];

    // RSI
    if (closes.length > RSI_PERIOD) {
      const rsiResult = RSI.calculate({ values: closes, period: RSI_PERIOD });
      kline.rsi = rsiResult.pop() || null; 
    } else { kline.rsi = null; }

    // MACD
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

    // SMA (20) - Novo
    if (closes.length >= SMA_PERIOD) {
      const smaResult = SMA.calculate({ values: closes, period: SMA_PERIOD });
      kline.sma_20 = smaResult.pop() || null;
    } else { kline.sma_20 = null; }

    // EMA (50) - Novo
    if (closes.length >= EMA_PERIOD) {
      const emaResult = EMA.calculate({ values: closes, period: EMA_PERIOD });
      kline.ema_50 = emaResult.pop() || null;
    } else { kline.ema_50 = null; }

    return kline;
  }

  async forceFillGaps(symbol: string, startTimeMs: number, endTimeMs: number) {
    this.logger.log(`[Admin] A forçar preenchimento INTELIGENTE para ${symbol}...`);
    
    let currentStartTime = startTimeMs;
    let totalFilled = 0;
    let totalSkipped = 0;

    while (currentStartTime < endTimeMs) {
      try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000&startTime=${currentStartTime}&endTime=${endTimeMs}`;
        const response = await axios.get(url);
        const klinesData: any[] = response.data;

        if (klinesData.length === 0) break;

        const binanceTimes = klinesData.map(k => Math.round(k[0] / 1000));

        const existingKlines = await this.klineRepository.find({
          select: ['time'], 
          where: {
            symbol: symbol,
            time: In(binanceTimes), 
          },
        });
        
        const existingTimesSet = new Set(existingKlines.map(k => Number(k.time)));

        const entitiesToSave: Kline[] = [];
        
        for (const k of klinesData) {
          const time = Math.round(k[0] / 1000);

          if (existingTimesSet.has(time)) {
            totalSkipped++;
            continue; 
          }
          
          // << 🔥 CORREÇÃO: Adicionadas as propriedades em falta 🔥 >>
          let entity: Kline = {
            time: time,
            symbol: symbol,
            open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]),
            timestamp_ms: k[0],
            avg_spread: null, 
            rsi: null, macd_value: null, macd_signal: null, macd_histogram: null,
            sma_20: null, ema_50: null // Inicializados a null
          };

          // A função enrich vai preencher sma_20 e ema_50
          entity = await this.enrichKline(entity);
          entitiesToSave.push(entity);
        }

        if (entitiesToSave.length > 0) {
          await this.klineRepository.upsert(entitiesToSave, ['time', 'symbol']);
          totalFilled += entitiesToSave.length;
          this.logger.log(`[Admin] Encontradas ${entitiesToSave.length} velas em falta. Guardadas.`);
        }

        const lastCandleTime = klinesData[klinesData.length - 1][0];
        currentStartTime = lastCandleTime + 1;

        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        this.logger.error(`Erro no preenchimento: ${error.message}`);
        throw new Error(`Falha ao preencher dados: ${error.message}`);
      }
    }

    return { 
      message: `Processo concluído. ${totalFilled} novas velas adicionadas. ${totalSkipped} velas existentes ignoradas.` 
    };
  }

  async forceFillAllGaps(startTimeMs: number, endTimeMs: number) {
    const symbols = await this.symbolRepository.find({ 
      where: { status: SymbolStatus.ACTIVE } 
    });

    this.logger.log(`[Admin] Pedido de preenchimento em massa recebido para ${symbols.length} símbolos.`);

    (async () => {
      for (const s of symbols) {
        this.logger.log(`[Admin] [Mass Fill] A processar ${s.symbol}...`);
        try {
          await this.forceFillGaps(s.symbol, startTimeMs, endTimeMs);
        } catch (error) {
          this.logger.error(`[Admin] Erro ao processar ${s.symbol} no lote: ${error.message}`);
        }
      }
      this.logger.log(`[Admin] Preenchimento em massa CONCLUÍDO.`);
    })();

    return { 
      message: `Processo iniciado em background para ${symbols.length} símbolos. Verifique os logs do servidor para acompanhar o progresso.` 
    };
  }
}