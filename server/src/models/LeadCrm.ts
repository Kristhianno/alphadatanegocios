/** Lead do CRM em kanban de uma conta (tabela `crm_leads`, plano Completo). */
export const ETAPAS_LEAD = ['primeiro_contato', 'follow_up', 'concluido'] as const
export type EtapaLead = (typeof ETAPAS_LEAD)[number]

export const ORIGENS_LEAD = ['whatsapp', 'instagram', 'indicacao', 'site', 'telefone', 'outro'] as const
export type OrigemLead = (typeof ORIGENS_LEAD)[number]

export type ResultadoLead = 'ganho' | 'perdido'

/** Marcos do negócio que liberam o avanço no funil (ver REQUISITOS_ETAPA). */
export const MARCOS_LEAD = ['orcamentoEnviado', 'contratoEnviado', 'contratoAssinado', 'sinalPago'] as const
export type MarcoLead = (typeof MARCOS_LEAD)[number]

export const ROTULO_MARCO: Record<MarcoLead, string> = {
  orcamentoEnviado: 'orçamento enviado',
  contratoEnviado: 'contrato enviado',
  contratoAssinado: 'contrato assinado',
  sinalPago: 'sinal da reserva pago',
}

export const ROTULO_ETAPA: Record<EtapaLead, string> = {
  primeiro_contato: 'Primeiro contato',
  follow_up: 'Follow-up',
  concluido: 'Concluído',
}

/**
 * O que precisa estar cumprido para o lead ESTAR em cada etapa:
 * - Follow-up: o orçamento já foi encaminhado.
 * - Concluído: contrato enviado e assinado e sinal pago (a festa está fechada).
 */
export const REQUISITOS_ETAPA: Record<EtapaLead, readonly MarcoLead[]> = {
  primeiro_contato: [],
  follow_up: ['orcamentoEnviado'],
  concluido: ['orcamentoEnviado', 'contratoEnviado', 'contratoAssinado', 'sinalPago'],
}

export interface LeadCrm {
  id: string
  contaId: string
  nome: string
  telefone: string | null
  email: string | null
  tipoEvento: string | null
  /** Data da festa, `YYYY-MM-DD`. Em 'concluido' fica fechada. */
  dataEvento: string | null
  convidados: number | null
  valorEstimado: number | null
  origem: OrigemLead
  etapa: EtapaLead
  /** 'ganho' quando concluído (festa fechada). */
  resultado: ResultadoLead | null
  observacoes: string | null
  /** Ordem do card dentro da coluna (menor = mais acima). */
  posicao: number
  ultimoContatoEm: Date | null
  orcamentoEnviadoEm: Date | null
  contratoEnviadoEm: Date | null
  contratoAssinadoEm: Date | null
  sinalPagoEm: Date | null
  criadoEm: Date
  atualizadoEm: Date
}

/** Campo de data de cada marco no lead. */
export const CAMPO_MARCO: Record<MarcoLead, 'orcamentoEnviadoEm' | 'contratoEnviadoEm' | 'contratoAssinadoEm' | 'sinalPagoEm'> = {
  orcamentoEnviado: 'orcamentoEnviadoEm',
  contratoEnviado: 'contratoEnviadoEm',
  contratoAssinado: 'contratoAssinadoEm',
  sinalPago: 'sinalPagoEm',
}

/** Marcos que faltam para o lead poder estar na etapa (vazio = pode). */
export function marcosPendentes(lead: Pick<LeadCrm, (typeof CAMPO_MARCO)[MarcoLead]>, etapa: EtapaLead): MarcoLead[] {
  return REQUISITOS_ETAPA[etapa].filter((marco) => !lead[CAMPO_MARCO[marco]])
}
