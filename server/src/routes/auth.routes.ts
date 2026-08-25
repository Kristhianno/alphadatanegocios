/**
 * Cadastro, login e perfil. /registrar e /login são as únicas rotas
 * públicas do sistema — tudo o mais exige `autenticar`.
 */
import { Router } from 'express'
import { supabase } from '../config/database.config.js'
import { UserService } from '../services/UserService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { assinarToken } from '../utils/jwt.js'
import type { Conta, TipoNegocio, Usuario } from '../models/User.js'

const router = Router()
const userService = new UserService(supabase)

function emitirResposta(usuario: Usuario, conta: Conta) {
  return { usuario, conta }
}

router.post('/registrar', async (req, res) => {
  const { email, senha, nomeEmpresa } = req.body as Record<string, unknown>
  const { conta, usuario } = await userService.criarUsuario(email as string, senha as string, nomeEmpresa as string)
  const token = await assinarToken({ sub: usuario.id, contaId: conta.id, papel: usuario.papel, email: usuario.email, clienteId: usuario.clienteId })
  res.status(201).json({ token, ...emitirResposta(usuario, conta) })
})

router.post('/login', async (req, res) => {
  const { email, senha } = req.body as Record<string, unknown>
  const { usuario, conta } = await userService.autenticar(email as string, senha as string)
  const token = await assinarToken({ sub: usuario.id, contaId: conta.id, papel: usuario.papel, email: usuario.email, clienteId: usuario.clienteId })
  res.status(200).json({ token, ...emitirResposta(usuario, conta) })
})

router.use(autenticar)

router.get('/me', async (req, res) => {
  const { usuario, conta } = await userService.obterPerfilCompleto(req.usuarioAutenticado!.id)
  res.status(200).json(emitirResposta(usuario, conta))
})

router.patch('/perfil', async (req, res) => {
  const usuario = await userService.atualizarPerfil(req.usuarioAutenticado!.id, req.body as { nome?: string; email?: string })
  res.status(200).json(usuario)
})

/** Só o admin que abriu a conta escolhe o vertical — a própria UserService.selecionarTipoNegocio também garante isso, esta checagem aqui é só pra falhar mais cedo. */
router.post('/selecionar-tipo-negocio', requererPapel('admin'), async (req, res) => {
  const { tipoNegocio } = req.body as Record<string, unknown>
  const conta = await userService.selecionarTipoNegocio(req.usuarioAutenticado!.id, tipoNegocio as TipoNegocio)
  res.status(200).json(conta)
})

/** Usada tanto pra troca voluntária quanto pra sair do estado "senha temporária" de um cadastro por convite (ver ConvitesService). */
router.post('/trocar-senha', async (req, res) => {
  const { senhaAtual, novaSenha } = req.body as Record<string, unknown>
  await userService.trocarSenha(req.usuarioAutenticado!.id, senhaAtual as string, novaSenha as string)
  res.status(200).json({ ok: true })
})

export default router
