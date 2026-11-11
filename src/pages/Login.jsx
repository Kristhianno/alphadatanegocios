import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  IconLogin2,
  IconUserPlus,
  IconArrowLeft,
  IconMail,
  IconLock,
  IconBuildingStore,
  IconCheck,
  IconPhotoUp,
} from '@tabler/icons-react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { TAMANHO_MAX_LOGO_BYTES } from '../hooks/useBranding'
import { api } from '../services/api'
import { supabase } from '../services/supabase'
import PasswordInput from '../components/ui/PasswordInput'
import AlphaDataLogo from '../components/AlphaDataLogo'
import SeletorNicho from '../components/SeletorNicho'
import { destinoDoUsuario } from '../utils/destino'
import { CICLO_PADRAO, NOME_MARKETING_PLANO, OPCOES_CICLO, formatarPreco, precoMensalDoCiclo } from '../data/planos'


const inputComIconeClasse =
  'w-full rounded-btn border border-muted-dark bg-surface pl-10 pr-3 py-3 text-body text-[#1a1a1a] placeholder:text-[#aaa] transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'
// z-10: o PasswordInput tem um wrapper `relative` próprio que, sem isso, era pintado por cima do ícone de cadeado.
const iconeCampoClasse = 'absolute left-3 top-1/2 -translate-y-1/2 z-10 text-[#999] pointer-events-none'
const rotuloClasse = 'block mb-1.5 text-label font-medium text-[#444]'
const erroClasse = 'rounded-btn bg-red-50 border border-red-100 px-3 py-2 text-label text-danger'
const botaoPrincipalClasse =
  'flex items-center justify-center gap-2 rounded-btn bg-primary hover:bg-primary-dark text-white py-3 text-body font-semibold transition-colors disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

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

