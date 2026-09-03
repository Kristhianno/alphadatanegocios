/**
 * Cadastro de clientes finais. Restrito à equipe interna (admin/gestor/
 * técnico) — é dado de CRM da conta, um login papel 'cliente' não deve
 * listar ou editar o cadastro de outros clientes.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { ClienteService } from '../services/ClienteService.js'
import type { FiltrosCliente } from '../services/ClienteService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function clienteService() { return new ClienteService(getSupabase()) }

const schemaFiltros = z.object({
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

const protegido = [autenticar, carregarContexto, requererPapel('admin', 'gestor', 'tecnico')] as const

/** Autoatendimento do próprio cliente logado — antes do bloco `protegido` acima, que é exclusivo da equipe interna. */
router.get('/me', autenticar, async (c) => {
  const usuario = c.get('usuarioAutenticado')
  if (usuario.papel !== 'cliente' || !usuario.clienteId) return c.json(null, 200)
  const cliente = await clienteService().buscarProprioCadastro(usuario.clienteId)
  return c.json(cliente, 200)
})

router.post('/', ...protegido, async (c) => {
  const cliente = await clienteService().criarCliente(c.get('usuarioAutenticado').id, await c.req.json())
  return c.json(cliente, 201)
})

router.get('/', ...protegido, validar(schemaFiltros, 'query'), async (c) => {
  const filtros = c.get('dadosValidados') as FiltrosCliente
  const clientes = await clienteService().listarClientes(c.get('usuarioAutenticado').id, filtros)
  return c.json(clientes, 200)
})

router.patch('/:id', ...protegido, validarUuidParam('id'), async (c) => {
  const cliente = await clienteService().atualizarCliente(c.req.param('id') as string, await c.req.json())
  return c.json(cliente, 200)
})

router.post('/:id/desativar', ...protegido, validarUuidParam('id'), async (c) => {
  const cliente = await clienteService().desativarCliente(c.req.param('id') as string)
  return c.json(cliente, 200)
})

export default router
