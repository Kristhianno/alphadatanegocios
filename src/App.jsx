import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'

import AdminDashboard from './pages/Admin/Dashboard'
import AdminOrdensServico from './pages/Admin/OrdensServico'
import AdminClientes from './pages/Admin/Clientes'
import AdminPrestadores from './pages/Admin/Prestadores'
import AdminRelatorios from './pages/Admin/Relatorios'
import AdminConfiguracoes from './pages/Admin/Configuracoes'

import TecnicoDashboard from './pages/Tecnico/Dashboard'
import TecnicoMinhasOrdens from './pages/Tecnico/MinhasOrdens'
import TecnicoDetalhes from './pages/Tecnico/Detalhes'
import TecnicoHistorico from './pages/Tecnico/Historico'
import TecnicoPerfil from './pages/Tecnico/Perfil'

import ClienteDashboard from './pages/Cliente/Dashboard'
import ClienteMinhasOrdens from './pages/Cliente/MinhasOrdens'
import ClienteAgendar from './pages/Cliente/Agendar'
import ClientePerfil from './pages/Cliente/Perfil'

function RaizApp() {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) return <Navigate to={`/${user.userType}/dashboard`} replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RaizApp />} />
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={<Layout userType="admin" />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="ordens" element={<AdminOrdensServico />} />
        <Route path="clientes" element={<AdminClientes />} />
        <Route path="prestadores" element={<AdminPrestadores />} />
        <Route path="relatorios" element={<AdminRelatorios />} />
        <Route path="configuracoes" element={<AdminConfiguracoes />} />
      </Route>

      <Route path="/tecnico" element={<Layout userType="tecnico" />}>
        <Route path="dashboard" element={<TecnicoDashboard />} />
        <Route path="minhas-ordens" element={<TecnicoMinhasOrdens />} />
        <Route path="detalhes/:id" element={<TecnicoDetalhes />} />
        <Route path="historico" element={<TecnicoHistorico />} />
        <Route path="perfil" element={<TecnicoPerfil />} />
      </Route>

      <Route path="/cliente" element={<Layout userType="cliente" />}>
        <Route path="dashboard" element={<ClienteDashboard />} />
        <Route path="minhas-ordens" element={<ClienteMinhasOrdens />} />
        <Route path="agendar" element={<ClienteAgendar />} />
        <Route path="perfil" element={<ClientePerfil />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
