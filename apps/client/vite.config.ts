// Ficheiro: apps/client/vite.config.ts (CORRIGIDO)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Configuração do Vite para o projeto 'client'.
 */
export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    exclude: ['lightweight-charts'],
  },
  
  server: {
    proxy: {
      /**
       * Regra para pedidos de API REST
       */
      '/api': {
        target: 'http://localhost:8081', 
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), 
      },
      
      /**
       * Regra para conexões WebSocket.
       */
      '/ws': {
        target: 'ws://localhost:8081', 
        ws: true,
        changeOrigin: true,
        // << 🔥 A CORREÇÃO ESTÁ AQUI 🔥 >>
        // Reescreve /ws -> / (para o servidor NestJS/WS na raiz)
        rewrite: (path) => path.replace(/^\/ws/, ''),
      }
    }
  }
});