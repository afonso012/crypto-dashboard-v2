"use client"

// Ficheiro: apps/client/src/components/admin/SymbolManager.tsx (VERSÃO FINAL)

import type React from "react"
import { useState, useEffect } from "react"
import { useApi } from "../../hooks/useApi"

interface TrackedSymbol {
  symbol: string
  status: "active" | "inactive" | "backfilling"
  addedAt: string
}

export const SymbolManager: React.FC = () => {
  const { authFetch } = useApi()

  // Estados para a Lista e Adicionar
  const [trackedSymbols, setTrackedSymbols] = useState<TrackedSymbol[]>([])
  const [allBinanceSymbols, setAllBinanceSymbols] = useState<string[]>([])
  const [newSymbol, setNewSymbol] = useState("")

  // Estados para o Preenchimento de Lacunas
  const [fillSymbol, setFillSymbol] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [fillLoading, setFillLoading] = useState(false)
  const [fillMessage, setFillMessage] = useState<string | null>(null)

  // Estados Gerais
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- 1. FUNÇÕES DE DADOS ---

  const fetchTrackedSymbols = async () => {
    try {
      const response = await authFetch("/api/admin/tracked-symbols")
      const data: TrackedSymbol[] = await response.json()
      setTrackedSymbols(data)
    } catch (err) {
      console.error("Falha ao buscar símbolos monitorizados:", err)
    }
  }

  const fetchBinanceSymbols = async () => {
    try {
      const response = await authFetch("/api/admin/binance-symbols")
      const data: string[] = await response.json()
      setAllBinanceSymbols(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar lista da Binance")
    }
  }

  // Corre na montagem do componente
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      setError(null)
      await Promise.all([fetchTrackedSymbols(), fetchBinanceSymbols()])
      setIsLoading(false)
    }
    loadAllData()
  }, [])

  // --- 2. AÇÕES DO UTILIZADOR ---

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSymbol) return

    setError(null)
    try {
      await authFetch("/api/admin/tracked-symbols", {
        method: "POST",
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase(),
        }),
      })

      setNewSymbol("")
      fetchTrackedSymbols() // Atualiza a lista
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar símbolo")
    }
  }

  // Aplica datas predefinidas (Ontem, Semana Passada, etc.)
  const applyPreset = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)

    // Formata para datetime-local (YYYY-MM-DDTHH:mm)
    const format = (d: Date) => d.toISOString().slice(0, 16)

    setStartDate(format(start))
    setEndDate(format(end))
  }

  // Preenche apenas UM símbolo
  const handleForceFill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fillSymbol || !startDate || !endDate) return

    setFillLoading(true)
    setFillMessage(null)
    setError(null)

    try {
      const response = await authFetch("/api/admin/force-fill", {
        method: "POST",
        body: JSON.stringify({
          symbol: fillSymbol,
          startDate,
          endDate,
        }),
      })
      const data = await response.json()
      setFillMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no preenchimento")
    } finally {
      setFillLoading(false)
    }
  }

  // Preenche TODOS os símbolos (em background)
  const handleForceFillAll = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError("Selecione uma data de início e fim.")
      return
    }

    if (
      !window.confirm(
        "Isto vai verificar e preencher lacunas para TODAS as criptomoedas ativas. Pode demorar. Continuar?",
      )
    ) {
      return
    }

    setFillLoading(true)
    setFillMessage(null)
    setError(null)

    try {
      const response = await authFetch("/api/admin/force-fill-all", {
        method: "POST",
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      })
      const data = await response.json()
      setFillMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no preenchimento em massa")
    } finally {
      setFillLoading(false)
    }
  }

  // --- 3. RENDERIZAÇÃO ---

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-gray-400">A carregar símbolos...</p>
    }

    return (
      <ul className="divide-y divide-white/5">
        {trackedSymbols.length === 0 && <li className="py-3 text-gray-500">Nenhum símbolo a ser monitorizado.</li>}
        {trackedSymbols.map((s) => (
          <li
            key={s.symbol}
            className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-white/5 px-3 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-lg">{s.symbol}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border
                ${s.status === "active" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : ""}
                ${s.status === "backfilling" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : ""}
                ${s.status === "inactive" ? "bg-gray-500/20 text-gray-400 border-gray-500/30" : ""}
              `}
              >
                {s.status}
              </span>
            </div>
            <span className="text-gray-400 text-sm">Adicionado em: {new Date(s.addedAt).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-8 hover:shadow-purple-500/10 transition-all duration-300">
      <div>
        <h3 className="font-bold text-white text-xl mb-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          Gerir Símbolos Monitorizados
        </h3>
        <div className="mb-6 backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4">{renderContent()}</div>

        <form onSubmit={handleAddSymbol}>
          <label htmlFor="symbol-input" className="block text-sm font-medium text-gray-300 mb-2">
            Adicionar Novo Símbolo
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="symbol-input"
              list="binance-symbols"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="flex-1 backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              placeholder="Pesquisar símbolo na Binance (ex: SOLUSDT)"
            />
            <datalist id="binance-symbols">
              {allBinanceSymbols.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>

      <div className="border-t border-white/10 pt-8"></div>

      <div>
        <h3 className="font-bold text-white text-xl mb-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
          </svg>
          Gestão de Histórico e Lacunas
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Use esta ferramenta se notar falhas nos gráficos. Ela vai buscar os dados à Binance e recalcular os
          indicadores.
        </p>

        {/* Botões de Predefinição */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <span className="text-sm text-gray-400 self-center mr-2">Seleção Rápida:</span>
          <button
            onClick={() => applyPreset(7)}
            className="px-3 py-2 backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg transition-all hover:border-blue-400"
          >
            Última Semana
          </button>
          <button
            onClick={() => applyPreset(30)}
            className="px-3 py-2 backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg transition-all hover:border-blue-400"
          >
            Último Mês
          </button>
          <button
            onClick={() => applyPreset(90)}
            className="px-3 py-2 backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg transition-all hover:border-blue-400"
          >
            3 Meses
          </button>
          <button
            onClick={() => applyPreset(365)}
            className="px-3 py-2 backdrop-blur-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs rounded-lg transition-all hover:border-blue-400"
          >
            1 Ano
          </button>
        </div>

        <form onSubmit={handleForceFill} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* 1. Símbolo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Símbolo</label>
            <select
              value={fillSymbol}
              onChange={(e) => setFillSymbol(e.target.value)}
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            >
              <option value="">Selecione...</option>
              {trackedSymbols.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Início</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>

          {/* 3. Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Fim</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>

          {/* 4. Botões de Ação */}
          <div className="flex gap-2">
            {/* Botão 1: Preencher Um */}
            <button
              type="submit"
              disabled={fillLoading || !fillSymbol || !startDate || !endDate}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl text-white transition-all text-sm shadow-lg
                ${
                  fillLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 hover:shadow-yellow-500/50"
                }`}
            >
              Preencher Um
            </button>

            {/* Botão 2: Preencher Todos */}
            <button
              type="button"
              onClick={handleForceFillAll}
              disabled={fillLoading || !startDate || !endDate}
              className={`flex-1 px-4 py-3 font-semibold rounded-xl text-white transition-all text-sm shadow-lg
                ${
                  fillLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-500/50"
                }`}
            >
              Preencher Todos
            </button>
          </div>
        </form>

        {/* Alertas */}
        {fillMessage && (
          <div className="mt-4 p-4 backdrop-blur-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {fillMessage}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 backdrop-blur-lg bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
