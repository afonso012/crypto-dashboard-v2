// Ficheiro: src/components/CandleChartComponent.tsx

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

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartOptions: Partial<ChartOptions> = {
      layout: { 
        // Fundo transparente para assumir a cor do "glass"
        background: { type: ColorType.Solid, color: 'transparent' }, 
        textColor: '#9CA3AF', // Gray-400 (mais suave que branco puro)
        fontFamily: "'Inter', sans-serif",
      },
      grid: { 
        // Grelha muito subtil, quase invisível
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' } 
      },
      crosshair: {
        // Mira mais moderna
        mode: 1, // Magnet
        vertLine: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.2)',
          style: 3, // Dashed
          labelBackgroundColor: '#2d3748',
        },
        horzLine: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.2)',
          style: 3,
          labelBackgroundColor: '#2d3748',
        },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      timeScale: { 
        borderColor: 'rgba(255, 255, 255, 0.1)', 
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: { 
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    };

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    const removeLogo = () => {
      if (!chartContainerRef.current) return;
      
      // Procura pelo ID específico que mostraste na imagem
      const logoId = chartContainerRef.current.querySelector('#tradingview-copyright-link');
      if (logoId) {
        logoId.remove(); // Remove o elemento do HTML
      }

      // Procura também por qualquer link que aponte para o tradingview (segurança extra)
      const links = chartContainerRef.current.querySelectorAll('a[href*="tradingview.com"]');
      links.forEach(link => {
        (link as HTMLElement).style.display = 'none'; // Esconde
        link.remove(); // Remove
      });
    };

    removeLogo();
    
    setTimeout(removeLogo, 100);

    if (onChartReady) onChartReady(chart);

    const candleSeries = chart.addSeries(CandlestickSeries, {
      // Cores mais vibrantes e "Glow" simulado nas bordas
      upColor: '#10B981', // Emerald-500
      downColor: '#EF4444', // Red-500
      borderVisible: false,
      wickUpColor: '#34D399', // Emerald-400 (mais claro para brilho)
      wickDownColor: '#F87171', // Red-400
    });
    
    seriesRef.current = candleSeries;

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

  // Efeito de Dados (Mantém a lógica de precisão)
  useEffect(() => {
    if (historicalData.length > 0 && seriesRef.current && chartRef.current) {
      const price = historicalData[0].close;
      const [precision, minMove] = price < 100 ? [4, 0.0001] : [2, 0.01];

      seriesRef.current.applyOptions({
        priceFormat: { type: 'price', precision, minMove }
      });
      chartRef.current.priceScale('right').applyOptions({
        autoScale: true, precision,
      });
      seriesRef.current.setData(historicalData);
      chartRef.current.timeScale().fitContent();
    }
  }, [historicalData]);

  useEffect(() => {
    if (realTimeTick && seriesRef.current) seriesRef.current.update(realTimeTick);
  }, [realTimeTick]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: height }} />;
};