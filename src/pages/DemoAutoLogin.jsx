import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { CONTAS_DEMO_VERTICAIS, CHAVE_DEMO_VERTICAL_FIXADO } from '../data/demoContas'

/**
 * Link de demonstração de um único nicho — pra mandar pro cliente sem
 * ele ver que existem outros verticais (ao contrário do /login, que
 * lista os 4). Entra sozinho com a conta demo daquele vertical e cai
 * direto no dashboard.
 */
export default function DemoAutoLogin() {
  const { vertical } = useParams()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [erro, setErro] = useState('')

  const conta = CONTAS_DEMO_VERTICAIS.find((v) => v.slug === vertical)

  useEffect(() => {
    if (!conta) return
    localStorage.setItem(CHAVE_DEMO_VERTICAL_FIXADO, conta.slug)
    let cancelado = false
    login(conta.email, conta.senha).then((resultado) => {
      if (cancelado) return
      if (!resultado.ok) {
        setErro(resultado.error)
        return
      }
      navigate(`/${resultado.sessao.userType}/dashboard`, { replace: true })
    })
    return () => {
      cancelado = true
    }
  }, [conta, login, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-blue-600 to-primary-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">ALPHADATA</h1>
          <p className="text-blue-100 mt-1 text-body">Negócios</p>
        </div>

        <div className="bg-surface rounded-card shadow-cardHover p-8 text-center">
          {!conta ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <IconAlertTriangle size={40} className="text-danger" />
              <p className="text-h2 text-[#1a1a1a]">Link inválido</p>
              <p className="text-body text-[#666]">Esse link de demonstração não existe ou não é mais válido.</p>
              <button onClick={() => navigate('/login')} className="mt-2 text-primary hover:underline text-body font-medium">
                Ir para o login
              </button>
            </div>
          ) : erro ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <IconAlertTriangle size={40} className="text-danger" />
              <p className="text-h2 text-[#1a1a1a]">Não foi possível entrar</p>
              <p className="text-body text-[#666]">{erro}</p>
              <button onClick={() => navigate('/login')} className="mt-2 text-primary hover:underline text-body font-medium">
                Ir para o login
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-body text-[#666]">Entrando na demonstração de {conta.label}...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
