import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { FotografiaService } from '../services/tipo-especifico/FotografiaService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function fotografiaService() { return new FotografiaService(getSupabase()) }

const schemaFotos = z.object({ fotos: z.array(z.string()).min(1, 'Envie ao menos uma foto.') })
const schemaEdicao = z.object({ percentual: z.number().min(0).max(100) })
const schemaFavoritas = z.object({ fotosIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos uma foto.') })
const schemaGaleria = z.object({ diasValidade: z.number().int().positive() })
const schemaPortfolio = z.object({ permissaoCliente: z.boolean() })

const protegido = [autenticar, carregarContexto, exigirTipoNegocio('fotografia_video')] as const

router.post('/sessoes', ...protegido, async (c) => {
  const sessao = await fotografiaService().criarSessaoFoto(c.get('usuarioAutenticado').id, await c.req.json())
  return c.json(sessao, 201)
})

router.post('/sessoes/:sessaoId/fotos', ...protegido, validarUuidParam('sessaoId'), validar(schemaFotos), async (c) => {
  const { fotos } = c.get('dadosValidados') as z.infer<typeof schemaFotos>
  const quantidade = await fotografiaService().uploadFotosOriginal(c.req.param('sessaoId') as string, fotos)
  return c.json({ quantidade }, 201)
})

router.patch('/sessoes/:sessaoId/edicao', ...protegido, validarUuidParam('sessaoId'), validar(schemaEdicao), async (c) => {
  const { percentual } = c.get('dadosValidados') as z.infer<typeof schemaEdicao>
  const sessao = await fotografiaService().atualizarStatusEdicao(c.req.param('sessaoId') as string, percentual)
  return c.json(sessao, 200)
})

router.post('/sessoes/:sessaoId/favoritas', ...protegido, validarUuidParam('sessaoId'), validar(schemaFavoritas), async (c) => {
  const { fotosIds } = c.get('dadosValidados') as z.infer<typeof schemaFavoritas>
  const quantidade = await fotografiaService().marcarFotosClienteMelhorEs(c.req.param('sessaoId') as string, fotosIds)
  return c.json({ quantidade }, 200)
})

router.post('/sessoes/:sessaoId/galeria', ...protegido, validarUuidParam('sessaoId'), validar(schemaGaleria), async (c) => {
  const { diasValidade } = c.get('dadosValidados') as z.infer<typeof schemaGaleria>
  const galeria = await fotografiaService().entregarGaleriaPrivada(c.req.param('sessaoId') as string, diasValidade)
  return c.json(galeria, 201)
})

router.post('/sessoes/:sessaoId/portfolio', ...protegido, validarUuidParam('sessaoId'), validar(schemaPortfolio), async (c) => {
  const { permissaoCliente } = c.get('dadosValidados') as z.infer<typeof schemaPortfolio>
  const quantidade = await fotografiaService().adicionarAoPortfolio(c.req.param('sessaoId') as string, permissaoCliente)
  return c.json({ quantidade }, 200)
})

router.post('/producoes-video', ...protegido, async (c) => {
  const producao = await fotografiaService().criarProducaoVideo(c.get('usuarioAutenticado').id, await c.req.json())
  return c.json(producao, 201)
})

export default router
