import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout({ userType }) {
  const { user, isAuthenticated } = useAuth()
  const [sidebarAberta, setSidebarAberta] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Conta autenticada mas sem vertical escolhido ainda (ex: fechou a aba no
  // meio do onboarding, ou digitou a URL do dashboard direto) — manda de
  // volta pra tela de "escolher-negocio" em vez de deixar entrar sem isso.
  if (!user.tipoNegocio) return <Navigate to="/login" replace state={{ sessaoPendente: user }} />
  if (user.userType !== userType) return <Navigate to={`/${user.userType}/dashboard`} replace />

  return (
    <div className="min-h-screen bg-muted">
      <Header onToggleSidebar={() => setSidebarAberta(true)} />
      <div className="flex">
        <Sidebar userType={userType} aberta={sidebarAberta} onClose={() => setSidebarAberta(false)} />
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
