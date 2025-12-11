import { Injectable } from '@nestjs/common';
import { RSI, MACD, SMA, EMA } from 'technicalindicators';

// Configurações Padronizadas (Para garantir consistência em todo o sistema)
export const INDICATOR_CONFIG = {
  RSI_PERIOD: 14,
  MACD_FAST: 12,
  MACD_SLOW: 26,
  MACD_SIGNAL: 9,
  SMA_PERIOD: 20,
  EMA_PERIOD: 50,
};

export interface IndicatorResult {
  rsi: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  sma: number | null;
  ema: number | null;
}

@Injectable()
export class TechnicalAnalysisService {
  
  /**
   * Calcula todos os indicadores para uma lista de preços de fecho.
   * Assume que o último preço do array é o mais recente.
   */
  calculateIndicators(closePrices: number[]): IndicatorResult {
    const result: IndicatorResult = {
      rsi: null,
      macd: null,
      sma: null,
      ema: null
    };

    // 1. RSI
    if (closePrices.length > INDICATOR_CONFIG.RSI_PERIOD) {
      const rsiResult = RSI.calculate({ 
        values: closePrices, 
        period: INDICATOR_CONFIG.RSI_PERIOD 
      });
      result.rsi = rsiResult.pop() || null;
    }

    // 2. MACD
    if (closePrices.length > INDICATOR_CONFIG.MACD_SLOW + INDICATOR_CONFIG.MACD_SIGNAL) {
      const macdResult = MACD.calculate({
        values: closePrices,
        fastPeriod: INDICATOR_CONFIG.MACD_FAST,
        slowPeriod: INDICATOR_CONFIG.MACD_SLOW,
        signalPeriod: INDICATOR_CONFIG.MACD_SIGNAL,
        SimpleMAOscillator: false,
        SimpleMASignal: false
      });
      const lastMacd = macdResult.pop();
      if (lastMacd) {
        result.macd = {
          value: lastMacd.MACD ?? 0,
          signal: lastMacd.signal ?? 0,
          histogram: lastMacd.histogram ?? 0
        };
      }
    }

    // 3. SMA
    if (closePrices.length >= INDICATOR_CONFIG.SMA_PERIOD) {
      const smaResult = SMA.calculate({ 
        values: closePrices, 
        period: INDICATOR_CONFIG.SMA_PERIOD 
      });
      result.sma = smaResult.pop() || null;
    }

    // 4. EMA
    if (closePrices.length >= INDICATOR_CONFIG.EMA_PERIOD) {
      const emaResult = EMA.calculate({ 
        values: closePrices, 
        period: INDICATOR_CONFIG.EMA_PERIOD 
      });
      result.ema = emaResult.pop() || null;
    }

    return result;
  }
}