/** Fundo da tela de login/cadastro: o gradiente azul da marca (o mesmo do hero da landing), com luzes suaves. */
function FundoAzul({ children }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(140deg, #0052CC 0%, #003A94 55%, #002A6B 100%)' }}
    >
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-[#10B981]/15 blur-3xl" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}

const PASSOS_ONBOARDING = ['Sua conta', 'Seu negócio', 'Sua marca']

/** Indicador de progresso do onboarding (cadastro → nicho → logo). */
function PassosOnboarding({ atual }) {
  return (
    <ol className="flex items-center gap-2 mb-6" aria-label="Etapas do cadastro">
      {PASSOS_ONBOARDING.map((rotulo, i) => {
        const feito = i < atual
        const ativo = i === atual
        return (
          <li key={rotulo} className="flex items-center gap-2 min-w-0 flex-1 last:flex-none" aria-current={ativo ? 'step' : undefined}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                feito ? 'bg-primary text-white' : ativo ? 'bg-primary-light text-primary ring-2 ring-primary' : 'bg-muted text-[#999]'
              }`}
            >
              {feito ? <IconCheck size={14} stroke={3} /> : i + 1}
            </span>
            <span className={`text-label whitespace-nowrap ${ativo ? 'font-semibold text-[#1a1a1a]' : 'text-[#999]'} ${ativo ? '' : 'hidden sm:inline'}`}>
              {rotulo}
            </span>
            {i < PASSOS_ONBOARDING.length - 1 && <span className={`h-px flex-1 min-w-4 ${feito ? 'bg-primary' : 'bg-muted-dark'}`} />}
          </li>
        )
      })}
    </ol>
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
  const { login, registrar, selecionarTipoNegocio, atualizarBranding, user, isAuthenticated, logout } = useAuth()
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
  // Escolha do nicho: card largo e sem a coluna de fotos (que não são de festas), pra caberem 2-3 colunas de opções.
  const telaLarga = modo === 'escolher-negocio'

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const [sessaoPendente, setSessaoPendente] = useState(sessaoPendenteInicial)
  const [tiposNegocio, setTiposNegocio] = useState([])
  const [tipoEscolhido, setTipoEscolhido] = useState(null)

  const [logoPreview, setLogoPreview] = useState(null)
  const [salvandoLogo, setSalvandoLogo] = useState(false)

  // Quem não veio de um CTA de plano na landing (planoEscolhido) ainda
  // precisa poder escolher — mesmo pro teste grátis. Default Essencial/12 meses.
  const [planos, setPlanos] = useState([])
  const [planoForm, setPlanoForm] = useState('startup')
  const [cicloForm, setCicloForm] = useState(CICLO_PADRAO)

  useEffect(() => {
    if (modo === 'escolher-negocio' && tiposNegocio.length === 0) {
      api
        .get('/config/tipos-negocio-disponiveis', { comAuth: false })
        .then(setTiposNegocio)
        .catch(() => setErro('Não foi possível carregar os tipos de negócio.'))
    }
  }, [modo, tiposNegocio.length])

  useEffect(() => {
    if (modo === 'criar-conta' && !planoEscolhido && planos.length === 0) {
      api
        .get('/config/planos-disponiveis', { comAuth: false })
        .then(setPlanos)
        .catch(() => {})
    }
  }, [modo, planoEscolhido, planos.length])

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
    const resultado = await registrar(email, senha, nomeEmpresa, planoEscolhido ?? planoForm, cicloEscolhido ?? cicloForm)
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

  function confirmarNicho(opcao, descricaoOutro) {
    if (opcao.tipoNegocio === 'outro') {
      handleEscolherNegocio('outro', 'outro', descricaoOutro, descricaoOutro)
      return
    }
    handleEscolherNegocio(opcao.id, opcao.tipoNegocio, undefined, opcao.nome)
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

  const telaAuth = modo === 'entrar' || modo === 'criar-conta'

  /** Sessão salva no navegador: oferece seguir pro painel em vez de pedir login de novo. */
  function irParaPainelDaSessao() {
    if (!user.tipoNegocio && user.papel !== 'superadmin') {
      // Mesma página (/login): navegar pra cá não remonta o componente, então troca o passo direto.
      setSessaoPendente(user)
      setModo('escolher-negocio')
      return
    }
    const { para, state } = destinoDoUsuario(user)
    navigate(para, state ? { state } : undefined)
  }

  const avisoSessaoAtiva = isAuthenticated && user && !enviando && (
    <div className="mb-6 rounded-card border border-primary-light bg-primary-light px-4 py-3">
      <p className="text-body text-[#1a1a1a]">
        Você já está conectado como <span className="font-semibold break-words">{user.email}</span>.
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <button type="button" onClick={irParaPainelDaSessao} className="text-label font-semibold text-primary hover:underline">
          Ir para o meu painel →
        </button>
        <button type="button" onClick={logout} className="text-label text-[#666] hover:underline">
          Sair desta conta
        </button>
      </div>
    </div>
  )
  const emCadastro = modo === 'criar-conta' || apenasCadastro

  const formularioAuth = (
    <>
      <h1 className="text-[24px] sm:text-[28px] font-bold leading-tight text-[#1a1a1a] text-center">
        {emCadastro ? 'Crie sua conta' : 'Que bom ter você de volta!'}
      </h1>
      <p className="mt-1.5 mb-6 text-body text-[#666] text-center">
        {!emCadastro
          ? 'Entre para acessar o painel do seu negócio.'
          : planoEscolhido
            ? `Plano ${NOME_MARKETING_PLANO[planoEscolhido] ?? ''} escolhido. Falta só criar sua conta para começar o teste grátis de 7 dias.`
            : '7 dias grátis para testar, sem cartão de crédito.'}
      </p>

      {!apenasCadastro && (
        <div className="flex rounded-btn bg-muted p-1 mb-6" role="tablist" aria-label="Entrar ou criar conta">
          {[
            ['entrar', 'Entrar'],
            ['criar-conta', 'Criar conta'],
          ].map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={modo === valor}
              onClick={() => { setModo(valor); setErro('') }}
              className={`flex-1 rounded-btn py-2.5 text-body font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                modo === valor ? 'bg-surface shadow-card text-primary' : 'text-[#666] hover:text-[#333]'
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleEntrar}
        className="w-full flex items-center justify-center gap-2.5 rounded-btn border border-muted-dark bg-surface py-3 text-body font-medium text-[#333] hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <IconGoogle /> {emCadastro ? 'Criar conta com Google' : 'Continuar com Google'}
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-muted-dark" />
        <span className="text-label text-[#999]">ou com e-mail e senha</span>
        <div className="flex-1 h-px bg-muted-dark" />
      </div>

      {!emCadastro ? (
        <form onSubmit={handleEntrar} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className={rotuloClasse}>E-mail</label>
            <div className="relative">
              <IconMail size={18} className={iconeCampoClasse} />
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputComIconeClasse}
              />
            </div>
          </div>
          <div>
            <label htmlFor="login-senha" className={rotuloClasse}>Senha</label>
            <div className="relative">
              <IconLock size={18} className={iconeCampoClasse} />
              <PasswordInput
                id="login-senha"
                name="senha"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className={inputComIconeClasse}
              />
            </div>
          </div>

          {erro && <p role="alert" className={erroClasse}>{erro}</p>}

          <button type="submit" disabled={enviando} className={botaoPrincipalClasse}>
            <IconLogin2 size={20} />
            {enviando ? 'Entrando...' : 'Entrar no meu negócio'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCriarConta} className="flex flex-col gap-4">
          {!planoEscolhido && planos.length > 0 && (
            <fieldset>
              <legend className={rotuloClasse}>Escolha seu plano</legend>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {planos.map((p) => (
                  <button
                    key={p.plano}
                    type="button"
                    aria-pressed={planoForm === p.plano}
                    onClick={() => setPlanoForm(p.plano)}
                    className={`rounded-btn border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      planoForm === p.plano ? 'border-primary bg-primary-light' : 'border-muted-dark hover:bg-muted'
                    }`}
                  >
                    <span className="block text-body font-semibold text-[#1a1a1a]">{p.nomeMarketing}</span>
                    <span className="block text-label text-[#777]">{formatarPreco(precoMensalDoCiclo(p, cicloForm))}/mês</span>
                  </button>
                ))}
              </div>
              <div className="flex rounded-btn bg-muted p-1">
                {OPCOES_CICLO.map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={cicloForm === valor}
                    onClick={() => setCicloForm(valor)}
                    className={`flex-1 rounded-btn py-1.5 text-label font-medium transition-colors ${cicloForm === valor ? 'bg-surface shadow-card text-primary' : 'text-[#666]'}`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-label text-[#999]">Você só paga depois do teste grátis, quando escolher assinar.</p>
            </fieldset>
          )}

          <div>
            <label htmlFor="cadastro-empresa" className={rotuloClasse}>Nome da empresa</label>
            <div className="relative">
              <IconBuildingStore size={18} className={iconeCampoClasse} />
              <input
                id="cadastro-empresa"
                name="nomeEmpresa"
                autoComplete="organization"
                required
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Festa Mágica Eventos"
                className={inputComIconeClasse}
              />
            </div>
          </div>
          <div>
            <label htmlFor="cadastro-email" className={rotuloClasse}>E-mail</label>
            <div className="relative">
              <IconMail size={18} className={iconeCampoClasse} />
              <input
                id="cadastro-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputComIconeClasse}
              />
            </div>
          </div>
          <div>
            <label htmlFor="cadastro-senha" className={rotuloClasse}>Senha</label>
            <div className="relative">
              <IconLock size={18} className={iconeCampoClasse} />
              <PasswordInput
                id="cadastro-senha"
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
            {senha.length > 0 && senha.length < 8 && (
              <p className="mt-1 text-label text-[#999]">Faltam {8 - senha.length} caractere{8 - senha.length === 1 ? '' : 's'}.</p>
            )}
          </div>

          {erro && <p role="alert" className={erroClasse}>{erro}</p>}

          <button type="submit" disabled={enviando} className={botaoPrincipalClasse}>
            <IconUserPlus size={20} />
            {enviando ? 'Criando conta...' : 'Criar minha conta'}
          </button>

          <p className="text-label text-[#999] text-center">
            Ao criar a conta, você concorda com a nossa{' '}
            <Link to="/privacidade" className="text-primary hover:underline">política de privacidade</Link>.
          </p>

          {apenasCadastro && (
            <Link to="/login" className="text-label text-primary hover:underline text-center">
              Já tem uma conta? Entrar
            </Link>
          )}
        </form>
      )}
    </>
  )

  // Entrar / criar conta: só o card do formulário, centralizado sobre o fundo azul da marca.
  if (telaAuth) {
    return (
      <FundoAzul>
        <div className="min-h-screen flex flex-col">
          <div className="px-4 sm:px-8 pt-4 sm:pt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-btn px-2.5 py-1.5 text-label font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors"
            >
              <IconArrowLeft size={16} /> Voltar para o site
            </Link>
          </div>
          <main className="flex-1 flex items-center justify-center px-3 sm:px-6 py-6 sm:py-10">
            <div className="w-full max-w-[460px] rounded-[14px] bg-surface p-6 sm:p-10 shadow-[0_24px_60px_rgba(0,20,60,0.35)]">
              <div className="flex justify-center mb-6">
                <AlphaDataLogo />
              </div>
              {avisoSessaoAtiva}
              {formularioAuth}
            </div>
          </main>
          <p className="px-5 pb-6 text-center text-label text-blue-100/70">© 2026 ALPHADATA - Negócios</p>
        </div>
      </FundoAzul>
    )
  }

  // Onboarding (escolher nicho / logo): card sobre o mesmo fundo azul.
  return (
    <FundoAzul>
      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-10 2xl:px-16 py-8 sm:py-10">
        <div
          className={`w-full bg-surface rounded-[14px] shadow-[0_24px_60px_rgba(0,20,60,0.35)] p-5 sm:p-10 ${
            telaLarga ? 'max-w-5xl pb-0 sm:pb-0' : 'max-w-lg'
          }`}
        >
          <div className={`flex justify-center ${telaLarga ? 'mb-4' : 'mb-6'}`}>
            <AlphaDataLogo className={telaLarga ? 'scale-90' : ''} />
          </div>

          {sessaoPendente && <PassosOnboarding atual={modo === 'escolher-negocio' ? 1 : 2} />}

          {modo === 'escolher-negocio' ? (
            <SeletorNicho
              opcoes={tiposNegocio}
              carregando={tiposNegocio.length === 0 && !erro}
              enviandoId={tipoEscolhido}
              erro={erro}
              onConfirmar={confirmarNicho}
              onVoltar={sessaoPendente ? () => { setModo('entrar'); setSessaoPendente(null) } : undefined}
            />
          ) : (
            <>
              <h1 className="text-[22px] sm:text-[26px] font-bold leading-tight text-[#1a1a1a] mb-1.5">Personalize sua marca</h1>
              <p className="text-body text-[#666] mb-6">
                Envie o logotipo do seu negócio. Ele aparece no lugar de "ALPHADATA" pra você e sua equipe. Dá pra fazer isso depois também, em Configurações.
              </p>

              <label className="group flex items-center gap-4 rounded-card border-2 border-dashed border-muted-dark p-4 mb-5 cursor-pointer hover:border-primary hover:bg-primary-light transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
                {logoPreview ? (
                  <img src={logoPreview} alt="Prévia do logotipo" className="h-20 w-20 shrink-0 rounded-card object-contain bg-surface border border-muted-dark" />
                ) : (
                  <span className="h-20 w-20 shrink-0 rounded-card bg-muted flex items-center justify-center text-[#999] group-hover:text-primary">
                    <IconPhotoUp size={30} stroke={1.5} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-body font-semibold text-[#1a1a1a]">{logoPreview ? 'Trocar imagem' : 'Escolher imagem'}</span>
                  <span className="block text-label text-[#999]">PNG ou JPG, até 300KB. Quadrada fica melhor.</span>
                </span>
                <input type="file" accept="image/*" className="sr-only" onChange={selecionarLogo} />
              </label>

              {erro && <p role="alert" className={`${erroClasse} mb-4`}>{erro}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => irParaDashboard(sessaoPendente)}
                  className="flex-1 rounded-btn border border-muted-dark py-3 sm:py-2.5 text-body text-[#666] hover:bg-muted"
                >
                  Pular por enquanto
                </button>
                <button
                  type="button"
                  onClick={confirmarLogo}
                  disabled={salvandoLogo}
                  className="flex-1 rounded-btn bg-primary hover:bg-primary-dark text-white py-3 sm:py-2.5 text-body font-semibold disabled:opacity-60"
                >
                  {salvandoLogo ? 'Salvando...' : logoPreview ? 'Salvar e entrar' : 'Concluir'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </FundoAzul>
  )
}
