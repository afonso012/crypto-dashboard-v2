// Ficheiro: src/layouts/MainLayout.tsx

import type React from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "../components/Sidebar"

const MainLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
