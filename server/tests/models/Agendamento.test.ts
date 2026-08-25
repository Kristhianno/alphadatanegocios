import { describe, expect, it } from 'vitest'
import {
  calcularDuracaoMinutos,
  podeTransicionar,
  transicionarStatus,
  TransicaoInvalidaError,
  validarAgendamento,
  type Agendamento,
  type NovoAgendamentoInput,
} from '../../src/models/Agendamento.js'
import { AppError } from '../../src/errors/AppError.js'

function agendamentoBase(overrides: Partial<Agendamento> = {}): Agendamento {
  return {
    id: 'ag-1',
    contaId: 'conta-1',
    tipoNegocio: 'outro',
    clienteId: 'cliente-1',
    servicoId: null,
    responsavelId: null,
    dataHoraInicio: new Date('2026-09-01T10:00:00Z'),
    dataHoraFim: null,
    status: 'agendado',
    endereco: null,
    valorEstimado: null,
    observacoes: null,
    motivoCancelamento: null,
    metadados: {},
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    ...overrides,
  }
}

describe('calcularDuracaoMinutos', () => {
  it('calcula pela diferença quando há dataHoraFim', () => {
    const minutos = calcularDuracaoMinutos({
      dataHoraInicio: new Date('2026-09-01T10:00:00Z'),
      dataHoraFim: new Date('2026-09-01T11:30:00Z'),
    })
    expect(minutos).toBe(90)
  })

  it('cai pra duração estimada do serviço quando não há dataHoraFim', () => {
    const minutos = calcularDuracaoMinutos({ dataHoraInicio: new Date(), dataHoraFim: null }, 45)
    expect(minutos).toBe(45)
  })

  it('retorna null quando não há fim nem estimativa', () => {
    const minutos = calcularDuracaoMinutos({ dataHoraInicio: new Date(), dataHoraFim: null })
    expect(minutos).toBeNull()
  })
})

describe('máquina de estados de status', () => {
  it('permite as transições documentadas', () => {
    expect(podeTransicionar('agendado', 'confirmado')).toBe(true)
    expect(podeTransicionar('confirmado', 'em_andamento')).toBe(true)
    expect(podeTransicionar('em_andamento', 'concluido')).toBe(true)
    expect(podeTransicionar('agendado', 'cancelado')).toBe(true)
  })

  it('rejeita pular etapas ou sair de um estado terminal', () => {
    expect(podeTransicionar('agendado', 'em_andamento')).toBe(false)
    expect(podeTransicionar('agendado', 'concluido')).toBe(false)
    expect(podeTransicionar('concluido', 'cancelado')).toBe(false)
    expect(podeTransicionar('cancelado', 'agendado')).toBe(false)
  })

  it('transicionarStatus aplica a transição válida e atualiza atualizadoEm', () => {
    const original = agendamentoBase({ status: 'agendado' })
    const atualizado = transicionarStatus(original, 'confirmado')
    expect(atualizado.status).toBe('confirmado')
    expect(atualizado.atualizadoEm.getTime()).toBeGreaterThanOrEqual(original.atualizadoEm.getTime())
  })

  it('transicionarStatus lança TransicaoInvalidaError (que agora é um AppError 409) numa transição inválida', () => {
    const original = agendamentoBase({ status: 'concluido' })
    expect(() => transicionarStatus(original, 'cancelado')).toThrow(TransicaoInvalidaError)
    try {
      transicionarStatus(original, 'cancelado')
      expect.unreachable()
    } catch (erro) {
      expect(erro).toBeInstanceOf(AppError)
      expect((erro as AppError).statusCode).toBe(409)
      expect((erro as AppError).codigo).toBe('CONFLITO')
    }
  })
})

describe('validarAgendamento — Strategy por vertical', () => {
  function input(overrides: Partial<NovoAgendamentoInput> = {}): NovoAgendamentoInput {
    return { contaId: 'c1', tipoNegocio: 'outro', clienteId: 'cl1', dataHoraInicio: new Date(Date.now() + 3_600_000), ...overrides }
  }

  it('confeitaria exige 24h de antecedência', () => {
    const erros = validarAgendamento(input({ tipoNegocio: 'confeitaria', dataHoraInicio: new Date(Date.now() + 3_600_000) }))
    expect(erros).toHaveLength(1)
    expect(erros[0]?.campo).toBe('dataHoraInicio')
  })

  it('confeitaria aceita com 48h de antecedência', () => {
    const erros = validarAgendamento(input({ tipoNegocio: 'confeitaria', dataHoraInicio: new Date(Date.now() + 48 * 3_600_000) }))
    expect(erros).toHaveLength(0)
  })

  it('salão de festas exige servicoId e data futura', () => {
    const erros = validarAgendamento(input({ tipoNegocio: 'salao_festas', dataHoraInicio: new Date(Date.now() - 1000) }))
    expect(erros.map((e) => e.campo).sort()).toEqual(['dataHoraInicio', 'servicoId'])
  })

  it('fotografia rejeita horário fora de 08h–20h', () => {
    const foraDoExpediente = new Date()
    foraDoExpediente.setHours(22, 0, 0, 0)
    const erros = validarAgendamento(input({ tipoNegocio: 'fotografia_video', dataHoraInicio: foraDoExpediente }))
    expect(erros).toHaveLength(1)
  })

  it('manutenção urgente exige atendimento em até 4h', () => {
    const erros = validarAgendamento(
      input({ tipoNegocio: 'manutencao', dataHoraInicio: new Date(Date.now() + 6 * 3_600_000), metadados: { prioridade: 'urgente' } })
    )
    expect(erros).toHaveLength(1)
  })

  it('dataHoraFim antes de dataHoraInicio é sempre inválido, em qualquer vertical', () => {
    const inicio = new Date(Date.now() + 48 * 3_600_000)
    const fim = new Date(inicio.getTime() - 1000)
    const erros = validarAgendamento(input({ tipoNegocio: 'confeitaria', dataHoraInicio: inicio, dataHoraFim: fim }))
    expect(erros.some((e) => e.campo === 'dataHoraFim')).toBe(true)
  })
})
