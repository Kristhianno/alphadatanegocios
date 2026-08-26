import { createContext, useContext, useEffect, useState } from 'react'
import { api, ApiError, clearToken, getToken, setToken } from '../services/api'

const AuthContext = createContext(null)

// As contas demo (seed-demo.ts no backend) continuam apontando pro
// dataset mockado de Ordens de Serviço via esses ids fixos — o backend
// real não tem chamados/ordens no formato rico que essas páginas
// esperam (checklist, fotos, assinatura), então a autenticação é real,
// mas o histórico de OS que elas veem continua sendo o mock. Os 3
// técnicos demo foram nomeados igual aos 3 primeiros técnicos do mock
// de propósito (Carlos Santos/Fernanda Lima/Roberto Alves), pra essa
// ponte fazer sentido visualmente. Qualquer conta criada via "Criar
// conta" ou convite de cliente não recebe ponte nenhuma — começa sem
// ordens mockadas, que é o comportamento correto (não é a mesma pessoa
// que a demo).
const PONTES_DEMO_MOCK = {
  'tecnico@alphadata.com': { tecnicoId: 'TEC-01' }, // Carlos Santos
  'fernanda.lima@alphadata.com': { tecnicoId: 'TEC-03' }, // Fernanda Lima
  'roberto.alves@alphadata.com': { tecnicoId: 'TEC-04' }, // Roberto Alves
  'cliente@alphadata.com': { clienteId: 'CLI-01' },
}

function papelParaUserType(papel) {
  return papel === 'gestor' ? 'admin' : papel
}

function montarSessao(usuario, conta) {
  const ponte = PONTES_DEMO_MOCK[usuario.email] ?? {}
  return {
    id: usuario.id,
    contaId: usuario.contaId,
    userType: papelParaUserType(usuario.papel),
    papel: usuario.papel,
    email: usuario.email,
    nome: usuario.nome,
    deveTrocarSenha: usuario.deveTrocarSenha,
    tipoNegocio: conta?.tipoNegocio ?? null,
    nomeEmpresa: conta?.nomeEmpresa ?? null,
    logoUrl: conta?.configuracoesGerais?.logoUrl ?? null,
    tecnicoId: ponte.tecnicoId ?? null,
    clienteId: ponte.clienteId ?? usuario.clienteId ?? null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let cancelado = false
    async function restaurarSessao() {
      if (!getToken()) {
        setCarregando(false)
        return
      }
      try {
        const { usuario, conta } = await api.get('/auth/me')
        if (!cancelado) setUser(montarSessao(usuario, conta))
      } catch {
        clearToken()
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }
    restaurarSessao()
    return () => {
      cancelado = true
    }
  }, [])

  async function login(email, senha) {
    try {
      const { token, usuario, conta } = await api.post('/auth/login', { email, senha }, { comAuth: false })
      setToken(token)
      const sessao = montarSessao(usuario, conta)
      setUser(sessao)
      return { ok: true, sessao, precisaEscolherNegocio: !conta.tipoNegocio, deveTrocarSenha: usuario.deveTrocarSenha }
    } catch (erro) {
      return { ok: false, error: erro instanceof ApiError ? erro.message : 'Falha ao entrar. Tente novamente.' }
    }
  }

  /** Bridge do login com Google: troca a sessão do Supabase (já autenticada pelo front) pelo mesmo JWT de sempre. */
  async function entrarComSupabase(supabaseAccessToken) {
    try {
      const { token, usuario, conta } = await api.post('/auth/entrar-supabase', { supabaseAccessToken }, { comAuth: false })
      setToken(token)
      const sessao = montarSessao(usuario, conta)
      setUser(sessao)
      return { ok: true, sessao, precisaEscolherNegocio: !conta.tipoNegocio, deveTrocarSenha: usuario.deveTrocarSenha }
    } catch (erro) {
      return { ok: false, error: erro instanceof ApiError ? erro.message : 'Falha ao entrar com Google. Tente novamente.' }
    }
  }

  async function registrar(email, senha, nomeEmpresa) {
    try {
      const { token, usuario, conta } = await api.post('/auth/registrar', { email, senha, nomeEmpresa }, { comAuth: false })
      setToken(token)
      const sessao = montarSessao(usuario, conta)
      setUser(sessao)
      return { ok: true, sessao }
    } catch (erro) {
      return { ok: false, error: erro instanceof ApiError ? erro.message : 'Falha ao criar conta. Tente novamente.', detalhes: erro?.detalhes }
    }
  }

  async function selecionarTipoNegocio(tipoNegocio, descricaoPersonalizada) {
    try {
      const conta = await api.post('/auth/selecionar-tipo-negocio', { tipoNegocio, descricaoPersonalizada })
      setUser((u) => (u ? { ...u, tipoNegocio: conta.tipoNegocio, nomeEmpresa: conta.nomeEmpresa } : u))
      return { ok: true }
    } catch (erro) {
      return { ok: false, error: erro instanceof ApiError ? erro.message : 'Falha ao definir o tipo de negócio.' }
    }
  }

  /** Personalização de marca (nome fantasia + logo) — só admin chama, ver PATCH /auth/conta. */
  async function atualizarBranding(dados) {
    try {
      const conta = await api.patch('/auth/conta', dados)
      setUser((u) => (u ? { ...u, nomeEmpresa: conta.nomeEmpresa, logoUrl: conta.configuracoesGerais?.logoUrl ?? null } : u))
      return { ok: true }
    } catch (erro) {
      return { ok: false, error: erro instanceof ApiError ? erro.message : 'Falha ao salvar a personalização.' }
    }
  }

  /** Dados pessoais do login (nome/email) — distinto de atualizarBranding, que é da conta/empresa. */
  async function atualizarPerfil(dados) {
    try {
      const usuario = await api.patch('/auth/perfil', dados)
      setUser((u) => (u ? { ...u, nome: usuario.nome, email: usuario.email } : u))
      return { ok: true }
    } catch (erro) {
      return { ok: false, error: erro instanceof ApiError ? erro.message : 'Falha ao salvar o perfil.' }
    }
  }

  async function trocarSenha(senhaAtual, novaSenha) {
    try {
      await api.post('/auth/trocar-senha', { senhaAtual, novaSenha })
      setUser((u) => (u ? { ...u, deveTrocarSenha: false } : u))
      return { ok: true }
    } catch (erro) {
      return { ok: false, error: erro instanceof ApiError ? erro.message : 'Falha ao trocar a senha.' }
    }
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, carregando, login, entrarComSupabase, registrar, selecionarTipoNegocio, atualizarBranding, atualizarPerfil, trocarSenha, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  return ctx
}
