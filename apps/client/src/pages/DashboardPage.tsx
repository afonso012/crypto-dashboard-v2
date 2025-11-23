// Ficheiro: src/pages/DashboardPage.tsx (FICHEIRO NOVO)

import React from 'react';
// Importa os widgets que já tínhamos (assumindo que estão em src/components)
import { MarketOverview, OrderBook, NewsFeed } from '../components'; 

// Um widget de placeholder para o "Portfólio"
const PortfolioWidget = () => (
  <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
    <h3 className="font-bold text-white text-xl mb-4">Resumo do Portfólio</h3>
    <div className="flex justify-between items-center">
      <span className="text-gray-400">Valor Total (simulado)</span>
      <span className="text-3xl font-bold text-green-500">$12,450.78</span>
    </div>
    <div className="flex justify-between items-center mt-2">
      <span className="text-gray-400">Ganhos/Perdas 24h</span>
      <span className="text-lg font-semibold text-red-500">-$130.22 (-1.04%)</span>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  return (
    // O MainLayout já dá o fundo, mas adicionamos padding à página
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Widget principal de "boas-vindas" */}
      <PortfolioWidget />

      {/* Grelha para os outros widgets */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Coluna 1 */}
        <div className="flex flex-col gap-6">
          <MarketOverview />
          <NewsFeed />
        </div>
        
        {/* Coluna 2 */}
        <div className="flex flex-col gap-6">
          <OrderBook />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;