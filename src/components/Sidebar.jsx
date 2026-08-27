import { useEffect, useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import {
  IconChartBar, IconListCheck, IconUsers, IconUserBolt, IconFileTypePdf, IconSettings,
  IconHistory, IconUser, IconHome, IconCalendarPlus, IconList, IconX, IconApps,
  IconCalendarEvent, IconCategory, IconClipboardList, IconBook2, IconPackage,
  IconConfetti, IconUsersGroup, IconCamera, IconVideo, IconPhoto, IconContract,
} from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import BrandMark from './BrandMark'

const MENUS = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: IconChartBar },
    { to: '/admin/ordens', label: 'Ordens de Serviço', icon: IconListCheck },
    { to: '/admin/clientes', label: 'Clientes', icon: IconUsers },
    { to: '/admin/prestadores', label: 'Prestadores', icon: IconUserBolt },
    { to: '/admin/relatorios', label: 'Relatórios', icon: IconFileTypePdf },
    { to: '/admin/configuracoes', label: 'Configurações', icon: IconSettings },
  ],
  tecnico: [
    { to: '/tecnico/dashboard', label: 'Dashboard', icon: IconChartBar },
    { to: '/tecnico/minhas-ordens', label: 'Minhas Ordens', icon: IconListCheck },
    { to: '/tecnico/historico', label: 'Histórico', icon: IconHistory },
    { to: '/tecnico/perfil', label: 'Perfil', icon: IconUser },
  ],
  cliente: [
    { to: '/cliente/dashboard', label: 'Dashboard', icon: IconHome },
    { to: '/cliente/minhas-ordens', label: 'Minhas Ordens', icon: IconList },
    { to: '/cliente/agendar', label: 'Agendar', icon: IconCalendarPlus },
    { to: '/cliente/perfil', label: 'Perfil', icon: IconUser },
  ],
}

// A conta demo de manutenção mantém o menu acima, com telas de verdade
// pra cada item (é o vertical mais completo hoje, com checklist/fotos/
// assinatura). Pros outros 3 verticais (confeitaria, salão de festas,
// fotografia), o menu vem de verdade da API de config, e agora todo
// item tem uma tela real (mockada) — "Agendamentos" e "Catálogo/
// Pacotes" são telas genéricas reaproveitadas entre os 3 (a forma é a
// mesma, só o dataset muda); o resto é específico de cada vertical.
const ROTAS_REAIS_POR_ID = {
  dashboard: '/admin/dashboard',
  clientes: '/admin/clientes',
  agendamentos: '/admin/agendamentos',
  servicos: '/admin/catalogo',
  contratos: '/admin/contratos',
  pedidos: '/admin/confeitaria/pedidos',
  receitas: '/admin/confeitaria/receitas',
  estoque: '/admin/confeitaria/estoque',
  eventos: '/admin/salao-festas/eventos',
  'equipe-equipamentos': '/admin/salao-festas/equipe-equipamentos',
  sessoes: '/admin/fotografia/sessoes',
  'producoes-video': '/admin/fotografia/producoes-video',
  portfolio: '/admin/fotografia/portfolio',
}

// Um ícone por item — antes todos caíam no mesmo IconApps genérico.
const ICONES_POR_ID = {
  dashboard: IconChartBar,
  clientes: IconUsers,
  agendamentos: IconCalendarEvent,
  servicos: IconCategory,
  contratos: IconContract,
  pedidos: IconClipboardList,
  receitas: IconBook2,
  estoque: IconPackage,
  eventos: IconConfetti,
  'equipe-equipamentos': IconUsersGroup,
  sessoes: IconCamera,
  'producoes-video': IconVideo,
  portfolio: IconPhoto,
}
const ICONE_PADRAO = IconApps

// Espelha `nomeMarketing` de server/src/config/planos.config.ts, só pra exibição aqui.
const NOME_MARKETING_PLANO = { startup: 'Starter', profissional: 'Pro', enterprise: 'Enterprise' }

function diasRestantesTrial(trialTerminaEm) {
  if (!trialTerminaEm) return null
  const diff = new Date(trialTerminaEm).getTime() - Date.now()
  if (diff <= 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function Sidebar({ userType, aberta, onClose }) {
  const { user } = useAuth()
  const [menuDinamico, setMenuDinamico] = useState(null)

  const precisaMenuDinamico = userType === 'admin' && user?.tipoNegocio && user.tipoNegocio !== 'manutencao'

  useEffect(() => {
    if (!precisaMenuDinamico) {
      setMenuDinamico(null)
      return
    }
    let cancelado = false
    api
      .get('/config/tipo-negocio')
      .then((config) => {
        if (!cancelado) setMenuDinamico(config.menuItems)
      })
      .catch(() => {
        if (!cancelado) setMenuDinamico(null)
      })
    return () => {
      cancelado = true
    }
  }, [precisaMenuDinamico])

  const itens = menuDinamico
    ? menuDinamico.map((item) => ({
        to: ROTAS_REAIS_POR_ID[item.id] ?? `/admin/em-construcao/${encodeURIComponent(item.label)}`,
        label: item.label,
        icon: ICONES_POR_ID[item.id] ?? ICONE_PADRAO,
      }))
    : (MENUS[userType] ?? [])

  return (
    <>
      {aberta && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      <aside
        className={`bg-muted border-r border-muted-dark w-64 shrink-0 fixed md:sticky top-0 md:top-16 h-screen md:h-[calc(100vh-4rem)] z-40 md:z-0 transition-transform flex flex-col
        ${aberta ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <BrandMark textClassName="text-logo font-bold text-primary" />
          <button onClick={onClose} aria-label="Fechar menu"><IconX size={22} /></button>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {itens.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-btn px-3 py-2.5 text-body font-medium transition-colors ${
                  isActive ? 'bg-primary text-white' : 'text-[#333] hover:bg-primary-light'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>

        {userType === 'admin' && user?.plano && (
          <Link
            to="/admin/configuracoes"
            onClick={onClose}
            className="mt-auto m-3 rounded-card bg-surface border border-muted-dark p-3 text-label hover:border-primary transition-colors"
          >
            <p className="font-semibold text-[#1a1a1a]">Plano {NOME_MARKETING_PLANO[user.plano] ?? user.plano}</p>
            {diasRestantesTrial(user.trialTerminaEm) != null ? (
              <p className="text-primary mt-0.5">{diasRestantesTrial(user.trialTerminaEm)} dias de teste grátis</p>
            ) : (
              <p className="text-[#999] mt-0.5">Gerenciar assinatura</p>
            )}
          </Link>
        )}
      </aside>
    </>
  )
}
