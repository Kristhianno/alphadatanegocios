/**
 * Cadastro, login e perfil. /registrar e /login são as únicas rotas
 * públicas do sistema — tudo o mais exige `autenticar` (passado
 * explicitamente por rota, não via `.use()` — mais verboso, mas remove
 * qualquer dúvida sobre ordem de registro importar ou não no router do
 * Hono, diferente do stack sequencial do Express).
 */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { UserService } from '../services/UserService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { assinarToken } from '../utils/jwt.js'
import type { Conta, TipoNegocio, Usuario } from '../models/User.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function userService() { return new UserService(getSupabase()) }

function emitirResposta(usuario: Usuario, conta: Conta) {
  return { usuario, conta }
}

router.post('/registrar', async (c) => {
  const { email, senha, nomeEmpresa } = (await c.req.json()) as Record<string, unknown>
  const { conta, usuario } = await userService().criarUsuario(email as string, senha as string, nomeEmpresa as string)
  const token = await assinarToken({ sub: usuario.id, contaId: conta.id, papel: usuario.papel, email: usuario.email, clienteId: usuario.clienteId })
  return c.json({ token, ...emitirResposta(usuario, conta) }, 201)
})

router.post('/login', async (c) => {
  const { email, senha } = (await c.req.json()) as Record<string, unknown>
  const { usuario, conta } = await userService().autenticar(email as string, senha as string)
  const token = await assinarToken({ sub: usuario.id, contaId: conta.id, papel: usuario.papel, email: usuario.email, clienteId: usuario.clienteId })
  return c.json({ token, ...emitirResposta(usuario, conta) }, 200)
})

/** Bridge do login com Google: o front já trocou o consentimento por uma sessão do Supabase, aqui ela vira o mesmo JWT de sempre. */
router.post('/entrar-supabase', async (c) => {
  const { supabaseAccessToken } = (await c.req.json()) as Record<string, unknown>
  const { usuario, conta } = await userService().autenticarViaSupabase(supabaseAccessToken as string)
  const token = await assinarToken({ sub: usuario.id, contaId: conta.id, papel: usuario.papel, email: usuario.email, clienteId: usuario.clienteId })
  return c.json({ token, ...emitirResposta(usuario, conta) }, 200)
})

/** Conclui o fluxo de "esqueci minha senha": o front já trocou a nova senha no Supabase, aqui ela é sincronizada localmente e a sessão vira o mesmo JWT de sempre. */
router.post('/concluir-redefinicao-senha', async (c) => {
  const { supabaseAccessToken, novaSenha } = (await c.req.json()) as Record<string, unknown>
  const { usuario, conta } = await userService().autenticarViaSupabase(supabaseAccessToken as string, novaSenha as string)
  const token = await assinarToken({ sub: usuario.id, contaId: conta.id, papel: usuario.papel, email: usuario.email, clienteId: usuario.clienteId })
  return c.json({ token, ...emitirResposta(usuario, conta) }, 200)
})

router.get('/me', autenticar, async (c) => {
  const { usuario, conta } = await userService().obterPerfilCompleto(c.get('usuarioAutenticado').id)
  return c.json(emitirResposta(usuario, conta), 200)
})

router.patch('/perfil', autenticar, async (c) => {
  const dados = (await c.req.json()) as { nome?: string; email?: string }
  const usuario = await userService().atualizarPerfil(c.get('usuarioAutenticado').id, dados)
  return c.json(usuario, 200)
})

/** Personalização de marca (nome fantasia + logo) — admin altera, reflete pra toda a equipe da conta. */
router.patch('/conta', autenticar, requererPapel('admin'), async (c) => {
  const dados = (await c.req.json()) as { nomeEmpresa?: string; logoUrl?: string | null }
  const conta = await userService().atualizarBranding(c.get('usuarioAutenticado').id, dados)
  return c.json(conta, 200)
})

/** Só o admin que abriu a conta escolhe o vertical — a própria UserService.selecionarTipoNegocio também garante isso, esta checagem aqui é só pra falhar mais cedo. */
router.post('/selecionar-tipo-negocio', autenticar, requererPapel('admin'), async (c) => {
  const { tipoNegocio, descricaoPersonalizada } = (await c.req.json()) as Record<string, unknown>
  const conta = await userService().selecionarTipoNegocio(c.get('usuarioAutenticado').id, tipoNegocio as TipoNegocio, descricaoPersonalizada as string | undefined)
  return c.json(conta, 200)
})

/** Usada tanto pra troca voluntária quanto pra sair do estado "senha temporária" de um cadastro por convite (ver ConvitesService). */
router.post('/trocar-senha', autenticar, async (c) => {
  const { senhaAtual, novaSenha } = (await c.req.json()) as Record<string, unknown>
  await userService().trocarSenha(c.get('usuarioAutenticado').id, senhaAtual as string, novaSenha as string)
  return c.json({ ok: true }, 200)
})

export default router
