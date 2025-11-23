// Ficheiro: apps/client/src/App.tsx (MODIFICADO)

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage'; 
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TradingPage from './pages/TradingPage';
// << 🔥 1. IMPORTAR A NOVA PÁGINA DE REGISTO 🔥 >>
import RegisterPage from './pages/RegisterPage';

import AdminRoute from './layouts/AdminRoute';
import AdminPage from './pages/AdminPage';


// Componente ProtectedRoute (sem alterações)
const ProtectedRoute: React.FC = () => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />; 
};

// Componente LoginRoute (sem alterações)
const LoginRoute: React.FC = () => {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
};

// << 🔥 2. NOVO "SEGURANÇA" PARA A ROTA DE REGISTO 🔥 >>
const RegisterRoute: React.FC = () => {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <RegisterPage />;
};


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      {/* << 🔥 3. ADICIONAR A NOVA ROTA 🔥 >> */}
      <Route path="/register" element={<RegisterRoute />} />
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="trading" element={<TradingPage />} />
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        {/* Como o AdminRoute não tem <MainLayout>,
            precisamos de o adicionar aqui se quisermos a sidebar */}
        <Route element={<MainLayout />}>
           <Route index element={<AdminPage />} />
           {/* (Aqui podes adicionar mais rotas admin, ex: /admin/users) */}
        </Route>
      </Route>
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;