/**
 * Agendamento genérico. Espelha a tabela `agendamentos`
 * (schema_shared.sql). Validação por vertical usa Strategy pattern
 * (um validador por TipoNegocio) e as transições de status são
 * restritas por uma máquina de estados simples — nenhum service deve
 * fazer `agendamento.status = novoStatus` diretamente.
 */

import type { TipoNegocio } from './User.js'
import { ErroConflito } from '../errors/AppError.js'

export type StatusAgendamento = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'

export interface Agendamento {
  id: string
  contaId: string
  tipoNegocio: TipoNegocio
  clienteId: string
  servicoId: string | null
  /** Técnico/gestor/fotógrafo atribuído. */
  responsavelId: string | null
  dataHoraInicio: Date
  dataHoraFim: Date | null
  status: StatusAgendamento
  endereco: string | null
  valorEstimado: number | null
  observacoes: string | null
  motivoCancelamento: string | null
  metadados: Record<string, unknown>
  criadoEm: Date
  atualizadoEm: Date
}

export type NovoAgendamentoInput = Pick<
  Agendamento,
  'contaId' | 'tipoNegocio' | 'clienteId' | 'dataHoraInicio'
> &
  Partial<Pick<Agendamento, 'servicoId' | 'responsavelId' | 'dataHoraFim' | 'endereco' | 'valorEstimado' | 'observacoes' | 'metadados'>>

// ---------------------------------------------------------------------
// Cálculo de duração
// ---------------------------------------------------------------------

/**
 * Duração em minutos. Usa dataHoraFim quando disponível; caso
 * contrário cai para a duração estimada do serviço vinculado (se
 * informada) — retorna null quando nenhuma das duas está disponível.
 */
export function calcularDuracaoMinutos(
  agendamento: Pick<Agendamento, 'dataHoraInicio' | 'dataHoraFim'>,
  duracaoEstimadaServicoMinutos?: number | null
): number | null {
  if (agendamento.dataHoraFim) {
    const diffMs = agendamento.dataHoraFim.getTime() - agendamento.dataHoraInicio.getTime()
    return Math.round(diffMs / 60_000)
  }
  return duracaoEstimadaServicoMinutos ?? null
}

// ---------------------------------------------------------------------
// Transições de status (máquina de estados)
// ---------------------------------------------------------------------

const TRANSICOES_VALIDAS: Record<StatusAgendamento, readonly StatusAgendamento[]> = {
  agendado: ['confirmado', 'cancelado'],
  confirmado: ['em_andamento', 'cancelado'],
  em_andamento: ['concluido', 'cancelado'],
  concluido: [],
  cancelado: [],
}

/**
 * Estende ErroConflito (não `Error` puro) — sem isso, uma transição
 * inválida vinda de AgendamentoService.atualizarStatus não batia em
 * nenhum branch de erro.middleware.ts (que só reconhece `AppError` e
 * `ZodError`) e virava 500 "erro interno" em vez do 409 que é de fato:
 * o recurso está num estado que conflita com a operação pedida. Achado
 * escrevendo os testes da Tarefa 8, não em produção.
 */
export class TransicaoInvalidaError extends ErroConflito {
  constructor(public readonly de: StatusAgendamento, public readonly para: StatusAgendamento) {
    super(`Transição de status inválida: "${de}" → "${para}".`)
  }
}

export function podeTransicionar(de: StatusAgendamento, para: StatusAgendamento): boolean {
  return TRANSICOES_VALIDAS[de].includes(para)
}

/** Aplica a transição de status, lançando {@link TransicaoInvalidaError} se o par (de, para) não for permitido. */
export function transicionarStatus(agendamento: Agendamento, novoStatus: StatusAgendamento): Agendamento {
  if (!podeTransicionar(agendamento.status, novoStatus)) {
    throw new TransicaoInvalidaError(agendamento.status, novoStatus)
  }
  return { ...agendamento, status: novoStatus, atualizadoEm: new Date() }
}

// ---------------------------------------------------------------------
// Validação por vertical (Strategy pattern)
// ---------------------------------------------------------------------

