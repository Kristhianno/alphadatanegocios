/** Captação de leads da landing page ("fale com a gente") — pública, sem vínculo com conta/tenant. */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { LeadService } from '../services/LeadService.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function leadService() { return new LeadService(getSupabase()) }

router.post('/', async (c) => {
  const lead = await leadService().criar(await c.req.json())
  // Spam barrado pela armadilha recebe o mesmo "ok" — não ensina o robô a contornar.
  return c.json(lead ? { id: lead.id } : { id: null }, 201)
})

export default router
