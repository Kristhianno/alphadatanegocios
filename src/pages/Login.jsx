import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconLogin2, IconUserPlus, IconArrowLeft } from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'

// Cada tipo de negócio tem sua própria conta demo (dados reais no
// banco, semeados por server/scripts/seed-*.ts) — a de manutenção é a
// única com histórico rico de Ordens de Serviço (checklist/fotos/
// assinatura, ainda mockado no frontend); as outras 3 mostram um
// dashboard e cadastro de clientes reais, com o menu lateral já
// refletindo os módulos daquele vertical (ver Sidebar.jsx).
const VERTICAIS_DEMO = [
  { label: 'Manutenção', icone: '🔧', email: 'admin@alphadata.com', senha: 'admin123' },
  { label: 'Confeitaria', icone: '🧁', email: 'confeitaria@alphadata.com', senha: 'admin123' },
  { label: 'Salão de Festas', icone: '🎉', email: 'salaodefestas@alphadata.com', senha: 'admin123' },
  { label: 'Fotografia', icone: '📷', email: 'fotografia@alphadata.com', senha: 'admin123' },
]

const OUTROS_PAPEIS_DEMO = [
  { label: 'Técnico', email: 'tecnico@alphadata.com', senha: 'tecnico123' },
  { label: 'Cliente', email: 'cliente@alphadata.com', senha: 'cliente123' },
]

