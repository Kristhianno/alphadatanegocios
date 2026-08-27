/**
 * Contrato genérico — espelha a tabela `contratos` (schema_shared.sql).
 * `referenciaTipo`/`referenciaId` apontam pro registro de origem
 * (agendamento, evento, sessão, pedido, chamado...), mas nada aqui
 * ainda cria contratos automaticamente a partir deles — só listagem
 * (isolada por cliente) e assinatura pelo próprio cliente.
 */

import type { TipoNegocio } from './User.js'

export type StatusContrato = 'rascunho' | 'enviado' | 'assinado' | 'cancelado'

export type ReferenciaContrato = 'agendamento' | 'ordem_servico' | 'evento' | 'sessao_foto' | 'pedido_confeitaria' | 'chamado_manutencao'

export interface Contrato {
  id: string
  contaId: string
  tipoNegocio: TipoNegocio
  clienteId: string
  referenciaTipo: ReferenciaContrato
  referenciaId: string
  titulo: string
  conteudo: string | null
  valorTotal: number | null
  status: StatusContrato
  assinadoEm: Date | null
  arquivoPdfUrl: string | null
  metadados: Record<string, unknown>
  criadoEm: Date
  atualizadoEm: Date
}
