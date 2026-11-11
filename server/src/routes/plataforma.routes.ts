/**
 * Painel do dono da plataforma — tudo aqui exige papel `superadmin`.
 * Sem `carregarContexto` de propósito: essas rotas não agem "dentro" de
 * uma conta, e sim sobre todas (ver PlataformaService).
 */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { PlataformaService } from '../services/PlataformaService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function plataformaService() { return new PlataformaService(getSupabase()) }

router.use('*', autenticar, requererPapel('superadmin'))

router.get('/resumo', async (c) => c.json(await plataformaService().resumo(), 200))

router.get('/contas', async (c) => c.json(await plataformaService().listarContas(), 200))

router.get('/leads', async (c) => c.json(await plataformaService().listarLeads(), 200))

router.patch('/contas/:id/status', async (c) => {
  const { status } = (await c.req.json()) as Record<string, unknown>
  return c.json(await plataformaService().alterarStatusConta(c.req.param('id'), status), 200)
})

export default router
