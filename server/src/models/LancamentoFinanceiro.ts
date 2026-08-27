/**
 * Lançamento financeiro genérico — espelha a tabela
 * `lancamentos_financeiros` (schema_financeiro.sql). `referenciaTipo`/
 * `referenciaId` são opcionais: um lançamento pode nascer vinculado a
 * um registro de origem (evento, chamado, contrato...) ou ser avulso.
 * Módulo restrito à equipe interna (admin/gestor) — não é exposto ao
 * portal do cliente.
 */

export type TipoLancamentoFinanceiro = 'receita' | 'despesa'
export type StatusLancamentoFinanceiro = 'pendente' | 'pago' | 'cancelado'

export interface LancamentoFinanceiro {
  id: string
  contaId: string
  tipo: TipoLancamentoFinanceiro
  categoria: string | null
  descricao: string
  valor: number
  referenciaTipo: string | null
  referenciaId: string | null
  status: StatusLancamentoFinanceiro
  dataPrevista: Date | null
  dataPagamento: Date | null
  criadoEm: Date
  atualizadoEm: Date
}
