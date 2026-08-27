import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  IconLogin2,
  IconUserPlus,
  IconArrowLeft,
  IconMail,
  IconLock,
  IconBuildingStore,
} from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { TAMANHO_MAX_LOGO_BYTES } from '../hooks/useBranding'
import { api } from '../services/api'
import { supabase } from '../services/supabase'
import PasswordInput from '../components/ui/PasswordInput'
import AlphaDataLogo from '../components/AlphaDataLogo'
import fundoLogin from '../assets/login-fundo.jpeg'
import foto1 from '../assets/login-foto-1.jpeg'
import foto2 from '../assets/login-foto-2.jpeg'
import foto3 from '../assets/login-foto-3.jpeg'

// Nomes de marketing dos planos (landing/checkout) — espelha `nomeMarketing`
// de server/src/config/planos.config.ts, só pra exibição aqui no cadastro.
const NOME_MARKETING_PLANO = { startup: 'Starter', profissional: 'Pro' }

const inputComIconeClasse = 'w-full rounded-input border border-muted-dark pl-10 pr-3 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const iconeCampoClasse = 'absolute left-3 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none'

function IconGoogle(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.4 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C39.9 37.9 44 32 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  )
}

// Login/cadastro "de verdade" — sem nenhuma referência a conta de
// demonstração (nem o seletor de vertical, nem "outros papéis"). Pra
// mostrar/testar um nicho específico sem senha, use /demo/:slug (ver
// DemoAutoLogin.jsx e data/demoContas.js) — aquele link é só pra quem
// já tem o link em mãos, nunca aparece aqui.
// Rota /cadastro usa apenasCadastro=true: link "limpo" pra mandar pra
// gente de fora — só o formulário de criar conta, sem aba "Entrar".
export default function Login({ apenasCadastro = false }) {
  const { login, registrar, selecionarTipoNegocio, atualizarBranding } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  // Volta do /auth/callback (login com Google) pra uma conta nova, que
  // ainda precisa escolher o vertical — mesma tela de "escolher-negocio"
  // que um cadastro normal usa, só que chegando aqui já autenticada.
  const sessaoPendenteInicial = location.state?.sessaoPendente ?? null

  // Vindo do CTA de um plano na landing (ver Landing.jsx) — carrega o
  // plano/ciclo escolhido pro cadastro, que segue pro checkout do
  // Stripe assim que o onboarding (escolher-negocio/escolher-logo)
  // terminar (ver irParaDashboard abaixo).
  const planoEscolhido = location.state?.plano ?? null
  const cicloEscolhido = location.state?.ciclo ?? null

  // 'entrar' | 'criar-conta' | 'escolher-negocio' | 'escolher-logo'
  const [modo, setModo] = useState(sessaoPendenteInicial ? 'escolher-negocio' : apenasCadastro ? 'criar-conta' : 'entrar')

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [sessaoPendente, setSessaoPendente] = useState(sessaoPendenteInicial)
  const [tiposNegocio, setTiposNegocio] = useState([])
  const [tipoEscolhido, setTipoEscolhido] = useState(null)
  const [mostrarCampoOutro, setMostrarCampoOutro] = useState(false)
  const [descricaoOutro, setDescricaoOutro] = useState('')

  const [logoPreview, setLogoPreview] = useState(null)
  const [salvandoLogo, setSalvandoLogo] = useState(false)

  useEffect(() => {
    if (modo === 'escolher-negocio' && tiposNegocio.length === 0) {
      api
        .get('/config/tipos-negocio-disponiveis', { comAuth: false })
        .then(setTiposNegocio)
        .catch(() => setErro('Não foi possível carregar os tipos de negócio.'))
    }
  }, [modo, tiposNegocio.length])

  function irParaDashboard(sessao) {
    if (sessao.assinaturaPendente) {
      navigate('/checkout', { replace: true })
      return
    }
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
    const resultado = await registrar(email, senha, nomeEmpresa, planoEscolhido ?? undefined, cicloEscolhido ?? undefined)
    setEnviando(false)
    if (!resultado.ok) {
      setErro(resultado.error)
      return
    }
    setSessaoPendente(resultado.sessao)
    setModo('escolher-negocio')
  }

  // `segmentoId` identifica o card na UI (pode haver mais de um card pro
  // mesmo tipoNegocio técnico, ex: "Saúde & Bem-Estar" e "Espaços & Locação"
  // caem ambos em salao_festas) — por isso não dá pra usar tipoNegocio
  // como chave de qual botão está "Configurando...".
  async function handleEscolherNegocio(segmentoId, tipoNegocio, descricaoPersonalizada, segmentoNome) {
    setErro('')
    setTipoEscolhido(segmentoId)
    const resultado = await selecionarTipoNegocio(tipoNegocio, descricaoPersonalizada, segmentoNome)
    if (!resultado.ok) {
      setErro(resultado.error)
      setTipoEscolhido(null)
      return
    }
    setModo('escolher-logo')
  }

  function handleClickTipo(t) {
    if (t.tipoNegocio === 'outro') {
      setErro('')
      setMostrarCampoOutro(true)
      return
    }
    handleEscolherNegocio(t.id, t.tipoNegocio, undefined, t.nome)
  }

  function confirmarOutro(e) {
    e.preventDefault()
    if (!descricaoOutro.trim()) return
    handleEscolherNegocio('outro', 'outro', descricaoOutro.trim(), descricaoOutro.trim())
  }

  function selecionarLogo(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    if (!arquivo.type.startsWith('image/')) {
      setErro('Escolha um arquivo de imagem.')
      return
    }
    if (arquivo.size > TAMANHO_MAX_LOGO_BYTES) {
      setErro('Imagem muito grande. Escolha um arquivo de até 300KB.')
      return
    }
    setErro('')
    const leitor = new FileReader()
    leitor.onload = () => setLogoPreview(leitor.result)
    leitor.readAsDataURL(arquivo)
  }

  async function confirmarLogo() {
    if (!logoPreview) {
      irParaDashboard(sessaoPendente)
      return
    }
    setSalvandoLogo(true)
    const resultado = await atualizarBranding({ logoUrl: logoPreview })
    setSalvandoLogo(false)
    if (!resultado.ok) {
      setErro(resultado.error)
      return
    }
    irParaDashboard(sessaoPendente)
  }

  async function handleGoogleEntrar() {
    if (!supabase) {
      showToast('Login com Google não está configurado neste ambiente.', 'erro')
      return
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) showToast('Não foi possível iniciar o login com Google. Tente novamente.', 'erro')
  }

  return (
    <div
      className="min-h-screen relative bg-cover bg-center"
      style={{ backgroundImage: `url(${fundoLogin})` }}
    >
      <Link
        to="/"
        aria-label="Voltar para a página inicial"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center justify-center h-10 w-10 rounded-full bg-surface/90 backdrop-blur-sm shadow-card text-[#333] hover:bg-surface transition-colors"
      >
        <IconArrowLeft size={20} />
      </Link>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-10 2xl:px-16 py-10 md:pr-[38%] lg:pr-[34%]">
        {/* Cartão de login/cadastro */}
        <div className="w-full max-w-2xl bg-surface/95 backdrop-blur-sm rounded-card shadow-cardHover p-6 sm:p-10">
        <div className="flex justify-center mb-6">
          <AlphaDataLogo />
        </div>

          {modo === 'escolher-negocio' ? (
            <>
              <p className="text-h2 text-[#1a1a1a] mb-1">Qual é o seu tipo de negócio?</p>
              <p className="text-body text-[#666] mb-5">Isso define o menu e os módulos que você vai usar. Só pode ser escolhido uma vez.</p>

              {!mostrarCampoOutro ? (
                <div className="grid grid-cols-1 gap-2">
                  {tiposNegocio.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={!!tipoEscolhido}
                      onClick={() => handleClickTipo(t)}
                      className="flex flex-col items-start gap-0.5 rounded-card border border-muted-dark px-4 py-3 text-left hover:border-primary hover:bg-primary-light transition-colors disabled:opacity-60"
                    >
                      <span className="text-body font-medium text-[#1a1a1a]">
                        {tipoEscolhido === t.id ? 'Configurando...' : t.nome}
                      </span>
                      {tipoEscolhido !== t.id && t.subtitulo && (
                        <span className="text-label text-[#999]">{t.subtitulo}</span>
                      )}
                    </button>
                  ))}
                  {tiposNegocio.length === 0 && !erro && <p className="text-body text-[#999] text-center py-4">Carregando opções...</p>}
                </div>
              ) : (
                <form onSubmit={confirmarOutro} className="flex flex-col gap-3">
                  <div>
                    <label className="text-label text-[#666] block mb-1">Qual é o tipo do seu negócio?</label>
                    <input
                      autoFocus
                      required
                      value={descricaoOutro}
                      onChange={(e) => setDescricaoOutro(e.target.value)}
                      placeholder="Ex: Pet Shop, Barbearia..."
                      className="w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setMostrarCampoOutro(false); setDescricaoOutro(''); setErro('') }}
                      className="flex-1 rounded-btn border border-muted-dark py-2.5 text-body text-[#666] hover:bg-muted"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={!!tipoEscolhido}
                      className="flex-1 rounded-btn bg-primary hover:bg-primary-dark text-white py-2.5 text-body font-semibold disabled:opacity-60"
                    >
                      {tipoEscolhido ? 'Configurando...' : 'Confirmar'}
                    </button>
                  </div>
                </form>
              )}

              {erro && <p className="text-danger text-label mt-3">{erro}</p>}
            </>
          ) : modo === 'escolher-logo' ? (
            <>
              <p className="text-h2 text-[#1a1a1a] mb-1">Personalize sua marca</p>
              <p className="text-body text-[#666] mb-5">
                Escolha o logotipo do seu negócio — ele substitui "ALPHADATA" na plataforma pra você e sua equipe. Dá pra fazer isso depois também, em Configurações.
              </p>

              <div className="flex items-center gap-4 mb-5">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logotipo" className="h-20 w-20 rounded-card object-cover border border-muted-dark" />
                ) : (
                  <div className="h-20 w-20 rounded-card border border-dashed border-muted-dark flex items-center justify-center text-label text-[#999] text-center px-1">
                    sem logo
                  </div>
                )}
                <label className="cursor-pointer rounded-btn px-3 py-1.5 text-label font-medium bg-muted border border-muted-dark hover:bg-primary-light text-center">
                  Escolher imagem
                  <input type="file" accept="image/*" className="hidden" onChange={selecionarLogo} />
                </label>
              </div>

              {erro && <p className="text-danger text-label mb-3">{erro}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => irParaDashboard(sessaoPendente)}
                  className="flex-1 rounded-btn border border-muted-dark py-2.5 text-body text-[#666] hover:bg-muted"
                >
                  Pular por enquanto
                </button>
                <button
                  type="button"
                  onClick={confirmarLogo}
                  disabled={salvandoLogo}
                  className="flex-1 rounded-btn bg-primary hover:bg-primary-dark text-white py-2.5 text-body font-semibold disabled:opacity-60"
                >
                  {salvandoLogo ? 'Salvando...' : 'Concluir'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-h2 text-[#1a1a1a] text-center mb-1">
                {modo === 'entrar' && !apenasCadastro ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </p>
              <p className="text-body text-[#666] text-center mb-6">
                {modo === 'entrar' && !apenasCadastro
                  ? 'Faça login para acessar seu negócio'
                  : planoEscolhido
                    ? `Plano ${NOME_MARKETING_PLANO[planoEscolhido] ?? ''} escolhido — falta só criar sua conta para começar o teste grátis de 7 dias`
                    : 'Comece a organizar seu negócio hoje'}
              </p>

              {!apenasCadastro && (
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
              )}

              <button
                type="button"
                onClick={handleGoogleEntrar}
                className="w-full flex items-center justify-center gap-2 rounded-btn border border-muted-dark py-2.5 text-body font-medium text-[#333] hover:bg-muted transition-colors"
              >
                <IconGoogle /> Continuar com Google
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-muted-dark" />
                <span className="text-label text-[#999]">ou entre com e-mail e senha</span>
                <div className="flex-1 h-px bg-muted-dark" />
              </div>

              {modo === 'entrar' && !apenasCadastro ? (
                <form onSubmit={handleEntrar} className="flex flex-col gap-4">
                  <div>
                    <label className="text-label text-[#666] block mb-1">Email</label>
                    <div className="relative">
                      <IconMail size={18} className={iconeCampoClasse} />
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className={inputComIconeClasse}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label text-[#666] block mb-1">Senha</label>
                    <div className="relative">
                      <IconLock size={18} className={iconeCampoClasse} />
                      <PasswordInput
                        name="senha"
                        autoComplete="current-password"
                        required
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        className={inputComIconeClasse}
                      />
                    </div>
                  </div>

                  {erro && <p className="text-danger text-label">{erro}</p>}

                  <button
                    type="submit"
                    disabled={enviando}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn py-2.5 text-body font-semibold transition-colors disabled:opacity-60"
                  >
                    <IconLogin2 size={20} />
                    {enviando ? 'Entrando...' : 'Entrar no meu negócio'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCriarConta} className="flex flex-col gap-4">
                  <div>
                    <label className="text-label text-[#666] block mb-1">Nome da empresa</label>
                    <div className="relative">
                      <IconBuildingStore size={18} className={iconeCampoClasse} />
                      <input
                        name="nomeEmpresa"
                        autoComplete="organization"
                        required
                        value={nomeEmpresa}
                        onChange={(e) => setNomeEmpresa(e.target.value)}
                        placeholder="Ex: Manutenções Silva"
                        className={inputComIconeClasse}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label text-[#666] block mb-1">Email</label>
                    <div className="relative">
                      <IconMail size={18} className={iconeCampoClasse} />
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className={inputComIconeClasse}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label text-[#666] block mb-1">Senha</label>
                    <div className="relative">
                      <IconLock size={18} className={iconeCampoClasse} />
                      <PasswordInput
                        name="novaSenha"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Ao menos 8 caracteres"
                        className={inputComIconeClasse}
                      />
                    </div>
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

                  {apenasCadastro && (
                    <Link to="/login" className="text-label text-primary hover:underline text-center">
                      Já tem uma conta? Entrar
                    </Link>
                  )}
                </form>
              )}
            </>
          )}

          {modo === 'escolher-negocio' && sessaoPendente && !mostrarCampoOutro && (
            <button
              onClick={() => { setModo('entrar'); setSessaoPendente(null) }}
              className="flex items-center gap-1.5 text-label text-primary hover:underline mt-4"
            >
              <IconArrowLeft size={14} /> Voltar
            </button>
          )}

          <p className="text-center text-[#999] text-label mt-6">© 2026 ALPHADATA - Negócios</p>
        </div>
      </div>

      {/* Coluna de fotos à direita — imagens próprias (não é a mesma foto de
          fundo recortada por bg-cover), pra cada uma aparecer completa,
          nunca cortada pela metade. Some abaixo de "md" por falta de espaço. */}
      <div className="hidden md:flex absolute inset-y-0 right-0 w-[38%] lg:w-[34%] flex-col">
        <img src={foto1} alt="" className="flex-1 min-h-0 w-full object-cover" />
        <img src={foto2} alt="" className="flex-1 min-h-0 w-full object-cover" />
        <img src={foto3} alt="" className="flex-1 min-h-0 w-full object-cover" />
      </div>
    </div>
  )
}
