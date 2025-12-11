import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import type { Strategy } from '../components/strategies/StrategyCard';
import { StrategyCard } from '../components/strategies/StrategyCard';

const StrategyLabPage: React.FC = () => {
  const { authFetch } = useApi();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔥 Estado para controlar a Mineração
  const [isMining, setIsMining] = useState(false);
  const [miningStatus, setMiningStatus] = useState(''); // Para mostrar mensagens ao utilizador

  const fetchStrategies = async () => {
    try {
      const res = await authFetch('/api/strategies');
      if (res.ok) {
        const data = await res.json();
        setStrategies(data);
      }
    } catch (error) {
      console.error("Erro ao carregar estratégias", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
    const interval = setInterval(fetchStrategies, 5000); 
    return () => clearInterval(interval);
  }, []);

  // ⛏️ FUNÇÃO DE MINERAÇÃO (Chama a AI)
  const handleStartMining = async () => {
    setIsMining(true);
    setMiningStatus('A inicializar AI...');

    try {
      // 1. Enviar pedido para o Otimizador (via Proxy configurado no Vite)
      // Usamos POST e pedimos 5 tentativas para ser mais rápido na UI (podes por 10)
      const response = await fetch('/optimizer/start?symbol=BTCUSDT&attempts=5', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        setMiningStatus(`✅ Sucesso! ROI: ${result.roi}%`);
        
        // Atualiza a lista imediatamente para ver o novo cartão
        await fetchStrategies();
        
        // Limpa a mensagem após 3 segundos
        setTimeout(() => {
            setIsMining(false);
            setMiningStatus('');
        }, 3000);

      } else {
        setMiningStatus('⚠️ AI não encontrou nada bom.');
        setTimeout(() => setIsMining(false), 3000);
      }
    } catch (error) {
      console.error(error);
      setMiningStatus('❌ Erro de Conexão.');
      setIsMining(false);
    }
  };

  // Lógica de Agrupamento (Mantém-se igual)
  const bestStrategies = Object.values(
    strategies.reduce((acc, strategy) => {
      const currentMsgDate = new Date(strategy.createdAt).getTime();
      const storedMsgDate = acc[strategy.symbol] ? new Date(acc[strategy.symbol].createdAt).getTime() : 0;
      if (!acc[strategy.symbol] || currentMsgDate > storedMsgDate) {
        acc[strategy.symbol] = strategy;
      }
      return acc;
    }, {} as Record<string, Strategy>)
  );
  bestStrategies.sort((a, b) => b.roi - a.roi);

  return (
    <div className="p-8 text-white min-h-screen">
      {/* Cabeçalho Melhorado */}
      <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
            Strategy Lab
          </h1>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            Os <span className="text-emerald-400 font-bold">Campeões Atuais</span> da tua Inteligência Artificial.
          </p>
        </div>

        {/* 🧠 BOTÃO DE AÇÃO + CONTADOR */}
        <div className="flex flex-col items-end gap-4">
            
            {/* Botão de Mineração */}
            <button
                onClick={handleStartMining}
                disabled={isMining}
                className={`
                    flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all shadow-lg
                    ${isMining 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-white/5' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/20 hover:scale-105 active:scale-95'
                    }
                `}
            >
                {isMining ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>{miningStatus || 'A Minerar Alpha...'}</span>
                    </>
                ) : (
                    <>
                        <span className="text-xl">⛏️</span>
                        <span>Gerar Nova Estratégia</span>
                    </>
                )}
            </button>

            <div className="text-right">
                <div className="text-2xl font-bold font-mono text-gray-500">{bestStrategies.length}</div>
                <div className="text-[10px] text-gray-600 uppercase tracking-widest">Ativos</div>
            </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-sm font-mono text-blue-400 animate-pulse">A carregar laboratório...</div>
        </div>
      ) : (
        <>
          {bestStrategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
              <p className="text-gray-500 mb-4">O laboratório está vazio.</p>
              {/* Sugestão visual para clicar no botão novo */}
              <p className="text-sm text-gray-600">Clica em <span className="text-blue-400 font-bold">Gerar Nova Estratégia</span> para começares.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bestStrategies.map((strategy) => (
                <div 
                    key={strategy.id} 
                    onClick={() => navigate(`/strategies/${strategy.id}`)}
                    className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
                >
                    <StrategyCard strategy={strategy} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StrategyLabPage;