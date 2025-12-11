import React from 'react';

// --- DEFINIÇÃO DE TIPOS (Para o TypeScript não reclamar) ---
export interface StrategyRule {
  indicator: string;
  period: number;
  operator: string;
  value: number | string;
  weight: number;
}

export interface StrategyConfig {
  entryRules: StrategyRule[];
  exitRules: StrategyRule[];
  stopLossPct: number;
  takeProfitPct: number;
}

export interface Strategy {
  id: string;
  name: string;
  symbol: string;
  roi: number;
  drawdown: number;
  winRate: number;
  trades: number;
  config: StrategyConfig;
  createdAt: string;
}

// --- SUB-COMPONENTE: BADGE DE REGRA ---
// Transforma "indicator: RSI, op: <, val: 30" num chip visual
const RuleBadge = ({ rule }: { rule: StrategyRule }) => {
  const val = rule.value === 'PRICE' ? 'Preço' : rule.value;
  return (
    <div className="inline-flex items-center px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-gray-300 mr-2 mb-2 shadow-sm">
      <span className="font-bold text-blue-400 mr-1">{rule.indicator}</span>
      {/* Mostra o período se fizer sentido (ex: RSI 14) */}
      <span className="text-gray-500 mr-1 text-[10px]">({rule.period})</span>
      <span className="text-yellow-500 mr-1 font-bold">{rule.operator}</span>
      <span className="font-mono text-white">{val}</span>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const StrategyCard: React.FC<{ strategy: Strategy }> = ({ strategy }) => {
  // Tratamento de valores para evitar erros se vierem null
  const roi = strategy.roi ?? 0;
  const drawdown = strategy.drawdown ?? 0;
  const winRate = strategy.winRate ?? 0;
  const trades = strategy.trades ?? 0;
  const isPositive = roi >= 0;

  // Formatação de data
  const dateStr = strategy.createdAt 
    ? new Date(strategy.createdAt).toLocaleDateString('pt-PT', { 
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
      }) 
    : 'Data desconhecida';

  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-white/10 bg-[#0F1225]/80 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group">
      
      {/* Cabeçalho do Cartão */}
      <div className="p-6 border-b border-white/5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                {strategy.symbol}
              </span>
              <span className="text-xs text-gray-500 font-mono">{dateStr}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-2 group-hover:text-blue-400 transition-colors truncate w-full">
              {strategy.name}
            </h3>
          </div>
          
          {/* Badge do ROI Grande */}
          <div className={`flex flex-col items-end`}>
            <span className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{roi.toFixed(2)}%
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Retorno Total</span>
          </div>
        </div>
      </div>

      {/* Estatísticas (Grid) */}
      <div className="grid grid-cols-3 divide-x divide-white/5 bg-white/[0.02]">
        <div className="p-4 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Risco (DD)</div>
          <div className="text-red-400 font-mono font-bold text-sm">{(drawdown).toFixed(2)}%</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Win Rate</div>
          <div className={`font-mono font-bold text-sm ${winRate > 50 ? 'text-blue-400' : 'text-yellow-500'}`}>
            {winRate.toFixed(1)}%
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trades</div>
          <div className="text-white font-mono font-bold text-sm">{trades}</div>
        </div>
      </div>

      {/* Regras e Configuração */}
      <div className="p-6 space-y-4">
        
        {/* Regras de Entrada */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Sinais de Compra
          </h4>
          <div className="flex flex-wrap gap-1">
            {strategy.config?.entryRules?.length > 0 ? (
              strategy.config.entryRules.map((rule, i) => (
                <RuleBadge key={i} rule={rule} />
              ))
            ) : (
              <span className="text-xs text-gray-600 italic">Sem regras definidas</span>
            )}
          </div>
        </div>

        {/* Gestão de Risco (TP / SL) */}
        <div className="pt-4 border-t border-white/5 flex justify-between items-center text-sm font-mono">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-[10px] uppercase">Take Profit</span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              {(strategy.config?.takeProfitPct * 100 || 0).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="text-[10px] uppercase">Stop Loss</span>
            <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
              {(strategy.config?.stopLossPct * 100 || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Botão de Ação (Futuro) */}
      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex justify-end">
        <button className="text-xs font-bold text-blue-400 hover:text-white transition-colors flex items-center gap-1 group/btn">
          Ver Detalhes 
          <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
};