import { NavLink } from 'react-router-dom'
import {
  IconChartBar, IconListCheck, IconUsers, IconUserBolt, IconFileTypePdf, IconSettings,
  IconHistory, IconUser, IconHome, IconCalendarPlus, IconList, IconX,
} from '@tabler/icons-react'

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

export default function Sidebar({ userType, aberta, onClose }) {
  const itens = MENUS[userType] ?? []

  return (
    <>
      {aberta && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />}
      <aside
        className={`bg-muted border-r border-muted-dark w-64 shrink-0 fixed md:sticky top-0 md:top-16 h-screen md:h-[calc(100vh-4rem)] z-40 md:z-0 transition-transform
        ${aberta ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="text-logo font-bold text-primary">ALPHADATA</span>
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
      </aside>
    </>
  )
}