export default function Login() {
  const { login, registrar, selecionarTipoNegocio } = useAuth()
  const navigate = useNavigate()

  // 'entrar' | 'criar-conta' | 'escolher-negocio'
  const [modo, setModo] = useState('entrar')

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [sessaoPendente, setSessaoPendente] = useState(null)
  const [tiposNegocio, setTiposNegocio] = useState([])
  const [tipoEscolhido, setTipoEscolhido] = useState(null)

  useEffect(() => {
    if (modo === 'escolher-negocio' && tiposNegocio.length === 0) {
      api
        .get('/config/tipos-negocio-disponiveis', { comAuth: false })
        .then(setTiposNegocio)
        .catch(() => setErro('Não foi possível carregar os tipos de negócio.'))
    }
  }, [modo, tiposNegocio.length])

  function irParaDashboard(sessao) {
    navigate(sessao.deveTrocarSenha ? '/trocar-senha' : `/${sessao.userType}/dashboard`, { replace: true })
  }

  async function handleEntrar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    const resultado = await login(email, senha)
    setEnviando(false)
    if (!resultado.ok) {
      setErro(resultado.error)
      return
    }
    if (resultado.precisaEscolherNegocio) {
      setSessaoPendente(resultado.sessao)
      setModo('escolher-negocio')
      return
    }
    irParaDashboard(resultado.sessao)
  }

  async function handleCriarConta(e) {
    e.preventDefault()
    setErro('')
    if (senha.length < 8) {
      setErro('A senha precisa de ao menos 8 caracteres.')
      return
    }
    setEnviando(true)
    const resultado = await registrar(email, senha, nomeEmpresa)
    setEnviando(false)
    if (!resultado.ok) {
      setErro(resultado.error)
      return
    }
    setSessaoPendente(resultado.sessao)
    setModo('escolher-negocio')
  }

  async function handleEscolherNegocio(tipo) {
    setErro('')
    setTipoEscolhido(tipo)
    const resultado = await selecionarTipoNegocio(tipo)
    if (!resultado.ok) {
      setErro(resultado.error)
      setTipoEscolhido(null)
      return
    }
    irParaDashboard(sessaoPendente)
  }

  function preencherDemo(cred) {
    setEmail(cred.email)
    setSenha(cred.senha)
    setErro('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-blue-600 to-primary-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight">ALPHADATA</h1>
          <p className="text-blue-100 mt-1 text-body">Ordens de Serviços</p>
        </div>

        <div className="bg-surface rounded-card shadow-cardHover p-6 sm:p-8">
          {modo === 'escolher-negocio' ? (
            <>
              <p className="text-h2 text-[#1a1a1a] mb-1">Qual é o seu tipo de negócio?</p>
              <p className="text-body text-[#666] mb-5">Isso define o menu e os módulos que você vai usar. Só pode ser escolhido uma vez.</p>

              <div className="grid grid-cols-1 gap-2">
                {tiposNegocio.map((t) => (
                  <button
                    key={t.tipo}
                    type="button"
                    disabled={!!tipoEscolhido}
                    onClick={() => handleEscolherNegocio(t.tipo)}
                    className="flex items-center gap-3 rounded-card border border-muted-dark px-4 py-3 text-left hover:border-primary hover:bg-primary-light transition-colors disabled:opacity-60"
                  >
                    <span className="text-2xl leading-none">{t.icone}</span>
                    <span className="text-body font-medium text-[#1a1a1a]">{tipoEscolhido === t.tipo ? 'Configurando...' : t.nome}</span>
                  </button>
                ))}
                {tiposNegocio.length === 0 && !erro && <p className="text-body text-[#999] text-center py-4">Carregando opções...</p>}
              </div>

              {erro && <p className="text-danger text-label mt-3">{erro}</p>}
            </>
          ) : (
            <>
              <div className="flex rounded-btn bg-muted p-1 mb-6">
                <button
                  onClick={() => { setModo('entrar'); setErro('') }}
                  className={`flex-1 rounded-btn py-2 text-body font-medium transition-colors ${modo === 'entrar' ? 'bg-surface shadow-card text-primary' : 'text-[#666]'}`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setModo('criar-conta'); setErro('') }}
                  className={`flex-1 rounded-btn py-2 text-body font-medium transition-colors ${modo === 'criar-conta' ? 'bg-surface shadow-card text-primary' : 'text-[#666]'}`}
                >
                  Criar conta
                </button>
              </div>

              {modo === 'entrar' ? (
                <form onSubmit={handleEntrar} className="flex flex-col gap-4">
                  <div>
                    <label className="text-label text-[#666] block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
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
                    disabled={enviando}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold transition-colors disabled:opacity-60"
                  >
                    <IconLogin2 size={20} />
                    {enviando ? 'Entrando...' : 'Entrar na ALPHADATA'}
                  </button>

                  <div className="pt-3 border-t border-muted-dark">
                    <p className="text-label text-[#999] text-center mb-2">Testar um tipo de negócio (dados reais)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {VERTICAIS_DEMO.map((v) => (
                        <button
                          key={v.email}
                          type="button"
                          onClick={() => preencherDemo(v)}
                          className="flex items-center justify-center gap-1.5 rounded-btn border border-muted-dark py-2 text-label text-[#333] hover:bg-primary-light hover:border-primary"
                        >
                          <span className="text-base leading-none">{v.icone}</span>
                          {v.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-label text-[#999] text-center mt-3 mb-2">Outros papéis (conta de manutenção)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {OUTROS_PAPEIS_DEMO.map((cred) => (
                        <button
                          key={cred.email}
                          type="button"
                          onClick={() => preencherDemo(cred)}
                          className="rounded-btn border border-muted-dark py-1.5 text-label text-primary hover:bg-primary-light"
                        >
                          {cred.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCriarConta} className="flex flex-col gap-4">
                  <div>
                    <label className="text-label text-[#666] block mb-1">Nome da empresa</label>
                    <input
                      required
                      value={nomeEmpresa}
                      onChange={(e) => setNomeEmpresa(e.target.value)}
                      placeholder="Ex: Manutenções Silva"
                      className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-label text-[#666] block mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-label text-[#666] block mb-1">Senha</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Ao menos 8 caracteres"
                      className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {erro && <p className="text-danger text-label">{erro}</p>}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold transition-colors disabled:opacity-60"
                  >
                    <IconUserPlus size={20} />
                    {enviando ? 'Criando conta...' : 'Criar minha conta'}
                  </button>
                </form>
              )}
            </>
          )}

          {modo === 'escolher-negocio' && sessaoPendente && (
            <button
              onClick={() => { setModo('entrar'); setSessaoPendente(null) }}
              className="flex items-center gap-1.5 text-label text-primary hover:underline mt-4"
            >
              <IconArrowLeft size={14} /> Voltar
            </button>
          )}
        </div>

        <p className="text-center text-blue-100 text-label mt-6">© 2026 ALPHADATA - Ordens de Serviços</p>
      </div>
    </div>
  )
}
