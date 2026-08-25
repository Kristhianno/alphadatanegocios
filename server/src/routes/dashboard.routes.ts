import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { DashboardService } from '../services/DashboardService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function dashboardService() { return new DashboardService(getSupabase()) }

router.get('/', autenticar, carregarContexto, async (c) => {
  const resumo = await dashboardService().obterResumo(c.get('usuarioAutenticado').id)
  return c.json(resumo, 200)
})

export default router
