/**
 * CRM em kanban (plano Completo/Enterprise): leads da conta logada.
 * Só equipe interna — login 'cliente' não enxerga o funil de vendas.
 */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { CrmService } from '../services/CrmService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirPlano } from '../middleware/contexto-negocio.middleware.js'
import { validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

/** Planos que incluem o CRM — espelhado no front em src/data/planos.js (PLANOS_COM_CRM). */
export const PLANOS_COM_CRM = ['profissional', 'enterprise'] as const

const router = new Hono<AppEnv>()
function crmService() { return new CrmService(getSupabase()) }

router.use('*', autenticar, carregarContexto, requererPapel('admin', 'gestor', 'tecnico'), exigirPlano(...PLANOS_COM_CRM))

router.get('/leads', async (c) => c.json(await crmService().listar(c.get('conta').id), 200))

router.get('/resumo', async (c) => c.json(await crmService().resumo(c.get('conta').id), 200))

router.post('/leads', async (c) => c.json(await crmService().criar(c.get('conta').id, await c.req.json()), 201))

router.patch('/leads/:id', validarUuidParam('id'), async (c) =>
  c.json(await crmService().atualizar(c.get('conta').id, c.req.param('id') as string, await c.req.json()), 200),
)

router.post('/leads/:id/mover', validarUuidParam('id'), async (c) =>
  c.json(await crmService().mover(c.get('conta').id, c.req.param('id') as string, await c.req.json()), 200),
)

router.post('/leads/:id/contato', validarUuidParam('id'), async (c) =>
  c.json(await crmService().registrarContato(c.get('conta').id, c.req.param('id') as string), 200),
)

router.delete('/leads/:id', validarUuidParam('id'), async (c) => {
  await crmService().excluir(c.get('conta').id, c.req.param('id') as string)
  return c.body(null, 204)
})

export default router
