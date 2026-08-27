/** Captação de leads da landing page ("fale com a gente") — pública, sem vínculo com conta/tenant. */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { LeadService } from '../services/LeadService.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function leadService() { return new LeadService(getSupabase()) }

router.post('/', async (c) => {
  const { nome, email, origem } = (await c.req.json()) as Record<string, unknown>
  const lead = await leadService().criar(nome as string, email as string, origem as string | undefined)
  return c.json(lead, 201)
})

export default router
