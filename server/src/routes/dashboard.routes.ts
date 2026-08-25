import { Router } from 'express'
import { supabase } from '../config/database.config.js'
import { DashboardService } from '../services/DashboardService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'

const router = Router()
const dashboardService = new DashboardService(supabase)

router.use(autenticar, carregarContexto)

router.get('/', async (req, res) => {
  const resumo = await dashboardService.obterResumo(req.usuarioAutenticado!.id)
  res.status(200).json(resumo)
})

export default router
