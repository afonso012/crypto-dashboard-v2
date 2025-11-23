// Ficheiro: apps/client/src/components/Sidebar.tsx

"use client"

import type React from "react"
import type { ReactNode } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

// --- Ícones (Mantêm-se iguais) ---
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const IconNews = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
  </svg>
)

const IconAdmin = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const IconClose = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
)

// NavItem agora aceita onClick para fechar o menu ao clicar num link
const NavItem: React.FC<{ to: string; label: string; children: ReactNode; onClick?: () => void }> = ({ to, label, children, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
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

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: <IconDashboard />, role: "all" },
  { to: "/news", label: "News", icon: <IconNews />, role: "all" },
  { to: "/admin", label: "Admin Panel", icon: <IconAdmin />, role: "admin" },
];

// PROPS NOVAS: isOpen e onClose
interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { logout, userRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <>
    {/* Overlay Escuro (Só aparece no Mobile quando aberto) */}
    <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
    />

    {/* A Sidebar em si */}
    <div className={`
        fixed md:static inset-y-0 left-0 z-50 
        w-64 h-full flex flex-col glass-strong border-r border-white/10
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      {/* Efeito de borda esquerda */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500/50 via-purple-500/30 to-transparent"></div>

      <div className="flex flex-1 flex-col gap-y-5 overflow-y-auto px-6 py-6">
        
        {/* Header da Sidebar com Botão Fechar para Mobile */}
        <div className="flex h-16 shrink-0 items-center justify-between">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            OptaFund
            </div>
            {/* Botão X só visível em mobile */}
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white">
                <IconClose />
            </button>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-2">
                {NAV_ITEMS.map((item) => {
                  if (item.role !== "all" && item.role !== userRole) return null;

                  return (
                    <li key={item.to}>
                      <NavItem to={item.to} label={item.label} onClick={onClose}>
                        {item.icon}
                      </NavItem>
                    </li>
                  );
                })}
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
    </>
  )
}