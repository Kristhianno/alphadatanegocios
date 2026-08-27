import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { aplicarCorPrimaria, lerCorPrimariaSalva } from './utils/tema'
import Layout from './components/Layout'
import Login from './pages/Login'
import CallbackSupabase from './pages/CallbackSupabase'
import DemoAutoLogin from './pages/DemoAutoLogin'
import CadastroCliente from './pages/CadastroCliente'
import TrocarSenha from './pages/TrocarSenha'
import EmConstrucao from './pages/EmConstrucao'

import AdminDashboard from './pages/Admin/Dashboard'
import AdminDashboardVertical from './pages/Admin/DashboardVertical'
import AdminOrdensServico from './pages/Admin/OrdensServico'
import AdminClientes from './pages/Admin/Clientes'
import AdminPrestadores from './pages/Admin/Prestadores'
import AdminRelatorios from './pages/Admin/Relatorios'
import AdminConfiguracoes from './pages/Admin/Configuracoes'
import AdminPerfil from './pages/Admin/Perfil'
import PedidosConfeitaria from './pages/Admin/PedidosConfeitaria'
import EventosSalao from './pages/Admin/EventosSalao'
import SessoesFotografia from './pages/Admin/SessoesFotografia'
import AgendamentosVertical from './pages/Admin/AgendamentosVertical'
import CatalogoVertical from './pages/Admin/CatalogoVertical'
import ContratosVertical from './pages/Admin/ContratosVertical'
import ReceitasConfeitaria from './pages/Admin/ReceitasConfeitaria'
import EstoqueConfeitaria from './pages/Admin/EstoqueConfeitaria'
import EquipeEquipamentosSalao from './pages/Admin/EquipeEquipamentosSalao'
import ProducoesVideoFotografia from './pages/Admin/ProducoesVideoFotografia'
import PortfolioFotografia from './pages/Admin/PortfolioFotografia'

import TecnicoDashboard from './pages/Tecnico/Dashboard'
import TecnicoMinhasOrdens from './pages/Tecnico/MinhasOrdens'
import TecnicoDetalhes from './pages/Tecnico/Detalhes'
import TecnicoHistorico from './pages/Tecnico/Historico'
import TecnicoPerfil from './pages/Tecnico/Perfil'

import ClienteDashboard from './pages/Cliente/Dashboard'
import ClienteMinhasOrdens from './pages/Cliente/MinhasOrdens'
import ClienteAgendar from './pages/Cliente/Agendar'
import ClientePerfil from './pages/Cliente/Perfil'

/** Manutenção mantém o dashboard mockado rico (gráficos, KPIs de OS); os outros 3 verticais usam o dashboard genérico com dados reais da API. */
function AdminDashboardRoteado() {
  const { user } = useAuth()
  return user?.tipoNegocio && user.tipoNegocio !== 'manutencao' ? <AdminDashboardVertical /> : <AdminDashboard />
}

function RaizApp() {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) {
    if (!user.tipoNegocio) return <Navigate to="/login" replace state={{ sessaoPendente: user }} />
    return <Navigate to={user.deveTrocarSenha ? '/trocar-senha' : `/${user.userType}/dashboard`} replace />
  }
  return <Navigate to="/login" replace />
}

export default function App() {
  const { carregando } = useAuth()

  useEffect(() => {
    const corSalva = lerCorPrimariaSalva()
    if (corSalva) aplicarCorPrimaria(corSalva)
  }, [])

  // Evita um "flash" pro /login antes de terminar de restaurar a sessão
  // (o token já existe no localStorage, mas GET /auth/me ainda não voltou).
  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center bg-muted text-body text-[#666]">Carregando...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<RaizApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Login apenasCadastro />} />
      <Route path="/auth/callback" element={<CallbackSupabase />} />
      <Route path="/demo/:vertical" element={<DemoAutoLogin />} />
      <Route path="/cadastro-cliente/:token" element={<CadastroCliente />} />
      <Route path="/trocar-senha" element={<TrocarSenha />} />

      <Route path="/admin" element={<Layout userType="admin" />}>
        <Route path="dashboard" element={<AdminDashboardRoteado />} />
        <Route path="ordens" element={<AdminOrdensServico />} />
        <Route path="clientes" element={<AdminClientes />} />
        <Route path="prestadores" element={<AdminPrestadores />} />
        <Route path="relatorios" element={<AdminRelatorios />} />
        <Route path="configuracoes" element={<AdminConfiguracoes />} />
        <Route path="perfil" element={<AdminPerfil />} />
        <Route path="agendamentos" element={<AgendamentosVertical />} />
        <Route path="catalogo" element={<CatalogoVertical />} />
        <Route path="contratos" element={<ContratosVertical />} />
        <Route path="confeitaria/pedidos" element={<PedidosConfeitaria />} />
        <Route path="confeitaria/receitas" element={<ReceitasConfeitaria />} />
        <Route path="confeitaria/estoque" element={<EstoqueConfeitaria />} />
        <Route path="salao-festas/eventos" element={<EventosSalao />} />
        <Route path="salao-festas/equipe-equipamentos" element={<EquipeEquipamentosSalao />} />
        <Route path="fotografia/sessoes" element={<SessoesFotografia />} />
        <Route path="fotografia/producoes-video" element={<ProducoesVideoFotografia />} />
        <Route path="fotografia/portfolio" element={<PortfolioFotografia />} />
        <Route path="em-construcao/:modulo" element={<EmConstrucao />} />
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
