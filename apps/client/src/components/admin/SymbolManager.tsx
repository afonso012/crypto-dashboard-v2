// Ficheiro: apps/client/src/components/admin/SymbolManager.tsx (VERSÃO FINAL)

import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

interface TrackedSymbol {
  symbol: string;
  status: 'active' | 'inactive' | 'backfilling';
  addedAt: string;
}

export const SymbolManager: React.FC = () => {
  const { authFetch } = useApi();
  
  // Estados para a Lista e Adicionar
  const [trackedSymbols, setTrackedSymbols] = useState<TrackedSymbol[]>([]);
  const [allBinanceSymbols, setAllBinanceSymbols] = useState<string[]>([]);
  const [newSymbol, setNewSymbol] = useState('');
  
  // Estados para o Preenchimento de Lacunas
  const [fillSymbol, setFillSymbol] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fillLoading, setFillLoading] = useState(false);
  const [fillMessage, setFillMessage] = useState<string | null>(null);

  // Estados Gerais
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 1. FUNÇÕES DE DADOS ---

  const fetchTrackedSymbols = async () => {
    try {
      const response = await authFetch('/api/admin/tracked-symbols');
      const data: TrackedSymbol[] = await response.json();
      setTrackedSymbols(data);
    } catch (err) {
      console.error("Falha ao buscar símbolos monitorizados:", err);
    }
  };

  const fetchBinanceSymbols = async () => {
    try {
      const response = await authFetch('/api/admin/binance-symbols');
      const data: string[] = await response.json();
      setAllBinanceSymbols(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar lista da Binance');
    }
  };

  // Corre na montagem do componente
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchTrackedSymbols(),
        fetchBinanceSymbols()
      ]);
      setIsLoading(false);
    };
    loadAllData();
  }, []);

  // --- 2. AÇÕES DO UTILIZADOR ---

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;

    setError(null);
    try {
      await authFetch('/api/admin/tracked-symbols', {
        method: 'POST',
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase()
        })
      });
      
      setNewSymbol('');
      fetchTrackedSymbols(); // Atualiza a lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar símbolo');
    }
  };

  // Aplica datas predefinidas (Ontem, Semana Passada, etc.)
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    // Formata para datetime-local (YYYY-MM-DDTHH:mm)
    const format = (d: Date) => d.toISOString().slice(0, 16);
    
    setStartDate(format(start));
    setEndDate(format(end));
  };

  // Preenche apenas UM símbolo
  const handleForceFill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fillSymbol || !startDate || !endDate) return;

    setFillLoading(true);
    setFillMessage(null);
    setError(null);

    try {
      const response = await authFetch('/api/admin/force-fill', {
        method: 'POST',
        body: JSON.stringify({
          symbol: fillSymbol,
          startDate,
          endDate
        })
      });
      const data = await response.json();
      setFillMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no preenchimento');
    } finally {
      setFillLoading(false);
    }
  };

  // Preenche TODOS os símbolos (em background)
  const handleForceFillAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Selecione uma data de início e fim.");
      return;
    }

    if (!window.confirm("Isto vai verificar e preencher lacunas para TODAS as criptomoedas ativas. Pode demorar. Continuar?")) {
      return;
    }

    setFillLoading(true);
    setFillMessage(null);
    setError(null);

    try {
      const response = await authFetch('/api/admin/force-fill-all', {
        method: 'POST',
        body: JSON.stringify({
          startDate,
          endDate
        })
      });
      const data = await response.json();
      setFillMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no preenchimento em massa');
    } finally {
      setFillLoading(false);
    }
  };

  // --- 3. RENDERIZAÇÃO ---

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-gray-400">A carregar símbolos...</p>;
    }

    return (
      <ul className="divide-y divide-gray-700">
        {trackedSymbols.length === 0 && (
          <li className="py-2 text-gray-500">Nenhum símbolo a ser monitorizado.</li>
        )}
        {trackedSymbols.map(s => (
          <li key={s.symbol} className="py-3 flex justify-between items-center">
            <div>
              <span className="font-bold text-white">{s.symbol}</span>
              <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium
                ${s.status === 'active' ? 'bg-green-800 text-green-200' : ''}
                ${s.status === 'backfilling' ? 'bg-yellow-800 text-yellow-200' : ''}
                ${s.status === 'inactive' ? 'bg-gray-700 text-gray-300' : ''}
              `}>
                {s.status}
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              Adicionado em: {new Date(s.addedAt).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg mt-6 space-y-8">
      
      {/* SECÇÃO 1: LISTA E ADICIONAR */}
      <div>
        <h3 className="font-bold text-white text-xl mb-4">Gerir Símbolos Monitorizados</h3>
        <div className="mb-6">
            {renderContent()}
        </div>
        
        <form onSubmit={handleAddSymbol}>
           <label htmlFor="symbol-input" className="block text-sm font-medium text-gray-300">
             Adicionar Novo Símbolo
           </label>
           <div className="mt-1 flex gap-2">
            <input
              type="text"
              id="symbol-input"
              list="binance-symbols"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              placeholder="Pesquisar símbolo na Binance (ex: SOLUSDT)"
            />
            <datalist id="binance-symbols">
              {allBinanceSymbols.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700"
            >
              Adicionar
            </button>
           </div>
        </form>
      </div>

      <div className="border-t border-gray-700 pt-6"></div>

      {/* SECÇÃO 2: REPARAÇÃO DE DADOS */}
      <div>
        <h3 className="font-bold text-white text-xl mb-4">Gestão de Histórico e Lacunas</h3>
        <p className="text-gray-400 text-sm mb-4">
          Use esta ferramenta se notar falhas nos gráficos. Ela vai buscar os dados à Binance e recalcular os indicadores.
        </p>

        {/* Botões de Predefinição */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <span className="text-sm text-gray-400 self-center mr-2">Seleção Rápida:</span>
          <button onClick={() => applyPreset(7)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors">
            Última Semana
          </button>
          <button onClick={() => applyPreset(30)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors">
            Último Mês
          </button>
          <button onClick={() => applyPreset(90)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors">
            3 Meses
          </button>
          <button onClick={() => applyPreset(365)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors">
            1 Ano
          </button>
        </div>
        
        <form onSubmit={handleForceFill} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          
          {/* 1. Símbolo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Símbolo</label>
            <select 
              value={fillSymbol} 
              onChange={(e) => setFillSymbol(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Selecione...</option>
              {trackedSymbols.map(s => (
                <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
              ))}
            </select>
          </div>

          {/* 2. Data Início */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Início</label>
            <input 
              type="datetime-local" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 3. Data Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fim</label>
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 4. Botões de Ação */}
          <div className="flex gap-2">
            {/* Botão 1: Preencher Um */}
            <button
              type="submit"
              disabled={fillLoading || !fillSymbol || !startDate || !endDate}
              className={`flex-1 px-3 py-2 font-semibold rounded-md text-white transition-colors text-sm
                ${fillLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
            >
              Preencher Um
            </button>

            {/* Botão 2: Preencher Todos */}
            <button
              type="button"
              onClick={handleForceFillAll}
              disabled={fillLoading || !startDate || !endDate}
              className={`flex-1 px-3 py-2 font-semibold rounded-md text-white transition-colors text-sm
                ${fillLoading 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-purple-600 hover:bg-purple-700'
                }`}
            >
              Preencher Todos
            </button>
          </div>
        </form>

        {fillMessage && (
          <div className="mt-4 p-3 bg-green-900/50 text-green-200 rounded-md text-sm">
            ✅ {fillMessage}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 text-red-200 rounded-md text-sm">
            ❌ {error}
          </div>
        )}
      </div>

    </div>
  );
};