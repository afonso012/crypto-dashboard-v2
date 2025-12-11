import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
// Importação separada do componente e do tipo para evitar erros do Vite
import { StrategyCard } from '../components/strategies/StrategyCard';
import type { Strategy } from '../components/strategies/StrategyCard';

const StrategyLabPage: React.FC = () => {
  const { authFetch } = useApi();
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStrategies = async () => {
    try {
      // O Vite redireciona '/api' para 'localhost:8081'
      const res = await authFetch('/api/strategies');
      
      if (res.ok) {
        const data = await res.json();
        setStrategies(data);
      } else {
        console.error("Erro API:", res.status);
      }
    } catch (error) {
      console.error("Erro ao carregar estratégias", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
    // Atualiza a cada 5 segundos para veres novas estratégias a chegar
    const interval = setInterval(fetchStrategies, 5000); 
    return () => clearInterval(interval);
  }, []);

  // 🔥 LÓGICA DE AGRUPAMENTO: Encontrar o "Campeão" por Símbolo
  // Se tiveres 50 estratégias de BTC, mostra apenas a que tem maior ROI.
  const bestStrategies = Object.values(
    strategies.reduce((acc, strategy) => {
      // Se ainda não temos este símbolo no acumulador, OU se esta estratégia é melhor que a atual
      if (!acc[strategy.symbol] || strategy.roi > acc[strategy.symbol].roi) {
        acc[strategy.symbol] = strategy;
      }
      return acc;
    }, {} as Record<string, Strategy>)
  );

  // Ordenar para que os maiores ROIs apareçam primeiro
  bestStrategies.sort((a, b) => b.roi - a.roi);

  return (
    <div className="p-8 text-white min-h-screen">
      {/* Cabeçalho da Página */}
      <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
            Strategy Lab
          </h1>
          <p className="text-gray-400 mt-2">
            Os <span className="text-emerald-400 font-bold">Campeões Atuais</span> da tua Inteligência Artificial.
          </p>
        </div>
        <div className="text-right">
            <div className="text-4xl font-bold font-mono text-blue-500">{bestStrategies.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ativos Monitorizados</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-sm font-mono text-blue-400 animate-pulse">A sincronizar com a AI...</div>
        </div>
      ) : (
        <>
          {bestStrategies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
              <p className="text-gray-500 mb-4">Ainda não tens estratégias guardadas.</p>
              <p className="text-sm text-gray-600">Vai ao Postman e inicia o <span className="font-mono text-blue-400">/optimizer/start</span></p>
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