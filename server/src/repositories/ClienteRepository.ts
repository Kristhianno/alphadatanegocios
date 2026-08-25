import type { Cliente } from '../config/database.config.js'
import type { ClienteFinal } from '../models/ClienteFinal.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class ClienteRepository extends Repository<ClienteFinal> {
  constructor(client: Cliente) {
    super(client, 'clientes')
  }

  protected paraDominio(linha: LinhaBanco): ClienteFinal {
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      nome: linha['nome'] as string,
      email: (linha['email'] as string) ?? null,
      telefone: (linha['telefone'] as string) ?? null,
      documento: (linha['documento'] as string) ?? null,
      endereco: (linha['endereco'] as string) ?? null,
      cidade: (linha['cidade'] as string) ?? null,
      estado: (linha['estado'] as string) ?? null,
      ativo: linha['ativo'] as boolean,
      metadados: (linha['metadados'] as Record<string, unknown>) ?? {},
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados['contaId'] !== undefined) linha['conta_id'] = dados['contaId']
    if (dados['nome'] !== undefined) linha['nome'] = dados['nome']
    if (dados['email'] !== undefined) linha['email'] = dados['email']
    if (dados['telefone'] !== undefined) linha['telefone'] = dados['telefone']
    if (dados['documento'] !== undefined) linha['documento'] = dados['documento']
    if (dados['endereco'] !== undefined) linha['endereco'] = dados['endereco']
    if (dados['cidade'] !== undefined) linha['cidade'] = dados['cidade']
    if (dados['estado'] !== undefined) linha['estado'] = dados['estado']
    if (dados['ativo'] !== undefined) linha['ativo'] = dados['ativo']
    if (dados['metadados'] !== undefined) linha['metadados'] = dados['metadados']
    return linha
  }
}
