import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { SalaoFestasService } from '../services/tipo-especifico/SalaoFestasService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function salaoFestasService() { return new SalaoFestasService(getSupabase()) }

const schemaEquipe = z.object({ cargo: z.string().trim().min(2), quantidade: z.number().int().positive() })
const schemaFinalizar = z.object({ fotos: z.array(z.string()).default([]) })

const protegido = [autenticar, carregarContexto, exigirTipoNegocio('salao_festas')] as const

router.post('/eventos', ...protegido, async (c) => {
  const evento = await salaoFestasService().criarEvento(c.get('usuarioAutenticado').id, await c.req.json())
  return c.json(evento, 201)
})

router.post('/eventos/:eventoId/equipe', ...protegido, validarUuidParam('eventoId'), validar(schemaEquipe), async (c) => {
  const { cargo, quantidade } = c.get('dadosValidados') as z.infer<typeof schemaEquipe>
  await salaoFestasService().adicionarEquipeEvento(c.req.param('eventoId') as string, cargo, quantidade)
  return c.json({ ok: true }, 201)
})

router.post('/eventos/:eventoId/equipamentos', ...protegido, validarUuidParam('eventoId'), async (c) => {
  await salaoFestasService().adicionarEquipamentoEvento(c.req.param('eventoId') as string, await c.req.json())
  return c.json({ ok: true }, 201)
})

router.post('/eventos/:eventoId/confirmar-equipe', ...protegido, validarUuidParam('eventoId'), async (c) => {
  const confirmados = await salaoFestasService().confirmarEquipesEvento(c.req.param('eventoId') as string)
  return c.json({ confirmados }, 200)
})

router.post('/eventos/:eventoId/checklist', ...protegido, validarUuidParam('eventoId'), async (c) => {
  const evento = await salaoFestasService().gerarChecklistEvento(c.req.param('eventoId') as string)
  return c.json(evento, 200)
})

router.post('/eventos/:eventoId/finalizar', ...protegido, validarUuidParam('eventoId'), validar(schemaFinalizar), async (c) => {
  const { fotos } = c.get('dadosValidados') as z.infer<typeof schemaFinalizar>
  const evento = await salaoFestasService().finalizarEvento(c.req.param('eventoId') as string, fotos)
  return c.json(evento, 200)
})

router.get('/eventos/:eventoId/lucro', ...protegido, validarUuidParam('eventoId'), async (c) => {
  const lucro = await salaoFestasService().calcularLucroEvento(c.req.param('eventoId') as string)
  return c.json({ lucro }, 200)
})

export default router
