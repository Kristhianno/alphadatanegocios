import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { AgendamentoService } from '../../src/services/AgendamentoService.js'
import { TransicaoInvalidaError } from '../../src/models/Agendamento.js'
import { ErroValidacao } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

const CLIENTE_ID_1 = randomUUID()
const CLIENTE_ID_2 = randomUUID()

function prepararConta(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Confeitaria X', tipo_negocio: 'confeitaria', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return { contaId: conta['id'] as string, userId: usuario['id'] as string }
}

describe('AgendamentoService.criarAgendamento', () => {
  it('respeita a validação do vertical (confeitaria exige 24h de antecedência)', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararConta(cliente)
    const service = new AgendamentoService(paraTipado(cliente))

    await expect(
      service.criarAgendamento(userId, 'confeitaria', { clienteId: CLIENTE_ID_1, dataHoraInicio: new Date(Date.now() + 3_600_000).toISOString() })
    ).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('cria com sucesso quando passa na validação do vertical', async () => {
    const cliente = criarClienteFake()
    const { userId, contaId } = prepararConta(cliente)
    const service = new AgendamentoService(paraTipado(cliente))

    const agendamento = await service.criarAgendamento(userId, 'confeitaria', {
      clienteId: CLIENTE_ID_1,
      dataHoraInicio: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    })

    expect(agendamento.status).toBe('agendado')
    expect(agendamento.contaId).toBe(contaId)
  })
})

describe('AgendamentoService.atualizarStatus / confirmarAgendamento / cancelarAgendamento', () => {
  async function criarAgendamentoDeTeste() {
    const cliente = criarClienteFake()
    const { userId } = prepararConta(cliente)
    const service = new AgendamentoService(paraTipado(cliente))
    const agendamento = await service.criarAgendamento(userId, 'confeitaria', {
      clienteId: CLIENTE_ID_1,
      dataHoraInicio: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    })
    return { service, agendamento }
  }

  it('confirmarAgendamento move de agendado pra confirmado', async () => {
    const { service, agendamento } = await criarAgendamentoDeTeste()
    const confirmado = await service.confirmarAgendamento(agendamento.id)
    expect(confirmado.status).toBe('confirmado')
  })

  it('uma transição inválida lança TransicaoInvalidaError (409, não 500 — ver o fix na Tarefa 8)', async () => {
    const { service, agendamento } = await criarAgendamentoDeTeste()
    await expect(service.atualizarStatus(agendamento.id, 'concluido')).rejects.toBeInstanceOf(TransicaoInvalidaError)
  })

  it('cancelarAgendamento exige um motivo não vazio', async () => {
    const { service, agendamento } = await criarAgendamentoDeTeste()
    await expect(service.cancelarAgendamento(agendamento.id, '')).rejects.toBeInstanceOf(ErroValidacao)
    await expect(service.cancelarAgendamento(agendamento.id, '   ')).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('cancelarAgendamento com motivo grava o motivo e muda o status', async () => {
    const { service, agendamento } = await criarAgendamentoDeTeste()
    const cancelado = await service.cancelarAgendamento(agendamento.id, 'Cliente desistiu')
    expect(cancelado.status).toBe('cancelado')
    expect(cancelado.motivoCancelamento).toBe('Cliente desistiu')
  })
})

describe('AgendamentoService.listarAgendamentos', () => {
  it('filtra por status dentro da própria conta do usuário', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararConta(cliente)
    const service = new AgendamentoService(paraTipado(cliente))

    const a1 = await service.criarAgendamento(userId, 'confeitaria', {
      clienteId: CLIENTE_ID_1,
      dataHoraInicio: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    })
    await service.criarAgendamento(userId, 'confeitaria', {
      clienteId: CLIENTE_ID_2,
      dataHoraInicio: new Date(Date.now() + 72 * 3_600_000).toISOString(),
    })
    await service.confirmarAgendamento(a1.id)

    const confirmados = await service.listarAgendamentos(userId, { status: 'confirmado' })
    expect(confirmados).toHaveLength(1)
    expect(confirmados[0]?.id).toBe(a1.id)
  })
})
