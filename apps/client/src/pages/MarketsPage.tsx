// Ficheiro: apps/client/src/pages/MarketsPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export const MarketsPage: React.FC = () => {
  const { authFetch } = useApi();
  const navigate = useNavigate();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const res = await authFetch('/api/market/active-symbols');
        const data = await res.json();
        setSymbols(data);
      } catch (error) {
        console.error("Erro ao carregar mercados", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSymbols();
  }, []);

  const formatSymbol = (s: string) => {
    const asset = s.replace('USDT', '');
    return { asset, pair: `${asset}/USDT` };
  };

  if (isLoading) return <div className="p-8 text-gray-400 animate-pulse">A carregar mercados...</div>;

  return (
    <div className="p-8 min-h-screen text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Markets
        </h1>
        <p className="text-gray-400">Select an asset to start trading</p>
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left">
                <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Market</th>
                <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">24h Change</th>
                <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {symbols.map((symbol) => {
                const { asset, pair } = formatSymbol(symbol);
                return (
                  <tr 
                    key={symbol} 
                    onClick={() => navigate(`/trading/${symbol}`)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-sm font-bold text-blue-300 shadow-lg shadow-blue-500/10">
                          {asset[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg">{asset}</div>
                          <div className="text-xs text-gray-500">{pair}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-300">
                      ---
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-500">---</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 translate-x-2 group-hover:translate-x-0"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};