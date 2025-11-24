import React, { useEffect, useRef } from 'react';
import {
  createChart, type IChartApi, type ISeriesApi,
  ColorType, type ChartOptions, CandlestickSeries, LineSeries
} from 'lightweight-charts';
import type { CandlestickData, LineData } from "../useRealTimeData";

interface ChartProps {
  historicalData: CandlestickData[];
  smaData?: LineData[]; 
  emaData?: LineData[]; 
  realTimeTick: CandlestickData | null;
  // << Aceitar novos ticks de indicadores >>
  realTimeSMATick?: LineData | null;
  realTimeEMATick?: LineData | null;
  
  height?: string;
  onChartReady?: (api: IChartApi | null) => void;
}

export const CandleChartComponent: React.FC<ChartProps> = ({
  historicalData,
  smaData = [],
  emaData = [],
  realTimeTick,
  realTimeSMATick, // << NOVO
  realTimeEMATick, // << NOVO
  height = '400px',
  onChartReady
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // 1. Construção do Gráfico (Mantém-se igual, omitindo para brevidade, mas copia tudo do anterior)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions: Partial<ChartOptions> = {
      layout: { 
        background: { type: ColorType.Solid, color: 'transparent' }, 
        textColor: '#9CA3AF', fontFamily: "'Inter', sans-serif",
      },
      grid: { vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, horzLines: { color: 'rgba(255, 255, 255, 0.03)' } },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      timeScale: { timeVisible: true, borderColor: 'rgba(255, 255, 255, 0.1)', secondsVisible: false },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      watermark: { visible: false },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    // Remover Logo
    const removeLogo = () => {
      if (!chartContainerRef.current) return;
      const logoId = chartContainerRef.current.querySelector('#tradingview-copyright-link');
      if (logoId) logoId.remove();
      chartContainerRef.current.querySelectorAll('a[href*="tradingview.com"]').forEach(l => l.remove());
    };
    removeLogo(); setTimeout(removeLogo, 500);

    if (onChartReady) onChartReady(chart);

    // Séries
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981', downColor: '#EF4444', borderVisible: false, wickUpColor: '#34D399', wickDownColor: '#F87171',
    });
    candleSeriesRef.current = candleSeries;

    const smaSeries = chart.addSeries(LineSeries, {
      color: '#FBBF24', lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
    });
    smaSeriesRef.current = smaSeries;

    const emaSeries = chart.addSeries(LineSeries, {
      color: '#22D3EE', lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
    });
    emaSeriesRef.current = emaSeries;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]?.contentRect) {
        chart.resize(entries[0].contentRect.width, entries[0].contentRect.height);
      }
    });
    resizeObserver.observe(chartContainerRef.current);
  
    return () => {
      resizeObserver.disconnect();
      if (onChartReady) onChartReady(null);
      chart.remove();
      chartRef.current = null;
    };
  }, [onChartReady]);

  // 2. Atualizar Dados Históricos
  useEffect(() => {
    if (!chartRef.current) return;
    if (historicalData.length > 0 && candleSeriesRef.current) {
        candleSeriesRef.current.setData(historicalData);
        chartRef.current.timeScale().fitContent();
    }
    if (smaSeriesRef.current) smaSeriesRef.current.setData(smaData);
    if (emaSeriesRef.current) emaSeriesRef.current.setData(emaData);
  }, [historicalData, smaData, emaData]);

  // 3. Atualizar Ticks em Tempo Real (AQUI ESTÁ A MUDANÇA)
  useEffect(() => {
    // Atualizar Vela
    if (realTimeTick && candleSeriesRef.current) {
      candleSeriesRef.current.update(realTimeTick);
    }
    
    // Atualizar SMA Live
    if (realTimeSMATick && smaSeriesRef.current) {
        smaSeriesRef.current.update(realTimeSMATick);
    }

    // Atualizar EMA Live
    if (realTimeEMATick && emaSeriesRef.current) {
        emaSeriesRef.current.update(realTimeEMATick);
    }
  }, [realTimeTick, realTimeSMATick, realTimeEMATick]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: height }} />;
};