import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { AgendamentoService } from '../services/AgendamentoService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import { ErroProibido } from '../errors/AppError.js'
import type { FiltrosAgendamento } from '../services/AgendamentoService.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function agendamentoService() { return new AgendamentoService(getSupabase()) }

const schemaFiltros = z.object({
  status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado']).optional(),
  clienteId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
})

const schemaCancelar = z.object({ motivo: z.string().trim().min(1, 'Informe o motivo do cancelamento.') })
const schemaStatus = z.object({ status: z.enum(['agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado']) })

const protegido = [autenticar, carregarContexto] as const

router.post('/', ...protegido, async (c) => {
  const conta = c.get('conta')
  if (!conta.tipoNegocio) {
    throw new ErroProibido('Selecione o tipo de negócio da conta antes de criar agendamentos.')
  }
  const agendamento = await agendamentoService().criarAgendamento(c.get('usuarioAutenticado').id, conta.tipoNegocio, await c.req.json())
  return c.json(agendamento, 201)
})

router.get('/', ...protegido, validar(schemaFiltros, 'query'), async (c) => {
  const filtros = c.get('dadosValidados') as FiltrosAgendamento
  const agendamentos = await agendamentoService().listarAgendamentos(c.get('usuarioAutenticado').id, filtros)
  return c.json(agendamentos, 200)
})

router.patch('/:id/status', ...protegido, validarUuidParam('id'), validar(schemaStatus), async (c) => {
  const { status } = c.get('dadosValidados') as z.infer<typeof schemaStatus>
  const agendamento = await agendamentoService().atualizarStatus(c.req.param('id') as string, status)
  return c.json(agendamento, 200)
})

router.post('/:id/confirmar', ...protegido, validarUuidParam('id'), async (c) => {
  const agendamento = await agendamentoService().confirmarAgendamento(c.req.param('id') as string)
  return c.json(agendamento, 200)
})

router.post('/:id/cancelar', ...protegido, validarUuidParam('id'), validar(schemaCancelar), async (c) => {
  const { motivo } = c.get('dadosValidados') as z.infer<typeof schemaCancelar>
  const agendamento = await agendamentoService().cancelarAgendamento(c.req.param('id') as string, motivo)
  return c.json(agendamento, 200)
})

export default router
