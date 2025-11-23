import { useState, useEffect } from 'react';

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
  
  realTimeCandleTick: CandlestickData | null;
  realTimeSpreadTick: LineData | null;
  realTimeRSITick: LineData | null;
  realTimeMACDTick: HistogramData | null;

  isLoading: boolean;
  error: string | null;
}

const COLOR_UP = '#26a69a';
const COLOR_DOWN = '#ef5350';

// << 🔥 MUDANÇA: Aceita 'daysToLoad' como argumento (Default: 1 dia) 🔥 >>
export const useRealTimeData = (symbol: string, daysToLoad: number = 1): RealTimeData => {
  
  const [historicalCandles, setHistoricalCandles] = useState<CandlestickData[]>([]);
  const [historicalSpread, setHistoricalSpread] = useState<LineData[]>([]);
  const [historicalRSI, setHistoricalRSI] = useState<LineData[]>([]);
  const [historicalMACD, setHistoricalMACD] = useState<HistogramData[]>([]);

  const [realTimeCandleTick, setRealTimeCandleTick] = useState<CandlestickData | null>(null);
  const [realTimeSpreadTick, setRealTimeSpreadTick] = useState<LineData | null>(null);
  const [realTimeRSITick, setRealTimeRSITick] = useState<LineData | null>(null);
  const [realTimeMACDTick, setRealTimeMACDTick] = useState<HistogramData | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efeito para carregar dados históricos
  useEffect(() => {
    // Limpa dados antigos ao mudar de símbolo ou de tempo
    setHistoricalCandles([]);
    setHistoricalSpread([]);
    setHistoricalRSI([]);
    setHistoricalMACD([]);
    
    if (!symbol) {
      setIsLoading(false);
      return;
    }
    
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);
        const endTime = Math.floor(Date.now() / 1000);
        
        // << 🔥 MUDANÇA: Calcula o início baseado no botão selecionado 🔥 >>
        const startTime = endTime - (86400 * daysToLoad); 

        const historyUrl = `/api/market/history/${symbol}?startTime=${startTime}&endTime=${endTime}`;

        const candleResponse = await fetch(historyUrl);
        
        if (!candleResponse.ok) {
          throw new Error(`Falha ao obter dados históricos: Candle(${candleResponse.status})`);
        }

        const rawCandleData: any[] = await candleResponse.json();

        const candles: CandlestickData[] = [];
        const spread: LineData[] = [];
        const rsi: LineData[] = [];
        const macd: HistogramData[] = [];
        
        for (const k of rawCandleData) {
          const time = parseFloat(k.time);
          
          candles.push({
            time: time,
            open: parseFloat(k.open),
            high: parseFloat(k.high),
            low: parseFloat(k.low),
            close: parseFloat(k.close)
          });
          
          spread.push({ time: time, value: k.avg_spread || 0 });

          if (k.rsi !== null) {
            rsi.push({ time: time, value: k.rsi });
          }
          
          if (k.macd_histogram !== null) {
            const value = k.macd_histogram;
            macd.push({
              time: time,
              value: value,
              color: value >= 0 ? COLOR_UP : COLOR_DOWN
            });
          }
        }
        
        setHistoricalCandles(candles);
        setHistoricalSpread(spread);
        setHistoricalRSI(rsi);
        setHistoricalMACD(macd);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHistoricalData();
    
    // << 🔥 IMPORTANTE: Recarrega quando 'daysToLoad' muda 🔥 >>
  }, [symbol, daysToLoad]); 

  // Efeito para WebSocket (Fica igual)
  useEffect(() => {
    if (!symbol) return; 

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/ws`;

    const ws = new WebSocket(wsUrl);
    // ... (lógica do WebSocket igual) ...
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const tick = message.data as any;

        if (!tick.symbol || tick.symbol !== symbol) { return; }

        if (message.type === 'kline_update') {
          const time = parseFloat(tick.time);
          setRealTimeCandleTick({
            time: time, open: parseFloat(tick.open), high: parseFloat(tick.high),
            low: parseFloat(tick.low), close: parseFloat(tick.close)
          });
          setRealTimeSpreadTick({ time: time, value: tick.avg_spread || 0 });
          if (tick.rsi !== null) setRealTimeRSITick({ time: time, value: tick.rsi });
          if (tick.macd_histogram !== null) {
            setRealTimeMACDTick({
              time: time, value: tick.macd_histogram,
              color: tick.macd_histogram >= 0 ? COLOR_UP : COLOR_DOWN
            });
          }
        }
      } catch (e) { console.error("Erro WS:", e); }
    };
    // ...
    return () => { ws.close(); };
  }, [symbol]); 

  return { 
    historicalCandles, historicalSpread, historicalRSI, historicalMACD, 
    realTimeCandleTick, realTimeSpreadTick, realTimeRSITick, realTimeMACDTick,
    isLoading, error 
  };
};