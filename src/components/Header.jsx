import { useState } from 'react'
import { IconMenu2, IconUserCircle, IconChevronDown, IconLogout, IconSettings, IconUser } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Header({ titulo, onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="bg-primary text-white sticky top-0 z-30 shadow-card">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1" onClick={onToggleSidebar} aria-label="Abrir menu">
            <IconMenu2 size={24} />
          </button>
          <span className="text-logo font-bold tracking-tight whitespace-nowrap">ALPHADATA</span>
        </div>

        <h1 className="hidden md:block text-body font-semibold absolute left-1/2 -translate-x-1/2">{titulo}</h1>

        <div className="relative">
          <button
            onClick={() => setMenuAberto((v) => !v)}
            className="flex items-center gap-2 rounded-btn px-2 py-1.5 hover:bg-white/10"
          >
            <IconUserCircle size={26} />
            <span className="hidden sm:inline text-body font-medium">{user?.nome}</span>
            <IconChevronDown size={16} />
          </button>
          {menuAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-surface rounded-card shadow-cardHover text-[#333] z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-muted-dark">
                  <p className="text-body font-semibold truncate">{user?.nome}</p>
                  <p className="text-label text-[#999] truncate">{user?.papel}</p>
                </div>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-body hover:bg-primary-light text-left">
                  <IconUser size={18} /> Perfil
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2.5 text-body hover:bg-primary-light text-left">
                  <IconSettings size={18} /> Configurações
                </button>
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
      <h1 className="md:hidden text-center text-label font-semibold pb-2 -mt-1">{titulo}</h1>
    </header>
  )
}
