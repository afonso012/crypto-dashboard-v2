import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado que fornece uma função 'fetch' autenticada.
 * Ele automaticamente anexa o Token JWT a cada pedido.
 */
export const useApi = () => {
  const { token, logout } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // 1. Prepara os cabeçalhos
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Garante que estamos a enviar JSON se houver um 'body'
    if (options.body) {
      headers.set('Content-Type', 'application/json');
    }

    // 2. Faz o pedido 'fetch' com os cabeçalhos atualizados
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // 3. Gestão de erros
    if (response.status === 401) {
      // Se a API nos rejeitar (Token inválido ou expirado),
      // faz logout automático do utilizador.
      logout();
      throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    if (!response.ok) {
      // Tenta ler a mensagem de erro da API
      const errorData = await response.json();
      throw new Error(errorData.message || `Erro na API: ${response.statusText}`);
    }

    return response;
  };

  return { authFetch };
};