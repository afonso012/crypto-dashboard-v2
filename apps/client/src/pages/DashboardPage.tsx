import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { PortfolioWidget } from "../components/dashboard/PortfolioWidget";
import { MarketOverview, NewsFeed } from "../components";

// Interface para os dados ricos que vêm do backend
interface MarketTicker {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
}

const DashboardPage: React.FC = () => {
  const { authFetch } = useApi();
  const navigate = useNavigate();
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar dados ricos (Tickers)
  useEffect(() => {
    const fetchTickers = async () => {
      try {
        // Nota: Certifica-te que o backend está a correr com a nova rota
        const res = await authFetch('/api/market/tickers');
        if (res.ok) {
          const data = await res.json();
          setTickers(data);
        }
      } catch (error) {
        console.error("Erro ao carregar tickers", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickers();
    
    // Opcional: Atualizar a cada 10 segundos para não ficar estático para sempre
    const interval = setInterval(fetchTickers, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 // Para cryptos pequenas podes querer aumentar isto
    }).format(value);
  };

  const formatVolume = (val: number) => {
    if (val >= 1000000000) return `$${(val / 1000000000).toFixed(2)}B`;
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    return `$${(val / 1000).toFixed(0)}K`;
  };

  // Formata o símbolo (ex: BTCUSDT -> BTC)
  const formatSymbol = (s: string) => {
    const asset = s.replace('USDT', '');
    return { asset, pair: `${asset}/USDT` };
  };

  return (
    <div className="p-8 text-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
          Dashboard
        </h1>
        <p className="text-gray-400">Welcome back, here is the market overview.</p>
      </div>

      <div className="mb-10">
        <PortfolioWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <div className="flex justify-between items-end mb-4">
             <h2 className="text-xl font-bold text-white">Market Trend</h2>
             <span className="text-xs text-gray-500">Live Prices (24h)</span>
           </div>
           
           <div className="glass rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 animate-pulse">Loading market data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-left">
                      <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider">Asset</th>
                      <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Last Price</th>
                      <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">24h Change</th>
                      <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Volume (24h)</th>
                      <th className="py-4 px-6 text-xs font-medium text-gray-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickers.map((ticker) => {
                      const { asset, pair } = formatSymbol(ticker.symbol);
                      const isPositive = ticker.changePercent >= 0;

                      return (
                        <tr 
                          key={ticker.symbol} 
                          onClick={() => navigate(`/trading/${ticker.symbol}`)}
                          className="hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          {/* Coluna Nome */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 text-sm font-bold text-blue-300 shadow-lg shadow-blue-500/10">
                                {asset[0]}
                              </div>
                              <div>
                                <div className="font-bold text-white">{asset}</div>
                                <div className="text-xs text-gray-500">{pair}</div>
                              </div>
                            </div>
                          </td>

                          {/* Coluna Preço */}
                          <td className="py-4 px-6 text-right font-mono text-white font-medium">
                            {formatCurrency(ticker.price)}
                          </td>

                          {/* Coluna Variação */}
                          <td className="py-4 px-6 text-right font-mono">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                            </span>
                          </td>

                          {/* Coluna Volume (Substituindo Market Cap por enquanto) */}
                          <td className="py-4 px-6 text-right font-mono text-gray-400 text-sm">
                            {formatVolume(ticker.volume)}
                          </td>

                          {/* Botão Trade */}
                          <td className="py-4 px-6 text-right">
                            <button className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-500/20 translate-x-2 group-hover:translate-x-0">
                              Trade
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <MarketOverview />
          <NewsFeed />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;