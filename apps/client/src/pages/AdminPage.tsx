import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SymbolManager } from '../components/admin/SymbolManager'; 
// << 🔥 1. IMPORTAR O NOVO COMPONENTE 🔥 >>
import { UserManager } from '../components/admin/UserManager';
import { SystemStatusWidget } from '../components/admin/SystemStatusWidget';

const AdminPage: React.FC = () => {
  const { userEmail } = useAuth();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Painel de Administração</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h3 className="font-bold text-xl mb-4">Acesso Autorizado</h3>
        <p className="text-gray-300">
          Bem-vindo, <span className="font-bold text-blue-400">{userEmail}</span>.
        </p>
      </div>

      {/* Componente de Gestão de Símbolos (que já tínhamos) */}
      <SymbolManager />
      
      {/* << 🔥 2. ADICIONAR O NOVO COMPONENTE DE UTILIZADORES 🔥 >> */}
      <UserManager />

      <SystemStatusWidget />

    </div>
  );
};

export default AdminPage;