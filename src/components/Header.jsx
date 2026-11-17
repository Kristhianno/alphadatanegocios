import { useState } from 'react'
import { IconMenu2, IconUserCircle, IconChevronDown, IconLogout, IconSettings, IconUser } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import NomeMarca from './NomeMarca'
import BotaoInstalarApp from './BotaoInstalarApp'
import { useBranding } from '../hooks/useBranding'

const normalizar = (texto) => (texto ?? '').trim().toLowerCase()
const ROTULO_PAPEL = { admin: 'Administrador', gestor: 'Gestor', tecnico: 'Equipe', cliente: 'Cliente' }

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const { logoUrl, logotipoUrl } = useBranding()
  // Login com o nome da própria empresa (o caso do dono): mostra a marca em vez do texto.
  // Funcionário com nome próprio continua vendo o nome dele.
  const loginDaEmpresa = normalizar(user?.nome) === normalizar(user?.nomeEmpresa)
  const avatar = loginDaEmpresa && logoUrl
  const logotipo = loginDaEmpresa && logotipoUrl
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function irPara(rota) {
    setMenuAberto(false)
    navigate(rota)
  }

  return (
    <header className="bg-primary text-white sticky top-0 z-30 shadow-card">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-16">
        <div className="flex min-w-0 items-center gap-3">
          <button className="md:hidden p-1" onClick={onToggleSidebar} aria-label="Abrir menu">
            <IconMenu2 size={24} />
          </button>
          {/* Só o logotipo (ou o nome); o símbolo fica no botão da conta, à direita. Troca/edição pelo Dashboard e Perfil. */}
          <NomeMarca variante="claro" altura={40} larguraMaxima={260} editavel={false} textClassName="text-logo font-bold tracking-tight whitespace-nowrap" />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <BotaoInstalarApp
          className="flex items-center gap-1.5 rounded-btn px-2 py-1.5 text-label font-medium hover:bg-white/10"
          classeTexto="hidden sm:inline"
        />
        <div className="relative">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex items-center gap-2 rounded-btn px-2 py-1.5 hover:bg-white/10"
          >
            {avatar ? (
              <img src={logoUrl} alt={user?.nome} className="h-9 w-9 rounded-full bg-white object-contain p-0.5" />
            ) : (
              <IconUserCircle size={26} />
            )}
            {/* Com o símbolo da empresa, ele basta (o logotipo já está à esquerda). */}
            {!avatar && <span className="hidden sm:inline text-body font-medium">{user?.nome}</span>}
            <IconChevronDown size={16} />
          </button>
          {menuAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-surface rounded-card shadow-cardHover text-[#333] z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-muted-dark">
                  {logotipo ? (
                    <img src={logotipoUrl} alt={user?.nome} className="block h-8 w-auto max-w-full object-contain" />
                  ) : (
                    <p className="text-body font-semibold truncate">{user?.nome}</p>
                  )}
                  <p className="mt-0.5 text-label text-[#999] truncate">{ROTULO_PAPEL[user?.papel] ?? user?.papel}</p>
                </div>
                <button onClick={() => irPara(`/${user?.userType}/perfil`)} className="w-full flex items-center gap-2 px-4 py-2.5 text-body hover:bg-primary-light text-left">
                  <IconUser size={18} /> Perfil
                </button>
                {user?.userType === 'admin' && (
                  <button onClick={() => irPara('/admin/configuracoes')} className="w-full flex items-center gap-2 px-4 py-2.5 text-body hover:bg-primary-light text-left">
                    <IconSettings size={18} /> Configurações
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-body hover:bg-red-50 text-danger text-left border-t border-muted-dark"
                >
                  <IconLogout size={18} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </header>
  )
}
