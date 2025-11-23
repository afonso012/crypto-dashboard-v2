// Ficheiro: src/components/IndicatorChartComponent.tsx (CORRIGIDO)

import React, { useEffect, useRef } from 'react';
import {
  createChart, type IChartApi, type ISeriesApi,
  ColorType, type ChartOptions, LineSeries,
  HistogramSeries 
} from 'lightweight-charts';
import type { LineData, HistogramData } from "../useRealTimeData";

type IndicatorData = LineData | HistogramData;
type IndicatorSeries = ISeriesApi<"Line"> | ISeriesApi<"Histogram">;

interface ChartProps {
  historicalData: IndicatorData[];
  realTimeTick: IndicatorData | null;
  chartType: 'line' | 'histogram';
  height?: string;
  onChartReady?: (api: IChartApi | null) => void;
}

export const IndicatorChartComponent: React.FC<ChartProps> = ({
  historicalData,
  realTimeTick,
  chartType,
  height = '200px',
  onChartReady
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<IndicatorSeries | null>(null);

  // Efeito 1: Construção do Gráfico
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

      timeScale: { timeVisible: true, borderColor: '#4A5568', secondsVisible: true, shiftVisibleRangeOnNewBar: true },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: true, borderColor: '#4A5568' },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;
    
    if (onChartReady) {
      onChartReady(chart);
    }

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

  // Efeito 2: Criar/Trocar a Série
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    if (chartType === 'line') {
      const lineSeries = chart.addSeries(LineSeries, {
        color: '#FF9800',
        lineWidth: 2,
        priceScaleId: 'left',
      });
      seriesRef.current = lineSeries;
    } 
    else if (chartType === 'histogram') {
      const histogramSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'left',
      });
      seriesRef.current = histogramSeries;
    }
  }, [chartType]);

  // Efeito 3: Carregar Dados Históricos (Com correção de decimais)
  useEffect(() => {
    if (historicalData.length > 0 && seriesRef.current && chartRef.current) {
      
      const price = Math.abs(historicalData[0].value);
      const [precision, minMove] = price < 10 ? [4, 0.0001] : [2, 0.01];

      (seriesRef.current as ISeriesApi<"Line" | "Histogram">).applyOptions({
        priceFormat: {
          type: 'price',
          precision: precision,
          minMove: minMove,
        }
      });
      chartRef.current.priceScale('left').applyOptions({
        autoScale: true,
        precision: precision,
      });

      seriesRef.current.setData(historicalData as any);
      chartRef.current.timeScale().fitContent();

    } else if (historicalData.length === 0 && seriesRef.current) {
      seriesRef.current.setData([]);
    }
  }, [historicalData]);

  // Efeito 4: Atualizar Ticks em Tempo Real
  useEffect(() => {
    if (realTimeTick && seriesRef.current) {
      seriesRef.current.update(realTimeTick as any);
    }
  }, [realTimeTick]);

  return (
    <div
      ref={chartContainerRef}
      style={{ width: '100%', height: height }}
    />
  );
};