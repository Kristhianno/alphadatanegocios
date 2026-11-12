import type { Cliente } from '../config/database.config.js'
import type { PortfolioItem } from '../models/PortfolioItem.js'
import { Repository, type LinhaBanco } from './Repository.js'

const CAMPOS: Record<string, string> = {
  contaId: 'conta_id',
  tipo: 'tipo',
  nome: 'nome',
  descricao: 'descricao',
  preco: 'preco',
  capacidade: 'capacidade',
  itensInclusos: 'itens_inclusos',
  ativo: 'ativo',
}

export class PortfolioRepository extends Repository<PortfolioItem> {
  constructor(client: Cliente) {
    super(client, 'portfolio_itens')
  }

  protected paraDominio(linha: LinhaBanco): PortfolioItem {
    const numero = (v: unknown) => (v === null || v === undefined ? null : Number(v))
    const inclusos = linha['itens_inclusos']
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      tipo: linha['tipo'] as PortfolioItem['tipo'],
      nome: linha['nome'] as string,
      descricao: (linha['descricao'] as string) ?? null,
      preco: numero(linha['preco']),
      capacidade: numero(linha['capacidade']),
      itensInclusos: Array.isArray(inclusos) ? (inclusos as string[]) : [],
      ativo: (linha['ativo'] as boolean) ?? true,
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    for (const [campo, coluna] of Object.entries(CAMPOS)) {
      if (dados[campo] !== undefined) linha[coluna] = dados[campo]
    }
    return linha
  }
}
