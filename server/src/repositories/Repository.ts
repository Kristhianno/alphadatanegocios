import type { SupabaseClient } from '@supabase/supabase-js'
import { ErroPersistencia } from '../errors/AppError.js'

/** Uma linha crua vinda do Postgres — chaves em snake_case, valores ainda não convertidos. */
export type LinhaBanco = Record<string, unknown>

/**
 * Repository genérico sobre uma tabela Supabase. Cada tabela tem uma
 * subclasse curta que só implementa a conversão linha↔domínio
 * (explícita, não um mapeamento snake↔camel "mágico" — colunas JSONB
 * como `metadados` guardam chaves arbitrárias do usuário que NÃO devem
 * ser recase-adas).
 *
 * Recebe o client tipado com `Database` (para os métodos extras que
 * cada subclasse adiciona, como UsuarioRepository.buscarComCredenciaisPorEmail,
 * poderem usar `.from('usuarios')` com checagem de tipo completa), mas
 * as operações genéricas abaixo usam `this.tabela: string` — o
 * supabase-js não resolve bem `.from()` quando o nome da tabela é um
 * parâmetro de tipo genérico em vez de um literal concreto (testado:
 * produz erros de tipo indecifráveis), então essa camada continua
 * confiando em paraDominio/paraLinha para a correção dos nomes de
 * coluna, como qualquer ORM leve faria.
 */
export abstract class Repository<TDomain extends { id: string }> {
  constructor(protected readonly client: SupabaseClient, protected readonly tabela: string) {}

  protected abstract paraDominio(linha: LinhaBanco): TDomain
  protected abstract paraLinha(dados: Record<string, unknown>): LinhaBanco

  async buscarPorId(id: string): Promise<TDomain | null> {
    const { data, error } = await this.client.from(this.tabela).select('*').eq('id', id).maybeSingle()
    if (error) throw new ErroPersistencia(this.tabela, 'buscarPorId', error)
    return data ? this.paraDominio(data) : null
  }

  /** Filtro simples de igualdade — `{ conta_id: x, status: y }` vira `.eq('conta_id', x).eq('status', y)`. */
  async listar(filtro: LinhaBanco = {}, opcoes?: { ordenarPor?: string; ascendente?: boolean; limite?: number }): Promise<TDomain[]> {
    let query = this.client.from(this.tabela).select('*')
    for (const [campo, valor] of Object.entries(filtro)) {
      if (valor !== undefined) query = query.eq(campo, valor)
    }
    if (opcoes?.ordenarPor) query = query.order(opcoes.ordenarPor, { ascending: opcoes.ascendente ?? true })
    if (opcoes?.limite) query = query.limit(opcoes.limite)

    const { data, error } = await query
    if (error) throw new ErroPersistencia(this.tabela, 'listar', error)
    return (data ?? []).map((linha) => this.paraDominio(linha))
  }

  async criar(dados: Record<string, unknown>): Promise<TDomain> {
    const { data, error } = await this.client.from(this.tabela).insert(this.paraLinha(dados)).select().single()
    if (error) throw new ErroPersistencia(this.tabela, 'criar', error)
    return this.paraDominio(data)
  }

  async atualizar(id: string, dados: Record<string, unknown>): Promise<TDomain> {
    const { data, error } = await this.client.from(this.tabela).update(this.paraLinha(dados)).eq('id', id).select().single()
    if (error) throw new ErroPersistencia(this.tabela, 'atualizar', error)
    return this.paraDominio(data)
  }

  async deletar(id: string): Promise<void> {
    const { error } = await this.client.from(this.tabela).delete().eq('id', id)
    if (error) throw new ErroPersistencia(this.tabela, 'deletar', error)
  }
}
