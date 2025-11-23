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
import { GlassButton } from "../components/ui/GlassButton"

const TradingPage: React.FC = () => {
  const { symbol: urlSymbol } = useParams(); 
  const navigate = useNavigate();
  
  // Se não houver símbolo, volta ao dashboard
  useEffect(() => {
    if (!urlSymbol) {
        navigate('/', { replace: true });
    }
  }, [urlSymbol, navigate]);

  const activeSymbol = urlSymbol || "";
  
  const [isTimeScaleLocked, setIsTimeScaleLocked] = useState(true)
  const [selectedIndicator, setSelectedIndicator] = useState<"spread" | "rsi" | "macd">("spread")
  const [historyDays, setHistoryDays] = useState(1)
  
  const [candleChartApi, setCandleChartApi] = useState<IChartApi | null>(null)
  const [indicatorChartApi, setIndicatorChartApi] = useState<IChartApi | null>(null)
  const syncInProgressRef = useRef(false)

  // Hook de dados em tempo real
  const {
    historicalCandles,
    historicalSpread,
    historicalRSI,
    historicalMACD,
    realTimeCandleTick,
    realTimeSpreadTick,
    realTimeRSITick,
    realTimeMACDTick,
    isLoading,
    error,
  } = useRealTimeData(activeSymbol, historyDays)

  // Sincronização de Gráficos (Mantido igual)
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
        <div className="glass rounded-2xl p-6 relative shadow-2xl border border-white/10">
          <div className="absolute top-6 right-6 z-10 flex gap-1 glass-subtle p-1.5 rounded-xl">
            <GlassButton size="sm" isActive={historyDays === 1} onClick={() => setHistoryDays(1)}>1D</GlassButton>
            <GlassButton size="sm" isActive={historyDays === 3} onClick={() => setHistoryDays(3)}>3D</GlassButton>
            <GlassButton size="sm" isActive={historyDays === 7} onClick={() => setHistoryDays(7)}>1W</GlassButton>
            <GlassButton size="sm" isActive={historyDays === 30} onClick={() => setHistoryDays(30)}>1M</GlassButton>
          </div>

          <CandleChartComponent
            onChartReady={setCandleChartApi}
            historicalData={historicalCandles}
            realTimeTick={realTimeCandleTick}
            height="450px"
          />
        </div>

        <div className="glass rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-white/10">
          <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-white/5">
            <GlassButton size="sm" isActive={selectedIndicator === "spread"} onClick={() => setSelectedIndicator("spread")}>Spread</GlassButton>
            <GlassButton size="sm" isActive={selectedIndicator === "rsi"} onClick={() => setSelectedIndicator("rsi")}>RSI</GlassButton>
            <GlassButton size="sm" isActive={selectedIndicator === "macd"} onClick={() => setSelectedIndicator("macd")}>MACD</GlassButton>
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
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Header Simplificado: Apenas Título e Botão Voltar */}
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
              title="Sync Charts"
            >
              {isTimeScaleLocked ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          {renderChartContent()}
        </div>

        <div className="flex flex-col gap-8">
          <OrderBook />
        </div>
      </div>
    </div>
  )
}

export default TradingPage