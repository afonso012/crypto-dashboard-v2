// Ficheiro: apps/client/src/layouts/MainLayout.tsx

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

// Ícone Hambúrguer (Menu)
const IconMenu = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
)

const MainLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#0a0d14] overflow-hidden bg-gradient-to-br from-[#0a0d14] via-[#0f1419] to-[#0a0d14]">
      {/* Background Noise Texture (Opcional, se já tiveres no CSS global não precisas aqui) */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,...")' }}></div>

      {/* Sidebar: Controlada pelo estado em mobile, sempre visível em desktop */}
      <Sidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Área Principal */}
      <div className="flex flex-1 flex-col h-full overflow-hidden relative z-10">
        
        {/* Mobile Header (SÓ aparece em ecrãs pequenos 'md:hidden') */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 glass-subtle border-b border-white/5">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 text-lg">
                OptaFund
            </span>
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/10"
            >
                <IconMenu />
            </button>
        </div>

        {/* Conteúdo da Página (Scrollável) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
             {/* Adicionei 'max-w-7xl mx-auto' para centrar em ecrãs muito largos */}
            <div className="min-h-full w-full"> 
                <Outlet />
            </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;