export interface ErroValidacaoAgendamento {
  campo: string
  mensagem: string
}

interface ValidadorAgendamento {
  validar(agendamento: NovoAgendamentoInput): ErroValidacaoAgendamento[]
}

/** Confeitaria: pedidos precisam de prazo mínimo de produção. */
class ValidadorConfeitaria implements ValidadorAgendamento {
  validar(agendamento: NovoAgendamentoInput): ErroValidacaoAgendamento[] {
    const erros: ErroValidacaoAgendamento[] = []
    const horasAteEntrega = (agendamento.dataHoraInicio.getTime() - Date.now()) / 3_600_000
    if (horasAteEntrega < 24) {
      erros.push({ campo: 'dataHoraInicio', mensagem: 'Pedidos de confeitaria exigem ao menos 24h de antecedência para produção.' })
    }
    return erros
  }
}

/** Salão de festas: evento precisa ter data futura e serviço (pacote) vinculado. */
class ValidadorSalaoFestas implements ValidadorAgendamento {
  validar(agendamento: NovoAgendamentoInput): ErroValidacaoAgendamento[] {
    const erros: ErroValidacaoAgendamento[] = []
    if (!agendamento.servicoId) {
      erros.push({ campo: 'servicoId', mensagem: 'Selecione um pacote para o evento.' })
    }
    if (agendamento.dataHoraInicio.getTime() <= Date.now()) {
      erros.push({ campo: 'dataHoraInicio', mensagem: 'A data do evento deve ser futura.' })
    }
    return erros
  }
}

/** Fotografia/vídeo: sessão precisa de horário dentro do expediente (8h–20h). */
class ValidadorFotografia implements ValidadorAgendamento {
  validar(agendamento: NovoAgendamentoInput): ErroValidacaoAgendamento[] {
    const erros: ErroValidacaoAgendamento[] = []
    const hora = agendamento.dataHoraInicio.getHours()
    if (hora < 8 || hora >= 20) {
      erros.push({ campo: 'dataHoraInicio', mensagem: 'Sessões devem ser agendadas entre 08h e 20h.' })
    }
    return erros
  }
}

/** Manutenção: chamados de emergência não podem ser agendados para o futuro — são atendimento imediato. */
class ValidadorManutencao implements ValidadorAgendamento {
  validar(agendamento: NovoAgendamentoInput): ErroValidacaoAgendamento[] {
    const erros: ErroValidacaoAgendamento[] = []
    const prioridade = agendamento.metadados?.['prioridade']
    const horasAteAtendimento = (agendamento.dataHoraInicio.getTime() - Date.now()) / 3_600_000
    if (prioridade === 'urgente' && horasAteAtendimento > 4) {
      erros.push({ campo: 'dataHoraInicio', mensagem: 'Chamados urgentes devem ser atendidos em até 4h.' })
    }
    return erros
  }
}

class ValidadorPadrao implements ValidadorAgendamento {
  validar(): ErroValidacaoAgendamento[] {
    return []
  }
}

const VALIDADORES: Record<TipoNegocio, ValidadorAgendamento> = {
  confeitaria: new ValidadorConfeitaria(),
  salao_festas: new ValidadorSalaoFestas(),
  fotografia_video: new ValidadorFotografia(),
  manutencao: new ValidadorManutencao(),
  outro: new ValidadorPadrao(),
}

/** Ponto único de validação — dispatcha para a estratégia do vertical em `agendamento.tipoNegocio`. */
export function validarAgendamento(agendamento: NovoAgendamentoInput): ErroValidacaoAgendamento[] {
  const erros: ErroValidacaoAgendamento[] = []
  if (agendamento.dataHoraFim && agendamento.dataHoraFim < agendamento.dataHoraInicio) {
    erros.push({ campo: 'dataHoraFim', mensagem: 'O horário de término não pode ser anterior ao início.' })
  }
  return [...erros, ...VALIDADORES[agendamento.tipoNegocio].validar(agendamento)]
}
