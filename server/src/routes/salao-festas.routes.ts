import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/database.config.js'
import { SalaoFestasService } from '../services/tipo-especifico/SalaoFestasService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'

const router = Router()
const salaoFestasService = new SalaoFestasService(supabase)

const schemaEquipe = z.object({ cargo: z.string().trim().min(2), quantidade: z.number().int().positive() })
const schemaFinalizar = z.object({ fotos: z.array(z.string()).default([]) })

router.use(autenticar, carregarContexto, exigirTipoNegocio('salao_festas'))

router.post('/eventos', async (req, res) => {
  const evento = await salaoFestasService.criarEvento(req.usuarioAutenticado!.id, req.body)
  res.status(201).json(evento)
})

router.post('/eventos/:eventoId/equipe', validarUuidParam('eventoId'), validar(schemaEquipe), async (req, res) => {
  const { cargo, quantidade } = req.dadosValidados as z.infer<typeof schemaEquipe>
  await salaoFestasService.adicionarEquipeEvento(req.params['eventoId'] as string, cargo, quantidade)
  res.status(201).json({ ok: true })
})

router.post('/eventos/:eventoId/equipamentos', validarUuidParam('eventoId'), async (req, res) => {
  await salaoFestasService.adicionarEquipamentoEvento(req.params['eventoId'] as string, req.body)
  res.status(201).json({ ok: true })
})

router.post('/eventos/:eventoId/confirmar-equipe', validarUuidParam('eventoId'), async (req, res) => {
  const confirmados = await salaoFestasService.confirmarEquipesEvento(req.params['eventoId'] as string)
  res.status(200).json({ confirmados })
})

router.post('/eventos/:eventoId/checklist', validarUuidParam('eventoId'), async (req, res) => {
  const evento = await salaoFestasService.gerarChecklistEvento(req.params['eventoId'] as string)
  res.status(200).json(evento)
})

router.post('/eventos/:eventoId/finalizar', validarUuidParam('eventoId'), validar(schemaFinalizar), async (req, res) => {
  const { fotos } = req.dadosValidados as z.infer<typeof schemaFinalizar>
  const evento = await salaoFestasService.finalizarEvento(req.params['eventoId'] as string, fotos)
  res.status(200).json(evento)
})

router.get('/eventos/:eventoId/lucro', validarUuidParam('eventoId'), async (req, res) => {
  const lucro = await salaoFestasService.calcularLucroEvento(req.params['eventoId'] as string)
  res.status(200).json({ lucro })
})

export default router
