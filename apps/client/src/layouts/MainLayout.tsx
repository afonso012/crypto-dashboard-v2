// Ficheiro: src/layouts/MainLayout.tsx (FICHEIRO NOVO)

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* A nossa Sidebar, que é fixa */}
      <Sidebar />
      
      {/* A área de conteúdo principal, que ocupa o resto do espaço */}
      <main className="flex-1 overflow-auto">
        {/* O 'Outlet' é onde o React Router vai renderizar 
            a 'DashboardPage' ou a 'TradingPage' */}
        <Outlet /> 
      </main>
    </div>
  );
};

export default MainLayout;