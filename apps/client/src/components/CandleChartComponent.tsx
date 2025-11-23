// Ficheiro: src/components/CandleChartComponent.tsx (CORRIGIDO)

import React, { useEffect, useRef } from 'react';
import {
  createChart, type IChartApi, type ISeriesApi,
  ColorType, type ChartOptions, CandlestickSeries
} from 'lightweight-charts';
import type { CandlestickData } from "../useRealTimeData";

interface ChartProps {
  historicalData: CandlestickData[];
  realTimeTick: CandlestickData | null;
  height?: string;
  onChartReady?: (api: IChartApi | null) => void;
}

export const CandleChartComponent: React.FC<ChartProps> = ({
  historicalData,
  realTimeTick,
  height = '400px',
  onChartReady
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Efeito 1: Construção
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions: Partial<ChartOptions> = {
      layout: { background: { type: ColorType.Solid, color: '#1A202C' }, textColor: '#D1D5DB' },
      grid: { vertLines: { color: '#2D3748' }, horzLines: { color: '#2D3748' } },
      
      // << 🔥 INÍCIO DA CORREÇÃO (Zoom) 🔥 >>
      handleScroll: {
        mouseWheel: false, // Roda do rato NÃO FAZ scroll (pan)
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true, // Roda do rato FAZ zoom
        pinch: true,
      },
      // << 🔥 FIM DA CORREÇÃO 🔥 >>

      timeScale: { timeVisible: true, borderColor: '#4A5568', secondsVisible: false, shiftVisibleRangeOnNewBar: true },
      rightPriceScale: { borderColor: '#4A5568' },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    if (onChartReady) {
      onChartReady(chart);
    }

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });
    seriesRef.current = candleSeries;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && entries[0].contentRect.width) {
        chart.resize(entries[0].contentRect.width, entries[0].contentRect.height);
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (onChartReady) {
        onChartReady(null);
      }
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [onChartReady]);

  // Efeito 2: Dados Históricos (Com correção de decimais)
  useEffect(() => {
    if (historicalData.length > 0 && seriesRef.current && chartRef.current) {
      const price = historicalData[0].close;
      const [precision, minMove] = price < 100 ? [4, 0.0001] : [2, 0.01];

      seriesRef.current.applyOptions({
        priceFormat: {
          type: 'price',
          precision: precision,
          minMove: minMove,
        }
      });
      chartRef.current.priceScale('right').applyOptions({
        autoScale: true,
        precision: precision,
      });
      seriesRef.current.setData(historicalData);
      chartRef.current.timeScale().fitContent();
      
    } else if (historicalData.length === 0 && seriesRef.current) {
      seriesRef.current.setData([]);
    }
  }, [historicalData]);

  // Efeito 3: Ticks em Tempo Real
  useEffect(() => {
    if (realTimeTick && seriesRef.current) {
      seriesRef.current.update(realTimeTick);
    }
  }, [realTimeTick]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: height }}
    />
  );
};