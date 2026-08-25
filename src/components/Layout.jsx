import { useState } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'

const TITULOS = {
  '/admin/dashboard': 'Dashboard ALPHADATA',
  '/admin/ordens': 'Ordens de Serviço ALPHADATA',
  '/admin/clientes': 'Clientes ALPHADATA',
  '/admin/prestadores': 'Prestadores ALPHADATA',
  '/admin/relatorios': 'Relatórios ALPHADATA',
  '/admin/configuracoes': 'Configurações ALPHADATA',
  '/tecnico/dashboard': 'Meu Dashboard ALPHADATA',
  '/tecnico/minhas-ordens': 'Minhas Ordens ALPHADATA',
  '/tecnico/historico': 'Histórico de Ordens ALPHADATA',
  '/tecnico/perfil': 'Meu Perfil ALPHADATA',
  '/cliente/dashboard': 'Bem-vindo à ALPHADATA',
  '/cliente/minhas-ordens': 'Minhas Ordens ALPHADATA',
  '/cliente/agendar': 'Agendar Novo Serviço ALPHADATA',
  '/cliente/perfil': 'Meu Perfil ALPHADATA',
}

function useTituloPagina() {
  const location = useLocation()
  const params = useParams()
  if (location.pathname.startsWith('/tecnico/detalhes/')) {
    return `Ordem de Serviço #${params.id}`
  }
  return TITULOS[location.pathname] ?? 'ALPHADATA'
}

export default function Layout({ userType }) {
  const { user, isAuthenticated } = useAuth()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const titulo = useTituloPagina()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user.userType !== userType) return <Navigate to={`/${user.userType}/dashboard`} replace />

  return (
    <div className="min-h-screen bg-muted">
      <Header titulo={titulo} onToggleSidebar={() => setSidebarAberta(true)} />
      <div className="flex">
        <Sidebar userType={userType} aberta={sidebarAberta} onClose={() => setSidebarAberta(false)} />
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
