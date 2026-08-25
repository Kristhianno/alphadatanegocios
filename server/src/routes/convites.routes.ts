/**
 * /clientes/gerar é autenticado (equipe interna); as outras duas são
 * deliberadamente públicas — é o link que o futuro cliente abre sem
 * ter feito login em lugar nenhum ainda.
 */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { ConvitesService } from '../services/ConvitesService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function convitesService() { return new ConvitesService(getSupabase()) }

router.post('/clientes/gerar', autenticar, requererPapel('admin', 'gestor', 'tecnico'), async (c) => {
  const convite = await convitesService().criarConvite(c.get('usuarioAutenticado').id)
  return c.json(convite, 201)
})

router.get('/clientes/:token', async (c) => {
  const info = await convitesService().obterInfoConvite(c.req.param('token'))
  return c.json(info, 200)
})

router.post('/clientes/:token', async (c) => {
  const resultado = await convitesService().criarClientePorConvite(c.req.param('token'), await c.req.json())
  return c.json(resultado, 201)
})

export default router
