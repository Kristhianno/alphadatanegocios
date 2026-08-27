import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { LancamentoFinanceiroService } from '../services/LancamentoFinanceiroService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function lancamentoFinanceiroService() { return new LancamentoFinanceiroService(getSupabase()) }

const schemaFiltros = z.object({
  tipo: z.enum(['receita', 'despesa']).optional(),
  status: z.enum(['pendente', 'pago', 'cancelado']).optional(),
})

/** Financeiro é restrito à equipe interna em toda rota — não é um módulo do portal do cliente. */
const protegido = [autenticar, carregarContexto, requererPapel('admin', 'gestor')] as const

router.get('/', ...protegido, async (c) => {
  const { tipo, status } = schemaFiltros.parse({ tipo: c.req.query('tipo'), status: c.req.query('status') })
  const service = lancamentoFinanceiroService()
  const userId = c.get('usuarioAutenticado').id
  const [lancamentos, resumo] = await Promise.all([
    service.listar(userId, { ...(tipo && { tipo }), ...(status && { status }) }),
    service.resumo(userId),
  ])
  return c.json({ lancamentos, resumo }, 200)
})

router.post('/', ...protegido, async (c) => {
  const lancamento = await lancamentoFinanceiroService().criar(c.get('usuarioAutenticado').id, await c.req.json())
  return c.json(lancamento, 201)
})

router.patch('/:id/pagar', ...protegido, validarUuidParam('id'), async (c) => {
  const lancamento = await lancamentoFinanceiroService().marcarPago(c.req.param('id') as string)
  return c.json(lancamento, 200)
})

router.post('/:id/cancelar', ...protegido, validarUuidParam('id'), async (c) => {
  const lancamento = await lancamentoFinanceiroService().cancelar(c.req.param('id') as string)
  return c.json(lancamento, 200)
})

export default router
