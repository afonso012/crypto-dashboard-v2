import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

interface SystemStatus {
  apiServer: {
    status: string;
    uptime: number;
    memory: string;
  };
  database: {
    status: string;
    latency: string;
    trackedSymbols: string;
    // << 🔥 NOVOS DADOS NA INTERFACE 🔥 >>
    storage: {
      usedBytes: number;
      limitBytes: number;
      percentage: number;
      label: string;
    };
  };
  dataCollector: {
    status: 'healthy' | 'lagging' | 'down';
    lastUpdate: string | null;
    secondsSinceUpdate: number;
  };
  generatedAt: string;
}

const formatUptime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
};

// Componente da Barra de Progresso
const StorageBar: React.FC<{ percentage: number; label: string }> = ({ percentage, label }) => {
  // Cor dinâmica baseada na percentagem
  let colorClass = 'bg-green-500';
  if (percentage > 70) colorClass = 'bg-yellow-500';
  if (percentage > 90) colorClass = 'bg-red-500';

  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">Armazenamento (Postgres)</span>
        <span className="text-white font-mono">{label}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full ${colorClass} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ title: string; status: string; children: React.ReactNode }> = ({ title, status, children }) => {
  let statusColor = 'bg-green-500';
  if (status === 'down' || status === 'offline') statusColor = 'bg-red-500';
  if (status === 'lagging') statusColor = 'bg-yellow-500';

  return (
    <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-gray-300 font-semibold">{title}</h4>
        <span className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow-lg shadow-current`}></span>
      </div>
      <div className="space-y-2 flex-1">
        {children}
      </div>
    </div>
  );
};

export const SystemStatusWidget: React.FC = () => {
  const { authFetch } = useApi();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [clientLatency, setClientLatency] = useState<number | null>(null);
  
  const fetchStatus = async () => {
    const start = Date.now();
    try {
      const response = await authFetch('/api/admin/system-status');
      const data = await response.json();
      const end = Date.now();
      
      setClientLatency(end - start);
      setStatus(data);
    } catch (err) {
      console.error("Falha no status:", err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); 
    return () => clearInterval(interval);
  }, []);

  if (!status) return <div className="bg-gray-800 p-6 rounded-lg animate-pulse h-40"></div>;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-bold text-white text-2xl">Monitorização do Sistema</h3>
          <p className="text-gray-400 text-xs mt-1">Atualizado a cada 10 segundos</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase font-bold">Client Latency</div>
          <div className={`text-xl font-mono font-bold ${clientLatency && clientLatency > 200 ? 'text-yellow-400' : 'text-green-400'}`}>
            {clientLatency ? `${clientLatency}ms` : '...'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* 1. API Server */}
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

        {/* 2. Base de Dados */}
        <StatusCard title="Base de Dados" status={status.database.status}>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Latência BD:</span>
            <span className="text-white font-mono">{status.database.latency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Símbolos Ativos:</span>
            <span className="text-white font-mono">{status.database.trackedSymbols}</span>
          </div>
          
          {/* << 🔥 A BARRA DE ARMAZENAMENTO 🔥 >> */}
          <StorageBar 
            percentage={status.database.storage.percentage} 
            label={status.database.storage.label} 
          />
        </StatusCard>

        {/* 3. Data Collector */}
        <StatusCard title="Data Collector" status={status.dataCollector.status}>
           <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estado:</span>
            <span className={`font-bold ${
              status.dataCollector.status === 'healthy' ? 'text-green-400' : 
              status.dataCollector.status === 'lagging' ? 'text-yellow-400' : 'text-red-400'
            }`}>
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
  );
};