import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { Strategy } from '../components/strategies/StrategyCard';

const StrategyDetailsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useApi();
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  useEffect(() => {
    // Buscar todas e filtrar
    authFetch('/api/strategies').then(async (res) => {
      if (res.ok) {
        const strategies: Strategy[] = await res.json();
        const found = strategies.find(s => s.id === id);
        setStrategy(found || null);
      }
    });
  }, [id]);

  // 🔥 CORREÇÃO: O useMemo tem de estar ANTES de qualquer 'return'
  const chartData = useMemo(() => {
    // Se não houver estratégia ou histórico, retorna dados vazios seguros
    if (!strategy?.tradeHistory || strategy.tradeHistory.length === 0) {
        return [{ name: 'Inicio', value: 1000 }];
    }

    let currentBalance = 1000; 
    const data = [{ name: 'Start', value: 1000, reason: 'Start' }];

    strategy.tradeHistory.forEach((trade: any) => {
        // trade.roi vem da API (ex: 5.23)
        currentBalance = currentBalance * (1 + (trade.roi / 100));
        
        data.push({
            name: new Date(trade.exitDate).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: '2-digit' }),
            value: currentBalance,
            // @ts-ignore
            reason: trade.reason || 'Trade'
        });
    });

    return data;
  }, [strategy]); // Dependência: recalcula se 'strategy' mudar

  // 🔥 SÓ AGORA é que podemos fazer o return condicional (Loading)
  if (!strategy) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-500">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        A carregar detalhes...
    </div>
  );

  return (
    <div className="p-8 text-white min-h-screen animate-fade-in">
      {/* Botão Voltar */}
      <button onClick={() => navigate('/strategies')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Lab
      </button>

      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{strategy.name}</h1>
            <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase border border-blue-500/30">
              {strategy.symbol}
            </span>
          </div>
          <p className="text-gray-400 font-mono text-xs opacity-70">ID: {strategy.id}</p>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold font-mono ${strategy.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {strategy.roi >= 0 ? '+' : ''}{strategy.roi.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-500 uppercase mt-2 tracking-widest">Retorno Total</div>
        </div>
      </div>

      {/* GRÁFICO DE EQUITY */}
      <div className="glass p-6 rounded-2xl border border-white/10 mb-8 bg-[#0F1225]/50">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          📈 Crescimento do Capital
          <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded">(Dados Reais WFA)</span>
        </h3>
        
        {/* 🔥 CORREÇÃO: Usar style={{ height: 400 }} garante que o Recharts sabe o tamanho */}
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strategy.roi >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={strategy.roi >= 0 ? "#10B981" : "#EF4444"} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} dy={10} minTickGap={30} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Saldo']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={strategy.roi >= 0 ? "#10B981" : "#EF4444"} 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRELHA DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500 text-6xl font-bold">DD</div>
          <div className="text-gray-500 text-xs uppercase mb-2 tracking-wider">Risco Máximo</div>
          <div className="text-3xl font-bold text-red-400">{(strategy.drawdown).toFixed(2)}%</div>
        </div>
        <div className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500 text-6xl font-bold">%</div>
          <div className="text-gray-500 text-xs uppercase mb-2 tracking-wider">Win Rate</div>
          <div className="text-3xl font-bold text-blue-400">{strategy.winRate.toFixed(1)}%</div>
        </div>
        <div className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-white text-6xl font-bold">#</div>
          <div className="text-gray-500 text-xs uppercase mb-2 tracking-wider">Total Trades</div>
          <div className="text-3xl font-bold text-white">{strategy.trades}</div>
        </div>
      </div>

      {/* LÓGICA / REGRAS */}
      <div className="glass p-8 rounded-2xl border border-white/10">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            🧠 Lógica da AI 
            <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-1 rounded">Configuração Interna</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Entradas */}
          <div>
            <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-widest mb-6 border-b border-white/10 pb-2">
              Sinais de Entrada (COMPRA)
            </h4>
            <div className="space-y-4">
              {strategy.config.entryRules.map((rule, i) => (
                <div key={i} className="flex items-center justify-between bg-[#111827] p-4 rounded-xl border border-white/5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {rule.indicator.substring(0,3)}
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">{rule.indicator}</div>
                        <div className="text-xs text-gray-500">Período: {rule.period}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded text-sm">
                    <span className="text-yellow-500 font-bold">{rule.operator}</span>
                    <span className="font-mono text-white font-bold">{rule.value === 'PRICE' ? 'Preço' : rule.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saídas e Risco */}
          <div>
            <h4 className="text-red-400 font-bold uppercase text-xs tracking-widest mb-6 border-b border-white/10 pb-2">
              Gestão de Risco (VENDA)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#111827] p-4 rounded-xl border border-white/5 text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">Take Profit</div>
                <div className="text-xl font-mono font-bold text-emerald-400">{(strategy.config.takeProfitPct * 100).toFixed(2)}%</div>
              </div>
              <div className="bg-[#111827] p-4 rounded-xl border border-white/5 text-center">
                <div className="text-xs text-gray-500 uppercase mb-1">Stop Loss</div>
                <div className="text-xl font-mono font-bold text-red-400">{(strategy.config.stopLossPct * 100).toFixed(2)}%</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                <p className="text-xs text-yellow-200/70 leading-relaxed">
                    ℹ️ Esta estratégia usa um Rácio Risco/Retorno de 
                    <strong className="text-white ml-1">
                        1 : {((strategy.config.takeProfitPct) / (strategy.config.stopLossPct)).toFixed(1)}
                    </strong>.
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyDetailsPage;