/** Portfólio da conta logada (pacotes, kits, adicionais) — ver PortfolioService. Só equipe interna. */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { PortfolioService } from '../services/PortfolioService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function portfolioService() { return new PortfolioService(getSupabase()) }

router.use('*', autenticar, carregarContexto, requererPapel('admin', 'gestor', 'tecnico'))

router.get('/', async (c) => c.json(await portfolioService().listar(c.get('conta').id, c.req.query('tipo')), 200))

router.get('/materiais/:tipo', async (c) => c.json(await portfolioService().materiais(c.get('conta').id, c.req.param('tipo')), 200))

router.post('/', async (c) => c.json(await portfolioService().criar(c.get('conta').id, await c.req.json()), 201))

router.get('/:id', validarUuidParam('id'), async (c) =>
  c.json(await portfolioService().buscarComMidia(c.get('conta').id, c.req.param('id') as string), 200),
)

router.patch('/:id', validarUuidParam('id'), async (c) =>
  c.json(await portfolioService().atualizar(c.get('conta').id, c.req.param('id') as string, await c.req.json()), 200),
)

router.delete('/:id', validarUuidParam('id'), async (c) => {
  await portfolioService().excluir(c.get('conta').id, c.req.param('id') as string)
  return c.body(null, 204)
})

export default router
