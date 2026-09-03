import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { AgendamentoService } from '../../src/services/AgendamentoService.js'
import { AgendamentoConflitanteError, TransicaoInvalidaError } from '../../src/models/Agendamento.js'
import { ErroValidacao } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

const CLIENTE_ID_1 = randomUUID()
const CLIENTE_ID_2 = randomUUID()

function prepararConta(cliente: ReturnType<typeof criarClienteFake>, tipoNegocio: string = 'confeitaria') {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Confeitaria X', tipo_negocio: tipoNegocio, plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return { contaId: conta['id'] as string, userId: usuario['id'] as string }
}

function prepararUsuarioCliente(cliente: ReturnType<typeof criarClienteFake>, contaId: string, clienteId: string) {
  const usuario = cliente.semear('usuarios', [
    { conta_id: contaId, email: `${clienteId}@x.com`, senha_hash: 'h', nome: 'Cliente', papel: 'cliente', cliente_id: clienteId, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
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

  it('um usuário papel "cliente" só vê os próprios agendamentos, mesmo pedindo todos', async () => {
    const cliente = criarClienteFake()
    const { userId: userIdAdmin, contaId } = prepararConta(cliente)
    const service = new AgendamentoService(paraTipado(cliente))

    const meu = await service.criarAgendamento(userIdAdmin, 'confeitaria', {
      clienteId: CLIENTE_ID_1,
      dataHoraInicio: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    })
    await service.criarAgendamento(userIdAdmin, 'confeitaria', {
      clienteId: CLIENTE_ID_2,
      dataHoraInicio: new Date(Date.now() + 72 * 3_600_000).toISOString(),
    })

    const userIdCliente = prepararUsuarioCliente(cliente, contaId, CLIENTE_ID_1)
    const meus = await service.listarAgendamentos(userIdCliente)
    expect(meus).toHaveLength(1)
    expect(meus[0]?.id).toBe(meu.id)
  })

  it('um usuário papel "cliente" não consegue ver agendamentos de outro cliente forçando clienteId no filtro', async () => {
    const cliente = criarClienteFake()
    const { userId: userIdAdmin, contaId } = prepararConta(cliente)
    const service = new AgendamentoService(paraTipado(cliente))

    await service.criarAgendamento(userIdAdmin, 'confeitaria', {
      clienteId: CLIENTE_ID_2,
      dataHoraInicio: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    })

    const userIdCliente = prepararUsuarioCliente(cliente, contaId, CLIENTE_ID_1)
    const resultado = await service.listarAgendamentos(userIdCliente, { clienteId: CLIENTE_ID_2 })
    expect(resultado).toHaveLength(0)
  })

  it('um login "cliente" sem clienteId vinculado não vê nenhum agendamento', async () => {
    const cliente = criarClienteFake()
    const { userId: userIdAdmin, contaId } = prepararConta(cliente)
    const service = new AgendamentoService(paraTipado(cliente))
    await service.criarAgendamento(userIdAdmin, 'confeitaria', {
      clienteId: CLIENTE_ID_1,
      dataHoraInicio: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    })

    const usuarioSemCliente = cliente.semear('usuarios', [
      { conta_id: contaId, email: 'sem-cliente@x.com', senha_hash: 'h', nome: 'Cliente', papel: 'cliente', cliente_id: null, status: 'ativo' },
    ])[0]!
    const resultado = await service.listarAgendamentos(usuarioSemCliente['id'] as string)
    expect(resultado).toHaveLength(0)
  })
})

function semearServico(cliente: ReturnType<typeof criarClienteFake>, contaId: string, duracaoEstimadaMinutos: number | null = null) {
  return cliente.semear('servicos', [
    { conta_id: contaId, tipo_negocio: 'salao_festas', nome: 'Pacote Padrão', duracao_estimada_minutos: duracaoEstimadaMinutos, ativo: true, metadados: {} },
  ])[0]!['id'] as string
}

describe('AgendamentoService.criarAgendamento — conflito de horário', () => {
  it('salão de festas rejeita um segundo evento sobreposto no mesmo espaço (409)', async () => {
    const cliente = criarClienteFake()
    const { userId, contaId } = prepararConta(cliente, 'salao_festas')
    const service = new AgendamentoService(paraTipado(cliente))
    const servicoId = semearServico(cliente, contaId)
    const inicio = new Date(Date.now() + 72 * 3_600_000)

    await service.criarAgendamento(userId, 'salao_festas', {
      clienteId: CLIENTE_ID_1,
      servicoId,
      dataHoraInicio: inicio.toISOString(),
      dataHoraFim: new Date(inicio.getTime() + 4 * 3_600_000).toISOString(),
    })

    await expect(
      service.criarAgendamento(userId, 'salao_festas', {
        clienteId: CLIENTE_ID_2,
        servicoId,
        // 1h depois do início do primeiro evento, ainda dentro das 4h de duração dele — sobreposição.
        dataHoraInicio: new Date(inicio.getTime() + 3_600_000).toISOString(),
        dataHoraFim: new Date(inicio.getTime() + 5 * 3_600_000).toISOString(),
      })
    ).rejects.toBeInstanceOf(AgendamentoConflitanteError)
  })

  it('salão de festas aceita um segundo evento em horário livre no mesmo dia', async () => {
    const cliente = criarClienteFake()
    const { userId, contaId } = prepararConta(cliente, 'salao_festas')
    const service = new AgendamentoService(paraTipado(cliente))
    const servicoId = semearServico(cliente, contaId)
    const inicio = new Date(Date.now() + 72 * 3_600_000)

    await service.criarAgendamento(userId, 'salao_festas', {
      clienteId: CLIENTE_ID_1,
      servicoId,
      dataHoraInicio: inicio.toISOString(),
      dataHoraFim: new Date(inicio.getTime() + 4 * 3_600_000).toISOString(),
    })

    const segundo = await service.criarAgendamento(userId, 'salao_festas', {
      clienteId: CLIENTE_ID_2,
      servicoId,
      dataHoraInicio: new Date(inicio.getTime() + 6 * 3_600_000).toISOString(), // começa depois do primeiro terminar
      dataHoraFim: new Date(inicio.getTime() + 8 * 3_600_000).toISOString(),
    })
    expect(segundo.status).toBe('agendado')
  })

  it('confeitaria aceita dois pedidos no mesmo horário de entrega (vertical não exige exclusividade)', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararConta(cliente, 'confeitaria')
    const service = new AgendamentoService(paraTipado(cliente))
    const inicio = new Date(Date.now() + 48 * 3_600_000).toISOString()

    await service.criarAgendamento(userId, 'confeitaria', { clienteId: CLIENTE_ID_1, dataHoraInicio: inicio })
    const segundo = await service.criarAgendamento(userId, 'confeitaria', { clienteId: CLIENTE_ID_2, dataHoraInicio: inicio })

    expect(segundo.status).toBe('agendado')
  })

  it('dois agendamentos "instantâneos" (sem serviço nem dataHoraFim) no mesmo minuto ainda conflitam num vertical exclusivo', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararConta(cliente, 'manutencao')
    const service = new AgendamentoService(paraTipado(cliente))
    const inicio = new Date(Date.now() + 6 * 3_600_000).toISOString()

    await service.criarAgendamento(userId, 'manutencao', { clienteId: CLIENTE_ID_1, dataHoraInicio: inicio })
    await expect(service.criarAgendamento(userId, 'manutencao', { clienteId: CLIENTE_ID_2, dataHoraInicio: inicio })).rejects.toBeInstanceOf(
      AgendamentoConflitanteError
    )
  })

  it('calcula dataHoraFim a partir da duração do serviço quando não informada', async () => {
    const cliente = criarClienteFake()
    const { userId, contaId } = prepararConta(cliente, 'salao_festas')
    const service = new AgendamentoService(paraTipado(cliente))
    const servicoId = semearServico(cliente, contaId, 180)
    const inicio = new Date(Date.now() + 72 * 3_600_000)

    const agendamento = await service.criarAgendamento(userId, 'salao_festas', {
      clienteId: CLIENTE_ID_1,
      servicoId,
      dataHoraInicio: inicio.toISOString(),
    })

    expect(agendamento.dataHoraFim?.getTime()).toBe(inicio.getTime() + 180 * 60_000)
  })
})

describe('AgendamentoService.listarDisponibilidade', () => {
  it('devolve só os intervalos ocupados, sem dados do cliente', async () => {
    const cliente = criarClienteFake()
    const { userId, contaId } = prepararConta(cliente, 'salao_festas')
    const service = new AgendamentoService(paraTipado(cliente))
    const servicoId = semearServico(cliente, contaId)
    const inicio = new Date(Date.now() + 72 * 3_600_000)
    const fim = new Date(inicio.getTime() + 4 * 3_600_000)

    await service.criarAgendamento(userId, 'salao_festas', {
      clienteId: CLIENTE_ID_1,
      servicoId,
      dataHoraInicio: inicio.toISOString(),
      dataHoraFim: fim.toISOString(),
    })

    const disponibilidade = await service.listarDisponibilidade(userId, {
      de: new Date(),
      ate: new Date(Date.now() + 30 * 24 * 3_600_000),
    })

    expect(disponibilidade).toEqual([{ inicio: inicio.toISOString(), fim: fim.toISOString() }])
  })
})
