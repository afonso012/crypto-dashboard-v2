// Ficheiro: src/components/SpreadChartComponent.tsx (CORRIGIDO)

import React, { useEffect, useRef } from 'react';
import {
  createChart, type IChartApi, type ISeriesApi,
  ColorType, type ChartOptions, LineSeries
} from 'lightweight-charts';
import type { LineData } from "../useRealTimeData";

interface ChartProps {
  historicalData: LineData[];
  realTimeTick: LineData | null;
  height?: string;
  onChartReady?: (api: IChartApi | null) => void;
}

export const SpreadChartComponent: React.FC<ChartProps> = ({
  historicalData,
  realTimeTick,
  height = '200px',
  onChartReady
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // Efeito 1: Construção
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions: Partial<ChartOptions> = {
      layout: { background: { type: ColorType.Solid, color: '#1A202C' }, textColor: '#D1D5DB' },
      grid: { vertLines: { color: '#2D3748' }, horzLines: { color: '#2D3748' } },

      // << 🔥 INÍCIO DA CORREÇÃO (Scroll/Zoom) 🔥 >>
      handleScroll: {
        mouseWheel: true, // Roda do rato FAZ scroll (pan)
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true, // Permite zoom arrastando os eixos
        mouseWheel: false, // Roda do rato NÃO FAZ zoom
        pinch: true,
      },
      // << 🔥 FIM DA CORREÇÃO 🔥 >>

      timeScale: { 
        timeVisible: true, 
        borderColor: '#4A5568', 
        secondsVisible: true,
        shiftVisibleRangeOnNewBar: true, // Move o gráfico quando uma nova barra aparece
      },
      rightPriceScale: { borderColor: '#4A5568' },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    // ... (O resto do 'useEffect' fica igual) ...
    chartRef.current = chart;

    if (onChartReady) {
      onChartReady(chart);
    }

    const lineSeries = chart.addSeries(LineSeries, {
      color: '#FF9800',
      lineWidth: 2,
    });
    seriesRef.current = lineSeries;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        chart.resize(width, height);
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
    };
  }, [onChartReady]);

  // ... (Efeito 2 e 3 ficam iguais) ...
  // EFEITO 2: Dados Históricos
  useEffect(() => {
    if (historicalData.length > 0 && seriesRef.current) {
      seriesRef.current.setData(historicalData);
      chartRef.current?.timeScale().fitContent();
    }
  }, [historicalData]);

  // EFEITO 3: Ticks em Tempo Real
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