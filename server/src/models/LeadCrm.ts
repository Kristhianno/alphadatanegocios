/** Lead do CRM em kanban de uma conta (tabela `crm_leads`, plano Completo). */
export const ETAPAS_LEAD = ['novo', 'primeiro_contato', 'follow_up', 'concluido'] as const
export type EtapaLead = (typeof ETAPAS_LEAD)[number]

export const ORIGENS_LEAD = ['whatsapp', 'instagram', 'indicacao', 'site', 'telefone', 'outro'] as const
export type OrigemLead = (typeof ORIGENS_LEAD)[number]

export type ResultadoLead = 'ganho' | 'perdido'

export interface LeadCrm {
  id: string
  contaId: string
  nome: string
  telefone: string | null
  email: string | null
  tipoEvento: string | null
  /** Data da festa, `YYYY-MM-DD`. */
  dataEvento: string | null
  convidados: number | null
  valorEstimado: number | null
  origem: OrigemLead
  etapa: EtapaLead
  /** Só em 'concluido': fechou (ganho) ou não (perdido). */
  resultado: ResultadoLead | null
  observacoes: string | null
  /** Ordem do card dentro da coluna (menor = mais acima). */
  posicao: number
  ultimoContatoEm: Date | null
  criadoEm: Date
  atualizadoEm: Date
}
