// Ficheiro: apps/client/src/components/dashboard/PortfolioWidget.tsx

import React from "react";

export const PortfolioWidget: React.FC = () => (
  <div className="glass rounded-2xl p-8 shadow-2xl relative overflow-hidden shimmer">
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

    <div className="relative z-10">
      <h3 className="font-bold text-white text-2xl mb-6">Portfolio Summary</h3>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <span className="text-gray-400 text-sm uppercase tracking-wider font-medium">Total Value</span>
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
            $12,450.78
          </div>
        </div>
        <div className="space-y-2 text-right">
          <span className="text-gray-400 text-sm uppercase tracking-wider font-medium">24h Change</span>
          <div className="text-2xl font-semibold text-red-400">
            -$130.22 <span className="text-lg">(-1.04%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="glass-subtle rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Assets</p>
          <p className="text-white text-xl font-bold">8</p>
        </div>
        <div className="glass-subtle rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Profit</p>
          <p className="text-emerald-400 text-xl font-bold">+12.5%</p>
        </div>
        <div className="glass-subtle rounded-xl p-4 border border-white/10">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Risk Level</p>
          <p className="text-blue-400 text-xl font-bold">Medium</p>
        </div>
      </div>
    </div>
  </div>
);