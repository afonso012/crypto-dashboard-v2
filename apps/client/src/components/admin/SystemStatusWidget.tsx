"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useApi } from "../../hooks/useApi"

interface SystemStatus {
  apiServer: {
    status: string
    uptime: number
    memory: string
  }
  database: {
    status: string
    latency: string
    trackedSymbols: string
    storage: {
      usedBytes: number
      limitBytes: number
      percentage: number
      label: string
    }
  }
  dataCollector: {
    status: "healthy" | "lagging" | "down"
    lastUpdate: string | null
    secondsSinceUpdate: number
  }
  generatedAt: string
}

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

const StorageBar: React.FC<{ percentage: number; label: string }> = ({ percentage, label }) => {
  let colorClass = "bg-emerald-500"
  if (percentage > 70) colorClass = "bg-yellow-500"
  if (percentage > 90) colorClass = "bg-red-500"

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Armazenamento (Postgres)</span>
        <span className="text-white font-mono">{label}</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/10">
        <div
          className={`h-2.5 rounded-full ${colorClass} transition-all duration-500 shadow-lg shadow-current/50`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

const StatusCard: React.FC<{ title: string; status: string; children: React.ReactNode }> = ({
  title,
  status,
  children,
}) => {
  let statusColor = "bg-emerald-500"
  if (status === "down" || status === "offline") statusColor = "bg-red-500"
  if (status === "lagging") statusColor = "bg-yellow-500"

  return (
    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10 shadow-xl hover:bg-white/10 transition-all duration-300 flex flex-col h-full group">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-gray-300 font-semibold group-hover:text-white transition-colors">{title}</h4>
        <span className={`w-3 h-3 rounded-full ${statusColor} shadow-lg shadow-current animate-pulse`}></span>
      </div>
      <div className="space-y-3 flex-1">{children}</div>
    </div>
  )
}

export const SystemStatusWidget: React.FC = () => {
  const { authFetch } = useApi()
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [clientLatency, setClientLatency] = useState<number | null>(null)

  const fetchStatus = async () => {
    const start = Date.now()
    try {
      const response = await authFetch("/api/admin/system-status")
      const data = await response.json()
      const end = Date.now()

      setClientLatency(end - start)
      setStatus(data)
    } catch (err) {
      console.error("Falha no status:", err)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  if (!status)
    return <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl animate-pulse h-40"></div>

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h3 className="font-bold text-white text-2xl flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Monitorização do Sistema
          </h3>
          <p className="text-gray-400 text-xs mt-1">Atualizado a cada 10 segundos</p>
        </div>
        <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl px-4 py-2">
          <div className="text-xs text-gray-400 uppercase font-bold">Client Latency</div>
          <div
            className={`text-xl font-mono font-bold ${clientLatency && clientLatency > 200 ? "text-yellow-400" : "text-emerald-400"}`}
          >
            {clientLatency ? `${clientLatency}ms` : "..."}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard title="API Server" status={status.apiServer.status}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Uptime:</span>
            <span className="text-white font-mono">{formatUptime(status.apiServer.uptime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Memória:</span>
            <span className="text-white font-mono">{status.apiServer.memory}</span>
          </div>
        </StatusCard>

        <StatusCard title="Base de Dados" status={status.database.status}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Latência BD:</span>
            <span className="text-white font-mono">{status.database.latency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Símbolos Ativos:</span>
            <span className="text-white font-mono">{status.database.trackedSymbols}</span>
          </div>

          <StorageBar percentage={status.database.storage.percentage} label={status.database.storage.label} />
        </StatusCard>

        <StatusCard title="Data Collector" status={status.dataCollector.status}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estado:</span>
            <span
              className={`font-bold ${
                status.dataCollector.status === "healthy"
                  ? "text-emerald-400"
                  : status.dataCollector.status === "lagging"
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {status.dataCollector.status.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Último dado:</span>
            <span className="text-white font-mono">há {status.dataCollector.secondsSinceUpdate}s</span>
          </div>
        </StatusCard>
      </div>
    </div>
  )
}
