"use client"

// Ficheiro: src/components/Sidebar.tsx

import type React from "react"
import type { ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
)

const IconTrading = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
)

const IconAdmin = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
)

const NavItem: React.FC<{ to: string; label: string; children: ReactNode }> = ({ to, label, children }) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
        ${
          isActive
            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10"
            : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
        }`
      }
    >
      {children}
      {label}
    </NavLink>
  )
}

export const Sidebar: React.FC = () => {
  const { logout, userRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex h-full min-h-screen w-64 flex-col glass-strong relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500/50 via-purple-500/30 to-transparent"></div>

      <div className="flex flex-1 flex-col gap-y-5 overflow-y-auto px-6 py-6">
        <div className="flex h-16 shrink-0 items-center text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          OptaFund
        </div>

        {/* Navegação */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-2">
                <li>
                  <NavItem to="/" label="Dashboard">
                    <IconDashboard />
                  </NavItem>
                </li>
                <li>
                  <NavItem to="/trading" label="Trading">
                    <IconTrading />
                  </NavItem>
                </li>

                {userRole === "admin" && (
                  <li>
                    <NavItem to="/admin" label="Painel Admin">
                      <IconAdmin />
                    </NavItem>
                  </li>
                )}
              </ul>
            </li>

            <li className="mt-auto">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all duration-200"
              >
                <IconLogout />
                Terminar Sessão
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
