import type { Cliente } from '../config/database.config.js'
import type { Lead } from '../models/Lead.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class LeadRepository extends Repository<Lead> {
  constructor(client: Cliente) {
    super(client, 'leads')
  }

  protected paraDominio(linha: LinhaBanco): Lead {
    return {
      id: linha['id'] as string,
      nome: linha['nome'] as string,
      email: linha['email'] as string,
      origem: linha['origem'] as string,
      criadoEm: new Date(linha['criado_em'] as string),
    }
  }

  protected paraLinha(dados: Partial<Lead>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados.nome !== undefined) linha['nome'] = dados.nome
    if (dados.email !== undefined) linha['email'] = dados.email
    if (dados.origem !== undefined) linha['origem'] = dados.origem
    return linha
  }
}
