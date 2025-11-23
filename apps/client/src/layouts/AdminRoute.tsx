// Ficheiro: apps/client/src/layouts/AdminRoute.tsx (FICHEIRO NOVO)

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute: React.FC = () => {
  const { isLoggedIn, userRole } = useAuth();

  // 1. Está logado?
  if (!isLoggedIn) {
    // Se não estiver, vai para o login
    return <Navigate to="/login" replace />;
  }

  // 2. Está logado, MAS é admin?
  if (userRole !== 'admin') {
    // Se for um 'user' normal, vai para o dashboard (não pode aceder)
    return <Navigate to="/" replace />;
  }

  // 3. Se está logado E é admin, mostra a página
  // O <Outlet /> vai renderizar a página que definirmos no App.tsx
  return <Outlet />;
};

export default AdminRoute;