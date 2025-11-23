// Ficheiro: src/components/Sidebar.tsx

import React, { ReactNode } from 'react'; // << 1. IMPORTAR ReactNode
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Ícones (placeholders)
const IconDashboard = () => <span>🏠</span>;
const IconTrading = () => <span>📈</span>;
const IconAdmin = () => <span>⚙️</span>; // << 2. NOVO ÍCONE ADMIN
const IconLogout = () => <span>Logout</span>;

// Componente NavItem (fica igual)
const NavItem: React.FC<{ to: string; label: string; children: ReactNode }> = ({ to, label, children }) => {
  return (
    <NavLink
      to={to}
      end 
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
        ${isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`
      }
    >
      {children}
      {label}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  // << 3. PUXAR O 'userRole' DO CONTEXTO 🔥 >>
  const { logout, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full min-h-screen w-64 flex-col bg-gray-800">
      <div className="flex flex-1 flex-col gap-y-5 overflow-y-auto px-6 py-4">
        
        {/* Logótipo */}
        <div className="flex h-16 shrink-0 items-center text-3xl font-bold text-blue-500">
          OptaFund
        </div>

        {/* Navegação */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                <li>
                  <NavItem to="/" label="Dashboard">
                    <IconDashboard />
                  </NavItem>
                </li>
                <li>
                  <NavItem to="/trading" label="Trading">
                    <IconTrading />
                  </NavItem>
                </li>
                
                {/* << 4. RENDERIZAÇÃO CONDICIONAL DO LINK ADMIN 🔥 >> */}
                {userRole === 'admin' && (
                  <li>
                    <NavItem to="/admin" label="Painel Admin">
                      <IconAdmin />
                    </NavItem>
                  </li>
                )}
                
              </ul>
            </li>

            {/* Item de Logout (no fundo) */}
            <li className="mt-auto">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <IconLogout />
                Terminar Sessão
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};