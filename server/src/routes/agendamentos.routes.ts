import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/database.config.js'
import { AgendamentoService } from '../services/AgendamentoService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import { ErroProibido } from '../errors/AppError.js'
import type { FiltrosAgendamento } from '../services/AgendamentoService.js'

const router = Router()
const agendamentoService = new AgendamentoService(supabase)

const schemaFiltros = z.object({
  status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado']).optional(),
  clienteId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
})

const schemaCancelar = z.object({ motivo: z.string().trim().min(1, 'Informe o motivo do cancelamento.') })
const schemaStatus = z.object({ status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado']) })

router.use(autenticar, carregarContexto)

router.post('/', async (req, res) => {
  if (!req.conta!.tipoNegocio) {
    throw new ErroProibido('Selecione o tipo de negócio da conta antes de criar agendamentos.')
  }
  const agendamento = await agendamentoService.criarAgendamento(req.usuarioAutenticado!.id, req.conta!.tipoNegocio, req.body)
  res.status(201).json(agendamento)
})

router.get('/', validar(schemaFiltros, 'query'), async (req, res) => {
  const filtros = req.dadosValidados as FiltrosAgendamento
  const agendamentos = await agendamentoService.listarAgendamentos(req.usuarioAutenticado!.id, filtros)
  res.status(200).json(agendamentos)
})

router.patch('/:id/status', validarUuidParam('id'), validar(schemaStatus), async (req, res) => {
  const { status } = req.dadosValidados as z.infer<typeof schemaStatus>
  const agendamento = await agendamentoService.atualizarStatus(req.params['id'] as string, status)
  res.status(200).json(agendamento)
})

router.post('/:id/confirmar', validarUuidParam('id'), async (req, res) => {
  const agendamento = await agendamentoService.confirmarAgendamento(req.params['id'] as string)
  res.status(200).json(agendamento)
})

router.post('/:id/cancelar', validarUuidParam('id'), validar(schemaCancelar), async (req, res) => {
  const { motivo } = req.dadosValidados as z.infer<typeof schemaCancelar>
  const agendamento = await agendamentoService.cancelarAgendamento(req.params['id'] as string, motivo)
  res.status(200).json(agendamento)
})

export default router
