// Ficheiro: apps/client/src/pages/TradingPage.tsx

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from 'react-router-dom'
import type { IChartApi, TimeRange } from "lightweight-charts"
import { useRealTimeData } from "../useRealTimeData"
import { CandleChartComponent } from "../components/CandleChartComponent"
import { IndicatorChartComponent } from "../components/IndicatorChartComponent"
import { OrderBook } from "../components"

// --- Componentes de Botão Locais ---

const SymbolButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({
  label,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-200 border
      ${
        isActive
          ? "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/20"
          : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border-white/10"
      }`}
  >
    {label}
  </button>
)

const IndicatorButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({
  label,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200
      ${
        isActive
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
      }`}
  >
    {label}
  </button>
)

const TimeframeButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({
  label,
  isActive,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200
      ${
        isActive
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
      }`}
  >
    {label}
  </button>
)

const OverlayButton: React.FC<{ label: string; isActive: boolean; activeColor: string; onClick: () => void }> = ({
  label,
  isActive,
  activeColor, // ex: "text-amber-400 border-amber-500/30 bg-amber-500/10"
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 border
      ${
        isActive
          ? activeColor
          : "border-transparent bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
      }`}
  >
    {label}
  </button>
)

// --- Componente Principal ---

const TradingPage: React.FC = () => {
  // 1. Gestão de URL e Símbolo
  const { symbol: urlSymbol } = useParams(); 
  const navigate = useNavigate();
  
  // Redireciona se não houver símbolo
  useEffect(() => {
    if (!urlSymbol) navigate('/', { replace: true });
  }, [urlSymbol, navigate]);

  const activeSymbol = urlSymbol || "";
  
  // 2. Estados da Página
  const [isTimeScaleLocked, setIsTimeScaleLocked] = useState(true)
  const [selectedIndicator, setSelectedIndicator] = useState<"spread" | "rsi" | "macd">("spread")
  const [historyDays, setHistoryDays] = useState(1)

  // Estados para os Botões de Overlay (SMA/EMA)
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  
  const [candleChartApi, setCandleChartApi] = useState<IChartApi | null>(null)
  const [indicatorChartApi, setIndicatorChartApi] = useState<IChartApi | null>(null)
  const syncInProgressRef = useRef(false)

  // 3. Hook de Dados (Agora traz os ticks em tempo real para SMA/EMA)
  const {
    historicalCandles,
    historicalSpread,
    historicalRSI,
    historicalMACD,
    historicalSMA,
    historicalEMA,
    realTimeCandleTick,
    realTimeSpreadTick,
    realTimeRSITick,
    realTimeMACDTick,
    realTimeSMATick, // << Recebido do hook atualizado
    realTimeEMATick, // << Recebido do hook atualizado
    isLoading,
    error,
  } = useRealTimeData(activeSymbol, historyDays)

  // 4. Sincronização de Zoom/Scroll entre gráficos
  useEffect(() => {
    const candleChart = candleChartApi
    const indicatorChart = indicatorChartApi
    if (!candleChart || !indicatorChart) return

    const syncAtoB = (timeRange: TimeRange | null) => {
      if (syncInProgressRef.current || !isTimeScaleLocked || !timeRange) return
      syncInProgressRef.current = true
      indicatorChart.timeScale().setVisibleRange(timeRange)
      setTimeout(() => { syncInProgressRef.current = false }, 50)
    }
    const syncBtoA = (timeRange: TimeRange | null) => {
      if (syncInProgressRef.current || !isTimeScaleLocked || !timeRange) return
      syncInProgressRef.current = true
      candleChart.timeScale().setVisibleRange(timeRange)
      setTimeout(() => { syncInProgressRef.current = false }, 50)
    }

    if (isTimeScaleLocked) {
      candleChart.timeScale().subscribeVisibleTimeRangeChange(syncAtoB)
      indicatorChart.timeScale().subscribeVisibleTimeRangeChange(syncBtoA)
    }
    return () => {
      if (isTimeScaleLocked) {
        candleChart.timeScale()?.unsubscribeVisibleTimeRangeChange(syncAtoB)
        indicatorChart.timeScale()?.unsubscribeVisibleTimeRangeChange(syncBtoA)
      }
    }
  }, [candleChartApi, indicatorChartApi, isTimeScaleLocked])

  // 5. Renderização do Conteúdo
  const renderChartContent = () => {
    if (!activeSymbol) return <div className="text-white text-center p-10">Initializing...</div>
    if (isLoading && historicalCandles.length === 0)
      return <div className="text-white text-center p-10 animate-pulse">Loading market data...</div>
    if (error) return <div className="text-red-400 text-center p-10">Error: {error}</div>

    let indicatorData: any[] = []
    let indicatorTick: any = null
    let indicatorType: "line" | "histogram" = "line"

    if (selectedIndicator === "spread") {
      indicatorData = historicalSpread
      indicatorTick = realTimeSpreadTick
      indicatorType = "line"
    } else if (selectedIndicator === "rsi") {
      indicatorData = historicalRSI
      indicatorTick = realTimeRSITick
      indicatorType = "line"
    } else if (selectedIndicator === "macd") {
      indicatorData = historicalMACD
      indicatorTick = realTimeMACDTick
      indicatorType = "histogram"
    }

    return (
      <>
        {/* GRÁFICO PRINCIPAL (VELAS) */}
        <div className="glass rounded-2xl p-6 relative shadow-2xl border border-white/10">
          
          {/* Barra de Ferramentas do Gráfico */}
          <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end">
             
             {/* Timeframes */}
             <div className="flex gap-1 glass-subtle p-1.5 rounded-xl">
                <TimeframeButton label="1D" isActive={historyDays === 1} onClick={() => setHistoryDays(1)} />
                <TimeframeButton label="3D" isActive={historyDays === 3} onClick={() => setHistoryDays(3)} />
                <TimeframeButton label="1W" isActive={historyDays === 7} onClick={() => setHistoryDays(7)} />
                <TimeframeButton label="1M" isActive={historyDays === 30} onClick={() => setHistoryDays(30)} />
                <TimeframeButton label="3M" isActive={historyDays === 90} onClick={() => setHistoryDays(90)} />
                <TimeframeButton label="1Y" isActive={historyDays === 365} onClick={() => setHistoryDays(365)} />
             </div>

             {/* Indicadores de Overlay (SMA/EMA) */}
             <div className="flex gap-1 glass-subtle p-1.5 rounded-xl">
                <OverlayButton 
                    label="SMA 20" 
                    isActive={showSMA} 
                    activeColor="text-amber-400 border-amber-500/30 bg-amber-500/10"
                    onClick={() => setShowSMA(!showSMA)}
                />
                <OverlayButton 
                    label="EMA 50" 
                    isActive={showEMA} 
                    activeColor="text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
                    onClick={() => setShowEMA(!showEMA)}
                />
             </div>
          </div>

          <CandleChartComponent
            onChartReady={setCandleChartApi}
            historicalData={historicalCandles}
            // Passamos os dados históricos apenas se o botão estiver ativo
            smaData={showSMA ? historicalSMA : []}
            emaData={showEMA ? historicalEMA : []}
            realTimeTick={realTimeCandleTick}
            // Passamos os ticks em tempo real (SMA/EMA) se o botão estiver ativo
            realTimeSMATick={showSMA ? realTimeSMATick : null}
            realTimeEMATick={showEMA ? realTimeEMATick : null}
            height="450px"
          />
        </div>

        {/* GRÁFICO SECUNDÁRIO (INDICADORES) */}
        <div className="glass rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-white/10">
          <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/5">
            <IndicatorButton
              label="Spread"
              isActive={selectedIndicator === "spread"}
              onClick={() => setSelectedIndicator("spread")}
            />
            <IndicatorButton
              label="RSI"
              isActive={selectedIndicator === "rsi"}
              onClick={() => setSelectedIndicator("rsi")}
            />
            <IndicatorButton
              label="MACD"
              isActive={selectedIndicator === "macd"}
              onClick={() => setSelectedIndicator("macd")}
            />
          </div>
          <div className="p-6">
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
    )
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna Esquerda: Gráficos */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Header da Página com Botão de Voltar */}
          <div className="flex items-center justify-between px-6 py-4 glass rounded-2xl shadow-2xl border border-white/10">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/')}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    {activeSymbol.replace("USDT", "")}/USDT
                    </h1>
                    <span className="text-xs text-gray-500 font-mono">Real-time Data</span>
                </div>
            </div>

            <button
              onClick={() => setIsTimeScaleLocked(!isTimeScaleLocked)}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isTimeScaleLocked
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
              }`}
              title="Sincronizar Tempo"
            >
              {isTimeScaleLocked ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          {renderChartContent()}
        </div>

        {/* Coluna Direita: Order Book */}
        <div className="flex flex-col gap-8">
          <OrderBook />
        </div>
      </div>
    </div>
  )
}

export default TradingPage