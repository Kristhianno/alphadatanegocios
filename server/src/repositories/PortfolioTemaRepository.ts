import type { Cliente } from '../config/database.config.js'
import type { TipoPortfolio } from '../models/PortfolioItem.js'
import { ErroPersistencia } from '../errors/AppError.js'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Temas dos materiais prontos (tabela `portfolio_temas`). Só nomes: os arquivos se ligam por arquivos.tema. */
export class PortfolioTemaRepository {
  private readonly client: SupabaseClient
  constructor(client: Cliente) {
    this.client = client as unknown as SupabaseClient
  }

  async listar(contaId: string, tipo: TipoPortfolio): Promise<string[]> {
    const { data, error } = await this.client
      .from('portfolio_temas')
      .select('nome')
      .eq('conta_id', contaId)
      .eq('tipo', tipo)
      .order('criado_em', { ascending: true })
    if (error) throw new ErroPersistencia('portfolio_temas', 'listar', error)
    return (data ?? []).map((l) => (l as { nome: string }).nome)
  }

  /** Cria se ainda não existe um tema com esse nome (sem diferenciar maiúsculas). Devolve o nome que ficou salvo. */
  async garantir(contaId: string, tipo: TipoPortfolio, nome: string): Promise<string> {
    const existente = (await this.listar(contaId, tipo)).find((n) => n.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'))
    if (existente) return existente
    const { error } = await this.client.from('portfolio_temas').insert({ conta_id: contaId, tipo, nome })
    if (error && error.code !== '23505') throw new ErroPersistencia('portfolio_temas', 'garantir', error)
    return nome
  }

  async remover(contaId: string, tipo: TipoPortfolio, nome: string): Promise<void> {
    const { error } = await this.client.from('portfolio_temas').delete().eq('conta_id', contaId).eq('tipo', tipo).eq('nome', nome)
    if (error) throw new ErroPersistencia('portfolio_temas', 'remover', error)
  }
}
