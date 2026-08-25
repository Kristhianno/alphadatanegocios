import type { Cliente } from '../config/database.config.js'
import type { Servico } from '../models/Servico.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class ServicoRepository extends Repository<Servico> {
  constructor(client: Cliente) {
    super(client, 'servicos')
  }

  protected paraDominio(linha: LinhaBanco): Servico {
    const base = {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      nome: linha['nome'] as string,
      descricao: (linha['descricao'] as string) ?? null,
      precoBase: (linha['preco_base'] as number) ?? null,
      duracaoEstimadaMinutos: (linha['duracao_estimada_minutos'] as number) ?? null,
      ativo: linha['ativo'] as boolean,
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
    // O discriminante e os metadados vêm juntos da mesma linha — o cast é
    // seguro porque tipo_negocio e metadados no banco sempre correspondem
    // (constraint de FK garante tipo_negocio válido; a forma do JSON é
    // responsabilidade de quem grava, validada em utils/validadores.ts).
    return { ...base, tipoNegocio: linha['tipo_negocio'], metadados: linha['metadados'] ?? {} } as Servico
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados['contaId'] !== undefined) linha['conta_id'] = dados['contaId']
    if (dados['tipoNegocio'] !== undefined) linha['tipo_negocio'] = dados['tipoNegocio']
    if (dados['nome'] !== undefined) linha['nome'] = dados['nome']
    if (dados['descricao'] !== undefined) linha['descricao'] = dados['descricao']
    if (dados['precoBase'] !== undefined) linha['preco_base'] = dados['precoBase']
    if (dados['duracaoEstimadaMinutos'] !== undefined) linha['duracao_estimada_minutos'] = dados['duracaoEstimadaMinutos']
    if (dados['ativo'] !== undefined) linha['ativo'] = dados['ativo']
    if (dados['metadados'] !== undefined) linha['metadados'] = dados['metadados']
    return linha
  }
}
