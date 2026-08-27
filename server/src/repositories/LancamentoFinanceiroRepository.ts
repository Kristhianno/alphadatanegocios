import type { Cliente } from '../config/database.config.js'
import type { LancamentoFinanceiro } from '../models/LancamentoFinanceiro.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class LancamentoFinanceiroRepository extends Repository<LancamentoFinanceiro> {
  constructor(client: Cliente) {
    super(client, 'lancamentos_financeiros')
  }

  protected paraDominio(linha: LinhaBanco): LancamentoFinanceiro {
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      tipo: linha['tipo'] as LancamentoFinanceiro['tipo'],
      categoria: (linha['categoria'] as string) ?? null,
      descricao: linha['descricao'] as string,
      valor: Number(linha['valor']),
      referenciaTipo: (linha['referencia_tipo'] as string) ?? null,
      referenciaId: (linha['referencia_id'] as string) ?? null,
      status: linha['status'] as LancamentoFinanceiro['status'],
      dataPrevista: linha['data_prevista'] ? new Date(linha['data_prevista'] as string) : null,
      dataPagamento: linha['data_pagamento'] ? new Date(linha['data_pagamento'] as string) : null,
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados['contaId'] !== undefined) linha['conta_id'] = dados['contaId']
    if (dados['tipo'] !== undefined) linha['tipo'] = dados['tipo']
    if (dados['categoria'] !== undefined) linha['categoria'] = dados['categoria']
    if (dados['descricao'] !== undefined) linha['descricao'] = dados['descricao']
    if (dados['valor'] !== undefined) linha['valor'] = dados['valor']
    if (dados['referenciaTipo'] !== undefined) linha['referencia_tipo'] = dados['referenciaTipo']
    if (dados['referenciaId'] !== undefined) linha['referencia_id'] = dados['referenciaId']
    if (dados['status'] !== undefined) linha['status'] = dados['status']
    if (dados['dataPrevista'] !== undefined) {
      linha['data_prevista'] = dados['dataPrevista'] ? (dados['dataPrevista'] as Date).toISOString().slice(0, 10) : null
    }
    if (dados['dataPagamento'] !== undefined) {
      linha['data_pagamento'] = dados['dataPagamento'] ? (dados['dataPagamento'] as Date).toISOString().slice(0, 10) : null
    }
    return linha
  }
}
