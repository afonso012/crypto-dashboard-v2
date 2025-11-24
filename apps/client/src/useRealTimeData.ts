import { useState, useEffect, useRef } from 'react';

// Interfaces de Dados
export interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface LineData {
  time: number;
  value: number;
}
export interface HistogramData {
  time: number;
  value: number;
  color?: string; 
}

interface RealTimeData {
  historicalCandles: CandlestickData[];
  historicalSpread: LineData[];
  historicalRSI: LineData[];
  historicalMACD: HistogramData[];
  historicalSMA: LineData[];
  historicalEMA: LineData[];
  
  realTimeCandleTick: CandlestickData | null;
  realTimeSpreadTick: LineData | null;
  // Novos ticks para os indicadores
  realTimeSMATick: LineData | null;
  realTimeEMATick: LineData | null;

  realTimeRSITick: LineData | null;
  realTimeMACDTick: HistogramData | null;

  isLoading: boolean;
  error: string | null;
}

const COLOR_UP = '#26a69a';
const COLOR_DOWN = '#ef5350';

export const useRealTimeData = (symbol: string, daysToLoad: number = 1): RealTimeData => {
  
  // Estados de Histórico
  const [historicalCandles, setHistoricalCandles] = useState<CandlestickData[]>([]);
  const [historicalSpread, setHistoricalSpread] = useState<LineData[]>([]);
  const [historicalRSI, setHistoricalRSI] = useState<LineData[]>([]);
  const [historicalMACD, setHistoricalMACD] = useState<HistogramData[]>([]);
  const [historicalSMA, setHistoricalSMA] = useState<LineData[]>([]);
  const [historicalEMA, setHistoricalEMA] = useState<LineData[]>([]);

  // Refs para acesso dentro do WebSocket (evita stale closures)
  const historyRef = useRef({
    candles: [] as CandlestickData[],
    sma: [] as LineData[],
    ema: [] as LineData[]
  });

  // Estados de Tempo Real
  const [realTimeCandleTick, setRealTimeCandleTick] = useState<CandlestickData | null>(null);
  const [realTimeSpreadTick, setRealTimeSpreadTick] = useState<LineData | null>(null);
  
  // << NOVOS ESTADOS PARA LINHAS AO VIVO >>
  const [realTimeSMATick, setRealTimeSMATick] = useState<LineData | null>(null);
  const [realTimeEMATick, setRealTimeEMATick] = useState<LineData | null>(null);

  const [realTimeRSITick, setRealTimeRSITick] = useState<LineData | null>(null);
  const [realTimeMACDTick, setRealTimeMACDTick] = useState<HistogramData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Atualizar refs sempre que o histórico muda
  useEffect(() => {
    historyRef.current = { 
        candles: historicalCandles, 
        sma: historicalSMA, 
        ema: historicalEMA 
    };
  }, [historicalCandles, historicalSMA, historicalEMA]);

  // 1. Fetch Histórico
  useEffect(() => {
    setHistoricalCandles([]); setHistoricalSpread([]); setHistoricalRSI([]); 
    setHistoricalMACD([]); setHistoricalSMA([]); setHistoricalEMA([]);
    setRealTimeSMATick(null); setRealTimeEMATick(null);
    
    if (!symbol) { setIsLoading(false); return; }
    
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);
        const endTime = Math.floor(Date.now() / 1000);
        const startTime = endTime - (86400 * daysToLoad); 

        const historyUrl = `/api/market/history/${symbol}?startTime=${startTime}&endTime=${endTime}`;
        const response = await fetch(historyUrl);
        if (!response.ok) throw new Error(`Falha API: ${response.status}`);

        const rawData: any[] = await response.json();

        const candles: CandlestickData[] = [];
        const spread: LineData[] = [];
        const rsi: LineData[] = [];
        const macd: HistogramData[] = [];
        const sma: LineData[] = [];
        const ema: LineData[] = [];
        
        for (const k of rawData) {
          const time = parseFloat(k.time);
          candles.push({ time, open: parseFloat(k.open), high: parseFloat(k.high), low: parseFloat(k.low), close: parseFloat(k.close) });
          spread.push({ time, value: k.avg_spread || 0 });
          if (k.rsi !== null) rsi.push({ time, value: k.rsi });
          if (k.macd_histogram !== null) {
            macd.push({ time, value: k.macd_histogram, color: k.macd_histogram >= 0 ? COLOR_UP : COLOR_DOWN });
          }
          if (k.sma_20 !== null) sma.push({ time, value: k.sma_20 });
          if (k.ema_50 !== null) ema.push({ time, value: k.ema_50 });
        }
        
        setHistoricalCandles(candles);
        setHistoricalSpread(spread);
        setHistoricalRSI(rsi);
        setHistoricalMACD(macd);
        setHistoricalSMA(sma);
        setHistoricalEMA(ema);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally { setIsLoading(false); }
    };
    fetchHistoricalData();
  }, [symbol, daysToLoad]); 

  // 2. WebSocket (Cálculo em Tempo Real)
  useEffect(() => {
    if (!symbol) return; 
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'kline_update' && msg.data.symbol === symbol) {
            const tick = msg.data;
            const time = parseFloat(tick.time);
            const closePrice = parseFloat(tick.close);

            // Atualiza Vela
            setRealTimeCandleTick({
                time, open: parseFloat(tick.open), high: parseFloat(tick.high), 
                low: parseFloat(tick.low), close: closePrice
            });
            setRealTimeSpreadTick({ time, value: tick.avg_spread || 0 });

            // --- CÁLCULO LIVE DOS INDICADORES ---
            const { candles, sma, ema } = historyRef.current;

            // Calcular SMA 20 Live
            // Precisamos dos últimos 19 preços + preço atual
            if (candles.length >= 19) {
                const last19 = candles.slice(-19).map(c => c.close);
                const sum = last19.reduce((a, b) => a + b, 0) + closePrice;
                const currentSMA = sum / 20;
                setRealTimeSMATick({ time, value: currentSMA });
            }

            // Calcular EMA 50 Live
            // Fórmula: (Close - PrevEMA) * Multiplier + PrevEMA
            // Multiplier = 2 / (50 + 1) ~= 0.0392
            if (ema.length > 0) {
                const prevEMA = ema[ema.length - 1].value;
                const k = 2 / (50 + 1);
                const currentEMA = (closePrice - prevEMA) * k + prevEMA;
                setRealTimeEMATick({ time, value: currentEMA });
            }
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [symbol]); 

  return { 
    historicalCandles, historicalSpread, historicalRSI, historicalMACD, 
    historicalSMA, historicalEMA,
    realTimeCandleTick, realTimeSpreadTick, realTimeRSITick, realTimeMACDTick,
    // Exportar os novos ticks calculados
    realTimeSMATick, realTimeEMATick,
    isLoading, error 
  };
};