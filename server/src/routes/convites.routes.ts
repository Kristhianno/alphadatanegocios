/**
 * /clientes/gerar e /equipe/gerar são autenticados; as demais são
 * deliberadamente públicas — é o link que o futuro cliente/membro de
 * equipe abre sem ter feito login em lugar nenhum ainda.
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

/** Só o admin da conta convida equipe — ver ConvitesService.criarConviteEquipe. */
router.post('/equipe/gerar', autenticar, requererPapel('admin'), async (c) => {
  const { papel } = (await c.req.json()) as { papel?: string }
  const convite = await convitesService().criarConviteEquipe(c.get('usuarioAutenticado').id, papel)
  return c.json(convite, 201)
})

router.get('/equipe/:token', async (c) => {
  const info = await convitesService().obterInfoConviteEquipe(c.req.param('token'))
  return c.json(info, 200)
})

router.post('/equipe/:token', async (c) => {
  const resultado = await convitesService().criarUsuarioPorConvite(c.req.param('token'), await c.req.json())
  return c.json(resultado, 201)
})

export default router
