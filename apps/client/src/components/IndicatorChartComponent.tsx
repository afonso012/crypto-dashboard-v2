// Ficheiro: src/components/IndicatorChartComponent.tsx

import React, { useEffect, useRef } from 'react';
import {
  createChart, type IChartApi, type ISeriesApi,
  ColorType, type ChartOptions, HistogramSeries, AreaSeries
} from 'lightweight-charts';
import type { LineData, HistogramData } from "../useRealTimeData";

type IndicatorData = LineData | HistogramData;
// Mudámos de LineSeries para AreaSeries para ficar mais bonito
type IndicatorSeries = ISeriesApi<"Area"> | ISeriesApi<"Histogram">; 

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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions: Partial<ChartOptions> = {
      layout: { 
        background: { type: ColorType.Solid, color: 'transparent' }, 
        textColor: '#9CA3AF',
        fontFamily: "'Inter', sans-serif",
      },
      grid: { 
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' } 
      },
      crosshair: {
        vertLine: { color: 'rgba(255, 255, 255, 0.2)', style: 3, labelBackgroundColor: '#2d3748' },
        horzLine: { color: 'rgba(255, 255, 255, 0.2)', style: 3, labelBackgroundColor: '#2d3748' },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      timeScale: { 
        visible: true, 
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: true 
      },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: true, borderColor: 'transparent' }, // Sem borda no eixo Y
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;
    
    if (onChartReady) onChartReady(chart);

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
      seriesRef.current = null;
    };
  }, [onChartReady]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    if (chartType === 'line') {
      // Usamos AreaSeries para dar um efeito de "fade" em baixo da linha
      const areaSeries = chart.addSeries(AreaSeries, {
        lineColor: '#F59E0B', // Amber-500 (Laranja Dourado)
        topColor: 'rgba(245, 158, 11, 0.4)', // Gradiente topo
        bottomColor: 'rgba(245, 158, 11, 0.0)', // Gradiente fundo (transparente)
        lineWidth: 2,
        priceScaleId: 'left',
      });
      seriesRef.current = areaSeries;
    } 
    else if (chartType === 'histogram') {
      const histogramSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'left',
        // Cores dinâmicas são definidas nos dados, mas base aqui:
        color: '#6366F1', 
      });
      seriesRef.current = histogramSeries;
    }
  }, [chartType]);

  // Lógica de Dados (igual)
  useEffect(() => {
    if (historicalData.length > 0 && seriesRef.current && chartRef.current) {
      const price = Math.abs(historicalData[0].value);
      const [precision, minMove] = price < 10 ? [4, 0.0001] : [2, 0.01];

      (seriesRef.current as ISeriesApi<"Area" | "Histogram">).applyOptions({
        priceFormat: { type: 'price', precision, minMove }
      });
      chartRef.current.priceScale('left').applyOptions({
        autoScale: true, precision,
      });

      seriesRef.current.setData(historicalData as any);
      chartRef.current.timeScale().fitContent();
    } else if (historicalData.length === 0 && seriesRef.current) {
      seriesRef.current.setData([]);
    }
  }, [historicalData]);

  useEffect(() => {
    if (realTimeTick && seriesRef.current) {
      seriesRef.current.update(realTimeTick as any);
    }
  }, [realTimeTick]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: height }} />;
};