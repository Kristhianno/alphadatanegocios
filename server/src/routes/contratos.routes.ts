import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { ContratoService } from '../services/ContratoService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validarUuidParam } from '../middleware/validacao.middleware.js'
import { ErroProibido } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function contratoService() { return new ContratoService(getSupabase()) }

const schemaFiltros = z.object({ status: z.enum(['rascunho', 'enviado', 'assinado', 'cancelado']).optional() })

const protegido = [autenticar, carregarContexto] as const

/** Sem restrição de papel: equipe interna vê todos os contratos da conta, cliente só os próprios — a distinção é resolvida dentro do service, como em manutencao.routes.ts. */
router.get('/', ...protegido, async (c) => {
  const { status } = schemaFiltros.parse({ status: c.req.query('status') })
  const contratos = await contratoService().listarContratos(c.get('usuarioAutenticado').id, status ? { status } : {})
  return c.json(contratos, 200)
})

router.post('/:id/assinar', ...protegido, requererPapel('cliente'), validarUuidParam('id'), async (c) => {
  const clienteId = c.get('usuarioAutenticado').clienteId
  if (!clienteId) throw new ErroProibido('Este login não está vinculado a um cliente.')
  const contrato = await contratoService().assinarContrato(c.req.param('id') as string, clienteId)
  return c.json(contrato, 200)
})

export default router
