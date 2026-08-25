import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBriefcase, IconTool, IconUserCircle, IconLogin2 } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { USUARIOS_DEMO } from '../data/mock'

const TIPOS = [
  { valor: 'admin', label: 'Admin', icon: IconBriefcase },
  { valor: 'tecnico', label: 'Técnico', icon: IconTool },
  { valor: 'cliente', label: 'Cliente', icon: IconUserCircle },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [userType, setUserType] = useState('admin')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  function preencherDemo() {
    const demo = USUARIOS_DEMO[userType]
    setEmail(demo.email)
    setSenha(demo.senha)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    const resultado = login(userType, email, senha)
    if (!resultado.ok) {
      setErro(resultado.error)
      return
    }
    navigate(`/${userType}/dashboard`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-blue-600 to-primary-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">ALPHADATA</h1>
          <p className="text-blue-100 mt-1 text-body">Ordens de Serviços</p>
        </div>

        <div className="bg-surface rounded-card shadow-cardHover p-6 sm:p-8">
          <p className="text-h2 text-[#1a1a1a] mb-4">Entrar como...</p>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {TIPOS.map(({ valor, label, icon: Icon }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setUserType(valor)}
                className={`flex flex-col items-center gap-1.5 rounded-card border py-3 text-label font-medium transition-colors ${
                  userType === valor ? 'border-primary bg-primary-light text-primary' : 'border-muted-dark text-[#666] hover:bg-muted'
                }`}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-label text-[#666] block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`ex: ${USUARIOS_DEMO[userType].email}`}
                className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-label text-[#666] block mb-1">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {erro && <p className="text-danger text-label">{erro}</p>}

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold transition-colors"
            >
              <IconLogin2 size={20} />
              Entrar na ALPHADATA
            </button>
          </form>

          <button onClick={preencherDemo} className="w-full text-center text-label text-primary hover:underline mt-4">
            Versão demo com dados fictícios
          </button>
        </div>

        <p className="text-center text-blue-100 text-label mt-6">© 2026 ALPHADATA - Ordens de Serviços</p>
      </div>
    </div>
  )
}
