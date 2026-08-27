import { useState } from 'react'
import { Navigate, Outlet, Link } from 'react-router-dom'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { diasRestantesTrial } from '../utils/trial'
import Header from './Header'
import Sidebar from './Sidebar'

/** Só admin mexe em assinatura (ver requererPapel('admin') nas rotas de /billing) — só ele vê o aviso. */
function AvisoTrialAcabando({ dias }) {
  if (dias == null || dias > 1) return null
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-center gap-2 text-label text-amber-800">
      <IconAlertTriangle size={16} className="shrink-0" />
      <span>
        {dias === 1 ? 'Seu teste grátis termina amanhã.' : 'Seu teste grátis termina hoje.'} Escolha seu plano em{' '}
        <Link to="/admin/configuracoes" className="font-semibold underline">Configurações</Link> pra continuar sem interrupção.
      </span>
    </div>
  )
}

export default function Layout({ userType }) {
  const { user, isAuthenticated } = useAuth()
  const [sidebarAberta, setSidebarAberta] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Conta autenticada mas sem vertical escolhido ainda (ex: fechou a aba no
  // meio do onboarding, ou digitou a URL do dashboard direto) — manda de
  // volta pra tela de "escolher-negocio" em vez de deixar entrar sem isso.
  if (!user.tipoNegocio) return <Navigate to="/login" replace state={{ sessaoPendente: user }} />
  // Teste grátis local (7 dias, sem cartão — ver utils/trial.js) já
  // expirou e a conta não tem assinatura paga ativa: só aí trava o
  // dashboard e pede pra escolher plano + cartão em /checkout.
  if (user.assinaturaPendente) return <Navigate to="/checkout" replace />
  if (user.userType !== userType) return <Navigate to={`/${user.userType}/dashboard`} replace />

  return (
    <div className="min-h-screen bg-muted">
      {userType === 'admin' && <AvisoTrialAcabando dias={diasRestantesTrial(user.trialTerminaEm)} />}
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
