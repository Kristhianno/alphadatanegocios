import type { Cliente } from '../config/database.config.js'
import type { Conta } from '../models/User.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class ContaRepository extends Repository<Conta> {
  constructor(client: Cliente) {
    super(client, 'contas')
  }

  protected paraDominio(linha: LinhaBanco): Conta {
    return {
      id: linha['id'] as string,
      nomeEmpresa: linha['nome_empresa'] as string,
      tipoNegocio: (linha['tipo_negocio'] as Conta['tipoNegocio']) ?? null,
      plano: linha['plano'] as Conta['plano'],
      status: linha['status'] as Conta['status'],
      configuracoesGerais: (linha['configuracoes_gerais'] as Record<string, unknown>) ?? {},
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
  }

  protected paraLinha(dados: Partial<Conta>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados.nomeEmpresa !== undefined) linha['nome_empresa'] = dados.nomeEmpresa
    if (dados.tipoNegocio !== undefined) linha['tipo_negocio'] = dados.tipoNegocio
    if (dados.plano !== undefined) linha['plano'] = dados.plano
    if (dados.status !== undefined) linha['status'] = dados.status
    if (dados.configuracoesGerais !== undefined) linha['configuracoes_gerais'] = dados.configuracoesGerais
    return linha
  }
}
