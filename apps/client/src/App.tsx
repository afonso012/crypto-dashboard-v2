// Ficheiro: apps/client/src/App.tsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage'; 
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import TradingPage from './pages/TradingPage';
import RegisterPage from './pages/RegisterPage';

import AdminRoute from './layouts/AdminRoute';
import AdminPage from './pages/AdminPage';
import { NewsPage } from './pages/NewsPage';
import StrategyLabPage from './pages/StrategyLabPage';
import StrategyDetailsPage from './pages/StrategyDetailsPage';

const ProtectedRoute: React.FC = () => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <MainLayout />; 
};

const LoginRoute: React.FC = () => {
  const { isLoggedIn } = useAuth();
  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
};

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
      <Route path="/register" element={<RegisterRoute />} />
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        
        <Route path="strategies" element={<StrategyLabPage />} />
        <Route path="strategies/:id" element={<StrategyDetailsPage />} />
        {/* Rota de Trading Dinâmica (Requer Símbolo) */}
        <Route path="trading/:symbol" element={<TradingPage />} />
        
        {/* Se alguém tentar ir a /trading direto, manda para o Dashboard */}
        <Route path="trading" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="/admin" element={<AdminRoute />}>
        <Route element={<MainLayout />}>
           <Route index element={<AdminPage />} />
        </Route>
      </Route>
      
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<DashboardPage />} />
        
        {/* NOVA ROTA */}
        <Route path="news" element={<NewsPage />} />
        
        <Route path="trading/:symbol" element={<TradingPage />} />
        <Route path="trading" element={<Navigate to="/" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;