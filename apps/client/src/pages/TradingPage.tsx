"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { IChartApi, TimeRange } from "lightweight-charts"
import { useRealTimeData } from "../useRealTimeData"
import { CandleChartComponent } from "../components/CandleChartComponent"
import { IndicatorChartComponent } from "../components/IndicatorChartComponent"
import { MarketOverview, OrderBook, NewsFeed } from "../components"

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

const TradingPage: React.FC = () => {
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([])
  const [symbol, setSymbol] = useState<string | null>(null)
  const [isTimeScaleLocked, setIsTimeScaleLocked] = useState(true)
  const [selectedIndicator, setSelectedIndicator] = useState<"spread" | "rsi" | "macd">("spread")
  const [historyDays, setHistoryDays] = useState(1)
  const [candleChartApi, setCandleChartApi] = useState<IChartApi | null>(null)
  const [indicatorChartApi, setIndicatorChartApi] = useState<IChartApi | null>(null)
  const syncInProgressRef = useRef(false)

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch("/api/market/active-symbols")
        if (!response.ok) throw new Error("Falha")
        const symbols: string[] = await response.json()
        setAvailableSymbols(symbols)
        if (symbols.length > 0) setSymbol(symbols[0])
      } catch (err) {
        setAvailableSymbols(["BTCUSDT", "ETHUSDT"])
        setSymbol("BTCUSDT")
      }
    }
    fetchSymbols()
  }, [])

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
  } = useRealTimeData(symbol || "", historyDays)

  useEffect(() => {
    const candleChart = candleChartApi
    const indicatorChart = indicatorChartApi
    if (!candleChart || !indicatorChart) return

    const syncAtoB = (timeRange: TimeRange | null) => {
      if (syncInProgressRef.current || !isTimeScaleLocked || !timeRange) return
      syncInProgressRef.current = true
      indicatorChart.timeScale().setVisibleRange(timeRange)
      setTimeout(() => {
        syncInProgressRef.current = false
      }, 50)
    }
    const syncBtoA = (timeRange: TimeRange | null) => {
      if (syncInProgressRef.current || !isTimeScaleLocked || !timeRange) return
      syncInProgressRef.current = true
      candleChart.timeScale().setVisibleRange(timeRange)
      setTimeout(() => {
        syncInProgressRef.current = false
      }, 50)
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
    if (!symbol) return <div className="text-white text-center p-10">A iniciar...</div>
    if (isLoading && historicalCandles.length === 0)
      return <div className="text-white text-center p-10">A carregar dados...</div>
    if (error) return <div className="text-red-400 text-center p-10">Erro: {error}</div>

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
        <div className="glass rounded-2xl p-6 relative shadow-2xl">
          <div className="absolute top-6 right-6 z-10 flex gap-1 glass-subtle p-1.5 rounded-xl">
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

        <div className="glass rounded-2xl flex flex-col shadow-2xl overflow-hidden">
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
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex items-center gap-4 px-6 py-4 glass rounded-2xl overflow-x-auto shadow-2xl">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mr-4">
              {symbol || "..."}
            </h1>
            {availableSymbols.map((s) => (
              <SymbolButton
                key={s}
                label={s.replace("USDT", "")}
                isActive={symbol === s}
                onClick={() => setSymbol(s)}
              />
            ))}
            <div className="flex-grow"></div>
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>

          {renderChartContent()}
        </div>

        <div className="flex flex-col gap-8">
          <MarketOverview />
          <OrderBook />
          <NewsFeed />
        </div>
      </div>
    </div>
  )
}

export default TradingPage
