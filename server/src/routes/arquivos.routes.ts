/**
 * Arquivos da conta logada (fotos, vídeos, PDFs) — ver ArquivoService.
 * Só equipe interna; disponível em todos os planos (a cota varia por plano).
 */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { ArquivoService } from '../services/ArquivoService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function arquivoService() { return new ArquivoService(getSupabase()) }

router.use('*', autenticar, carregarContexto, requererPapel('admin', 'gestor', 'tecnico'))

router.get('/', async (c) => c.json(await arquivoService().listar(c.get('conta').id, c.req.query()), 200))

router.get('/uso', async (c) => c.json(await arquivoService().uso(c.get('conta')), 200))

/** Passo 1: valida e devolve a URL assinada pro navegador enviar o arquivo direto pro Storage. */
router.post('/upload-url', async (c) => c.json(await arquivoService().prepararUpload(c.get('conta'), await c.req.json()), 200))

/** Passo 2: confere o arquivo enviado e registra. */
router.post('/confirmar', async (c) =>
  c.json(await arquivoService().confirmarUpload(c.get('conta'), c.get('usuarioAutenticado').id, await c.req.json()), 201),
)

router.delete('/:id', validarUuidParam('id'), async (c) => {
  await arquivoService().excluir(c.get('conta').id, c.req.param('id') as string)
  return c.body(null, 204)
})

export default router
