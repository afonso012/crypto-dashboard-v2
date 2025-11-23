// Ficheiro: src/main.tsx (MODIFICADO)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// << 🔥 1. IMPORTAR OS NOSSOS NOVOS ITENS 🔥 >>
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* << 🔥 2. ENVOLVER A APP COM OS PROVIDERS 🔥 >> */}
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)