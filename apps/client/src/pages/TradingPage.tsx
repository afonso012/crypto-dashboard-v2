import React, { useState, useEffect, useRef } from 'react';
import type { IChartApi, TimeRange } from 'lightweight-charts'; 
import { useRealTimeData } from '../useRealTimeData';
import { CandleChartComponent } from '../components/CandleChartComponent';
import { IndicatorChartComponent } from '../components/IndicatorChartComponent';
import { MarketOverview, OrderBook, NewsFeed } from '../components'; 

// Botões de Símbolo (Estilo Huly/Glassy simples)
const SymbolButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-sm font-bold rounded transition-colors
      ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
  >
    {label}
  </button>
);

// Botões de Indicador
const IndicatorButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs font-medium rounded transition-colors
      ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
  >
    {label}
  </button>
);

// << 🔥 NOVOS BOTÕES DE TEMPO 🔥 >>
const TimeframeButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 text-xs font-bold rounded border transition-colors
      ${isActive
        ? 'bg-gray-600 text-white border-gray-500'
        : 'bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-gray-800'
      }`}
  >
    {label}
  </button>
);

const TradingPage: React.FC = () => {
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState<string | null>(null);
  const [isTimeScaleLocked, setIsTimeScaleLocked] = useState(true);
  const [selectedIndicator, setSelectedIndicator] = useState<'spread' | 'rsi' | 'macd'>('spread');
  
  // << 🔥 NOVO ESTADO: Histórico em Dias 🔥 >>
  const [historyDays, setHistoryDays] = useState(1); // Default: 1 Dia

  const [candleChartApi, setCandleChartApi] = useState<IChartApi | null>(null);
  const [indicatorChartApi, setIndicatorChartApi] = useState<IChartApi | null>(null);
  const syncInProgressRef = useRef(false);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch('/api/market/active-symbols'); 
        if (!response.ok) throw new Error('Falha');
        const symbols: string[] = await response.json();
        setAvailableSymbols(symbols);
        if (symbols.length > 0) setSymbol(symbols[0]);
      } catch (err) {
        setAvailableSymbols(['BTCUSDT', 'ETHUSDT']);
        setSymbol('BTCUSDT');
      }
    };
    fetchSymbols();
  }, []); 

  // << 🔥 PASSAMOS O 'historyDays' PARA O HOOK 🔥 >>
  const { 
    historicalCandles, historicalSpread, historicalRSI, historicalMACD,
    realTimeCandleTick, realTimeSpreadTick, realTimeRSITick, realTimeMACDTick,
    isLoading, error 
  } = useRealTimeData(symbol || '', historyDays); 

  // Sincronização (Cadeado)
  useEffect(() => {
    const candleChart = candleChartApi;
    const indicatorChart = indicatorChartApi; 
    if (!candleChart || !indicatorChart) return;

    const syncAtoB = (timeRange: TimeRange | null) => {
      if (syncInProgressRef.current || !isTimeScaleLocked || !timeRange) return;
      syncInProgressRef.current = true;
      indicatorChart.timeScale().setVisibleRange(timeRange);
      setTimeout(() => { syncInProgressRef.current = false; }, 50);
    };
    const syncBtoA = (timeRange: TimeRange | null) => {
      if (syncInProgressRef.current || !isTimeScaleLocked || !timeRange) return;
      syncInProgressRef.current = true;
      candleChart.timeScale().setVisibleRange(timeRange);
      setTimeout(() => { syncInProgressRef.current = false; }, 50);
    };

    if (isTimeScaleLocked) {
      candleChart.timeScale().subscribeVisibleTimeRangeChange(syncAtoB);
      indicatorChart.timeScale().subscribeVisibleTimeRangeChange(syncBtoA);
    }
    return () => {
      if (isTimeScaleLocked) {
        candleChart.timeScale()?.unsubscribeVisibleTimeRangeChange(syncAtoB);
        indicatorChart.timeScale()?.unsubscribeVisibleTimeRangeChange(syncBtoA);
      }
    };
  }, [candleChartApi, indicatorChartApi, isTimeScaleLocked]); 

  
  const renderChartContent = () => {
    // Mostra loading enquanto carrega, mas mantém a UI estável se já tivermos símbolo
    if (!symbol) return <div className="text-white text-center p-10">A iniciar...</div>;
    if (isLoading && historicalCandles.length === 0) return <div className="text-white text-center p-10">A carregar dados...</div>;
    if (error) return <div className="text-red-500 text-center p-10">Erro: {error}</div>;

    let indicatorData: any[] = [];
    let indicatorTick: any = null;
    let indicatorType: 'line' | 'histogram' = 'line';

    if (selectedIndicator === 'spread') {
      indicatorData = historicalSpread; indicatorTick = realTimeSpreadTick; indicatorType = 'line';
    } else if (selectedIndicator === 'rsi') {
      indicatorData = historicalRSI; indicatorTick = realTimeRSITick; indicatorType = 'line';
    } else if (selectedIndicator === 'macd') {
      indicatorData = historicalMACD; indicatorTick = realTimeMACDTick; indicatorType = 'histogram';
    }

    return (
      <>
        {/* Gráfico de Velas */}
        <div className="bg-gray-800 rounded-lg p-4 relative">
          
          {/* << 🔥 BARRA DE FERRAMENTAS DE TEMPO (No topo do gráfico) 🔥 >> */}
          <div className="absolute top-4 right-16 z-10 flex gap-1 bg-gray-900/80 p-1 rounded-md backdrop-blur-sm border border-gray-700">
            <TimeframeButton label="1D" isActive={historyDays === 1} onClick={() => setHistoryDays(1)} />
            <TimeframeButton label="3D" isActive={historyDays === 3} onClick={() => setHistoryDays(3)} />
            <TimeframeButton label="1S" isActive={historyDays === 7} onClick={() => setHistoryDays(7)} />
            <TimeframeButton label="1M" isActive={historyDays === 30} onClick={() => setHistoryDays(30)} />
            <TimeframeButton label="3M" isActive={historyDays === 90} onClick={() => setHistoryDays(90)} />
            <TimeframeButton label="1A" isActive={historyDays === 365} onClick={() => setHistoryDays(365)} />
          </div>

          <CandleChartComponent
            onChartReady={setCandleChartApi}
            historicalData={historicalCandles}
            realTimeTick={realTimeCandleTick}
            height="450px"
          />
        </div>
        
        {/* Painel de Indicadores */}
        <div className="bg-gray-800 rounded-lg flex flex-col">
          <div className="flex items-center gap-2 p-2 border-b border-gray-700">
            <IndicatorButton label="Spread" isActive={selectedIndicator === 'spread'} onClick={() => setSelectedIndicator('spread')} />
            <IndicatorButton label="RSI" isActive={selectedIndicator === 'rsi'} onClick={() => setSelectedIndicator('rsi')} />
            <IndicatorButton label="MACD" isActive={selectedIndicator === 'macd'} onClick={() => setSelectedIndicator('macd')} />
          </div>
          <div className="p-4">
            <IndicatorChartComponent
              onChartReady={setIndicatorChartApi}
              historicalData={indicatorData}
              realTimeTick={indicatorTick}
              chartType={indicatorType}
              height="200px"
            />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Header */}
          <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 rounded-lg overflow-x-auto">
            <h1 className="text-xl font-bold text-white mr-4">{symbol || '...'}</h1>
            {availableSymbols.map((s) => (
              <SymbolButton key={s} label={s.replace('USDT', '')} isActive={symbol === s} onClick={() => setSymbol(s)} />
            ))}
            <div className="flex-grow"></div>
            <button onClick={() => setIsTimeScaleLocked(!isTimeScaleLocked)} className="p-2 rounded-md text-xl hover:bg-gray-700" title="Sincronizar Tempo">
              {isTimeScaleLocked ? '🔒' : '🔓'}
            </button>
          </div>

          {renderChartContent()}
        </div>

        {/* Barra Lateral */}
        <div className="flex flex-col gap-4">
          <MarketOverview />
          <OrderBook />
          <NewsFeed />
        </div>
      </div>
    </div>
  );
};

export default TradingPage;