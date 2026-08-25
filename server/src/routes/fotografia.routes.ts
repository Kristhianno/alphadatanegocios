import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/database.config.js'
import { FotografiaService } from '../services/tipo-especifico/FotografiaService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'

const router = Router()
const fotografiaService = new FotografiaService(supabase)

const schemaFotos = z.object({ fotos: z.array(z.string()).min(1, 'Envie ao menos uma foto.') })
const schemaEdicao = z.object({ percentual: z.number().min(0).max(100) })
const schemaFavoritas = z.object({ fotosIds: z.array(z.string().uuid()).min(1, 'Selecione ao menos uma foto.') })
const schemaGaleria = z.object({ diasValidade: z.number().int().positive() })
const schemaPortfolio = z.object({ permissaoCliente: z.boolean() })

router.use(autenticar, carregarContexto, exigirTipoNegocio('fotografia_video'))

router.post('/sessoes', async (req, res) => {
  const sessao = await fotografiaService.criarSessaoFoto(req.usuarioAutenticado!.id, req.body)
  res.status(201).json(sessao)
})

router.post('/sessoes/:sessaoId/fotos', validarUuidParam('sessaoId'), validar(schemaFotos), async (req, res) => {
  const { fotos } = req.dadosValidados as z.infer<typeof schemaFotos>
  const quantidade = await fotografiaService.uploadFotosOriginal(req.params['sessaoId'] as string, fotos)
  res.status(201).json({ quantidade })
})

router.patch('/sessoes/:sessaoId/edicao', validarUuidParam('sessaoId'), validar(schemaEdicao), async (req, res) => {
  const { percentual } = req.dadosValidados as z.infer<typeof schemaEdicao>
  const sessao = await fotografiaService.atualizarStatusEdicao(req.params['sessaoId'] as string, percentual)
  res.status(200).json(sessao)
})

router.post('/sessoes/:sessaoId/favoritas', validarUuidParam('sessaoId'), validar(schemaFavoritas), async (req, res) => {
  const { fotosIds } = req.dadosValidados as z.infer<typeof schemaFavoritas>
  const quantidade = await fotografiaService.marcarFotosClienteMelhorEs(req.params['sessaoId'] as string, fotosIds)
  res.status(200).json({ quantidade })
})

router.post('/sessoes/:sessaoId/galeria', validarUuidParam('sessaoId'), validar(schemaGaleria), async (req, res) => {
  const { diasValidade } = req.dadosValidados as z.infer<typeof schemaGaleria>
  const galeria = await fotografiaService.entregarGaleriaPrivada(req.params['sessaoId'] as string, diasValidade)
  res.status(201).json(galeria)
})

router.post('/sessoes/:sessaoId/portfolio', validarUuidParam('sessaoId'), validar(schemaPortfolio), async (req, res) => {
  const { permissaoCliente } = req.dadosValidados as z.infer<typeof schemaPortfolio>
  const quantidade = await fotografiaService.adicionarAoPortfolio(req.params['sessaoId'] as string, permissaoCliente)
  res.status(200).json({ quantidade })
})

router.post('/producoes-video', async (req, res) => {
  const producao = await fotografiaService.criarProducaoVideo(req.usuarioAutenticado!.id, req.body)
  res.status(201).json(producao)
})

export default router
