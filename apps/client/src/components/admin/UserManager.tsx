"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useApi } from "../../hooks/useApi"
import { useAuth } from "../../contexts/AuthContext"

// A "forma" dos dados do utilizador que vêm da API
interface User {
  id: string
  email: string
  role: "admin" | "user"
  createdAt: string
}

export const UserManager: React.FC = () => {
  const { authFetch } = useApi() // Hook de fetch autenticado
  const { userEmail } = useAuth() // Para sabermos quem está logado
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para ir buscar a lista de utilizadores
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await authFetch("/api/admin/users")
      const data: User[] = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  // Corre quando o componente é montado
  useEffect(() => {
    fetchUsers()
  }, [])

  // Função para mudar o role (Admin <-> User)
  const handleRoleChange = async (id: string, newRole: "admin" | "user") => {
    try {
      await authFetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      })
      // Atualiza a lista localmente para refletir a mudança
      setUsers(users.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao mudar o role")
    }
  }

  // Função para apagar um utilizador
  const handleDeleteUser = async (id: string, email: string) => {
    if (email === userEmail) {
      alert("Não pode apagar a sua própria conta de administrador.")
      return
    }

    if (window.confirm(`Tem a certeza que quer apagar o utilizador ${email}? Esta ação é irreversível.`)) {
      try {
        await authFetch(`/api/admin/users/${id}`, {
          method: "DELETE",
        })
        // Remove o utilizador da lista local
        setUsers(users.filter((u) => u.id !== id))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao apagar o utilizador")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-white/10 rounded"></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 p-6 rounded-2xl text-red-300">
        {error}
      </div>
    )
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
      <h3 className="font-bold text-white text-xl mb-6 flex items-center gap-3">
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        Gerir Utilizadores
      </h3>
      <div className="overflow-x-auto backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                Registado em
              </th>
              <th className="py-4 px-6 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 text-sm text-white font-medium">{user.email}</td>
                <td className="py-4 px-6 text-sm text-white">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm border
                    ${user.role === "admin" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                  `}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="py-4 px-6 text-sm space-x-3">
                  {user.email !== userEmail &&
                    (user.role === "user" ? (
                      <button
                        onClick={() => handleRoleChange(user.id, "admin")}
                        className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                        title="Promover a Admin"
                      >
                        Promover
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRoleChange(user.id, "user")}
                        className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                        title="Rebaixar a User"
                      >
                        Rebaixar
                      </button>
                    ))}
                  {user.email !== userEmail && (
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-400 hover:text-red-300 font-medium transition-colors"
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
  )
}
