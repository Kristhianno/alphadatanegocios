import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/database.config.js'
import { ServicoService } from '../services/ServicoService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import { ErroProibido } from '../errors/AppError.js'

const router = Router()
const servicoService = new ServicoService(supabase)

const schemaFiltros = z.object({
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

router.use(autenticar, carregarContexto)

router.post('/', async (req, res) => {
  if (!req.conta!.tipoNegocio) {
    throw new ErroProibido('Selecione o tipo de negócio da conta antes de cadastrar serviços.')
  }
  const servico = await servicoService.criarServico(req.usuarioAutenticado!.id, req.conta!.tipoNegocio, req.body)
  res.status(201).json(servico)
})

router.get('/', validar(schemaFiltros, 'query'), async (req, res) => {
  const filtros = req.dadosValidados as { ativo?: boolean }
  const servicos = await servicoService.listarServicos(req.usuarioAutenticado!.id, filtros)
  res.status(200).json(servicos)
})

router.patch('/:id', validarUuidParam('id'), async (req, res) => {
  const servico = await servicoService.atualizarServico(req.params['id'] as string, req.body)
  res.status(200).json(servico)
})

router.delete('/:id', validarUuidParam('id'), async (req, res) => {
  await servicoService.deletarServico(req.params['id'] as string)
  res.status(204).send()
})

router.post('/:id/ativar', validarUuidParam('id'), async (req, res) => {
  const servico = await servicoService.ativarServico(req.params['id'] as string)
  res.status(200).json(servico)
})

router.post('/:id/desativar', validarUuidParam('id'), async (req, res) => {
  const servico = await servicoService.desativarServico(req.params['id'] as string)
  res.status(200).json(servico)
})

export default router
