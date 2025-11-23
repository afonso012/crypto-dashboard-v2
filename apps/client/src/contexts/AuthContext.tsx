import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  userRole: 'user' | 'admin' | null;
  token: string | null;
  logout: () => void;
  // A função agora aceita explicitamente o tipo
  sendOtp: (email: string, type?: 'login' | 'register') => Promise<void>;
  verifyOtp: (email: string, code: string, extraData?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('optafund_token'));
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) logout();
        else {
          setUserEmail(decoded.email);
          setUserRole(decoded.role);
          localStorage.setItem('optafund_token', token);
        }
      } catch { logout(); }
    } else {
      setUserEmail(null); setUserRole(null); localStorage.removeItem('optafund_token');
    }
  }, [token]);

  const logout = () => setToken(null);

  // --- CORREÇÃO AQUI ---
  const sendOtp = async (email: string, type: 'login' | 'register' = 'login') => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Agora enviamos o 'type' corretamente no JSON
      body: JSON.stringify({ email, type }),
    });

    if (!res.ok) {
      const data = await res.json();
      // Lança o erro exato que vem do servidor (ex: "Utilizador não encontrado")
      throw new Error(data.message || 'Erro ao enviar código.');
    }
  };

  const verifyOtp = async (email: string, code: string, extraData: any = {}) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, ...extraData }),
    });
    
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Código inválido.');
    }
    
    const data = await res.json();
    setToken(data.access_token);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn: !!token, userEmail, userRole, token, logout, sendOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};