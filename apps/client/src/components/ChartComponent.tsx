// Ficheiro: ChartComponent.tsx (CORRIGIDO)

import React, { useEffect, useRef } from 'react';
import { 
  createChart, 
  type IChartApi, 
  type ISeriesApi, 
  ColorType, 
  type ChartOptions,
  CandlestickSeries,
  LineSeries         
} from 'lightweight-charts';
import type { CandlestickData, LineData } from "../useRealTimeData";

interface ChartComponentProps {
  historicalCandles: CandlestickData[]; 
  historicalLine: LineData[];
  realTimeCandleTick: CandlestickData | null;
  realTimeLineTick: LineData | null;
}

export const ChartComponent: React.FC<ChartComponentProps> = ({
  historicalCandles,
  historicalLine,
  realTimeCandleTick,
  realTimeLineTick
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // EFEITO 1: CONSTRUÇÃO (Corre apenas uma vez)
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions: Partial<ChartOptions> = {
      layout: { 
        background: { type: ColorType.Solid, color: '#1A202C' }, 
        textColor: '#D1D5DB' 
      },
      grid: { vertLines: { color: '#2D3748' }, horzLines: { color: '#2D3748' } },
      timeScale: { timeVisible: true, borderColor: '#4A5568', secondsVisible: true },
      
      // A escala da DIREITA (default) é para as Velas (Candles)
      rightPriceScale: { 
        borderColor: '#4A5568',
      },
      
      // << 🔥 CORREÇÃO 1: Adiciona e torna VISÍVEL a escala da ESQUERDA >>
      leftPriceScale: {
        visible: true,
        borderColor: '#4A5568',
      },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    // Série de Velas (usa a escala default, 'right')
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    candlestickSeriesRef.current = candleSeries;
    
    // Série de Linha (Spread)
    const lineSeries = chart.addSeries(LineSeries, {
      color: '#FF9800', lineWidth: 2, title: 'Spread',
      // << 🔥 CORREÇÃO 2: Atribui esta série à escala 'left' >>
      priceScaleId: 'left', 
    });
    lineSeriesRef.current = lineSeries;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        chart.resize(width, height);
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []); // Array de dependência vazio

  // EFEITO 2: Carregar dados históricos
  useEffect(() => {
    if (historicalCandles.length > 0 && candlestickSeriesRef.current) {
      candlestickSeriesRef.current.setData(historicalCandles);
      chartRef.current?.timeScale().fitContent();
    }
    if (historicalLine.length > 0 && lineSeriesRef.current) {
      lineSeriesRef.current.setData(historicalLine);
    }
  }, [historicalCandles, historicalLine]);

  // EFEITO 3: Atualizar com ticks de velas em tempo real
  useEffect(() => {
    if (realTimeCandleTick && candlestickSeriesRef.current) {
      candlestickSeriesRef.current.update(realTimeCandleTick); 
    }
  }, [realTimeCandleTick]);

  // EFEITO 4: Atualizar com ticks de linha em tempo real
  useEffect(() => {
    if (realTimeLineTick && lineSeriesRef.current) {
      lineSeriesRef.current.update(realTimeLineTick);
    }
  }, [realTimeLineTick]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ width: '100%', height: '500px' }} 
    />
  );
};