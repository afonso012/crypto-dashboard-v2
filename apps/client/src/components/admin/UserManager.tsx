import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

// A "forma" dos dados do utilizador que vêm da API
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export const UserManager: React.FC = () => {
  const { authFetch } = useApi(); // Hook de fetch autenticado
  const { userEmail } = useAuth(); // Para sabermos quem está logado
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para ir buscar a lista de utilizadores
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authFetch('/api/admin/users');
      const data: User[] = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Corre quando o componente é montado
  useEffect(() => {
    fetchUsers();
  }, []);

  // Função para mudar o role (Admin <-> User)
  const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
    try {
      await authFetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      // Atualiza a lista localmente para refletir a mudança
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao mudar o role');
    }
  };

  // Função para apagar um utilizador
  const handleDeleteUser = async (id: string, email: string) => {
    if (email === userEmail) {
      alert("Não pode apagar a sua própria conta de administrador.");
      return;
    }
    
    if (window.confirm(`Tem a certeza que quer apagar o utilizador ${email}? Esta ação é irreversível.`)) {
      try {
        await authFetch(`/api/admin/users/${id}`, {
          method: 'DELETE',
        });
        // Remove o utilizador da lista local
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao apagar o utilizador');
      }
    }
  };

  if (isLoading) {
    return <div className="text-gray-400 p-6">A carregar utilizadores...</div>;
  }
  if (error) {
    return <div className="text-red-400 p-6">{error}</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg mt-6">
      <h3 className="font-bold text-white text-xl mb-4">Gerir Utilizadores</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Registado em</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map(user => (
              <tr key={user.id}>
                <td className="py-3 px-4 text-sm text-white">{user.email}</td>
                <td className="py-3 px-4 text-sm text-white">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${user.role === 'admin' ? 'bg-green-800 text-green-200' : 'bg-gray-700 text-gray-300'}
                  `}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-4 text-sm space-x-2">
                  {/* Botão para trocar o Role */}
                  {user.email !== userEmail && ( // Não deixa alterar o próprio role
                    user.role === 'user' ? (
                      <button 
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        className="text-green-400 hover:text-green-300"
                        title="Promover a Admin"
                      >
                        Promover
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRoleChange(user.id, 'user')}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Rebaixar a User"
                      >
                        Rebaixar
                      </button>
                    )
                  )}
                  {/* Botão para Apagar */}
                  {user.email !== userEmail && ( // Não deixa apagar-se a si próprio
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-500 hover:text-red-400"
                      title="Apagar Utilizador"
                    >
                      Apagar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};