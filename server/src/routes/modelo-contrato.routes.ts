/** Modelo de contrato da conta (arquivo + texto com campos) — ver ModeloContratoService. Admin e gestor. */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { ModeloContratoService } from '../services/ModeloContratoService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function servico() { return new ModeloContratoService(getSupabase()) }

router.use('*', autenticar, carregarContexto, requererPapel('admin', 'gestor'))

router.get('/', async (c) => c.json(await servico().obter(c.get('conta')), 200))
router.put('/texto', async (c) => c.json(await servico().salvarTexto(c.get('conta'), await c.req.json()), 200))
router.post('/arquivo', async (c) => c.json(await servico().definirArquivo(c.get('conta'), await c.req.json()), 200))
router.delete('/arquivo', async (c) => c.json(await servico().removerArquivo(c.get('conta')), 200))

export default router
