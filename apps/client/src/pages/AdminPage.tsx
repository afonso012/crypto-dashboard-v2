"use client"

import type React from "react"
import { useAuth } from "../contexts/AuthContext"
import { SymbolManager } from "../components/admin/SymbolManager"
import { UserManager } from "../components/admin/UserManager"
import { SystemStatusWidget } from "../components/admin/SystemStatusWidget"

const AdminPage: React.FC = () => {
  const { userEmail } = useAuth()

  return (
    <div className="min-h-screen p-6 relative">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
          Painel de Administração
        </h1>

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h3 className="font-bold text-xl mb-2 text-white">Acesso Autorizado</h3>
          <p className="text-gray-300">
            Bem-vindo,{" "}
            <span className="font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              {userEmail}
            </span>
            .
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        <SystemStatusWidget />
        <SymbolManager />
        <UserManager />
      </div>
    </div>
  )
}

export default AdminPage
