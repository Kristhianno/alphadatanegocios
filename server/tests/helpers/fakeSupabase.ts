/**
 * Client Supabase falso, em memória — o que faz os testes de service
 * serem "unitários" de verdade (rápidos, determinísticos, sem precisar
 * de rede ou de `server/.env`).
 *
 * Deliberadamente NÃO tenta imitar comportamento específico do
 * Postgres/PostgREST (RLS, colunas geradas, dígito verificador de FK,
 * `service_role` GRANT) — bugs desse tipo (ver histórico de
 * schema_indexes_constraints.sql e grant_service_role_privileges.sql)
 * só aparecem contra o banco de verdade, e é lá que continuam sendo
 * verificados. O que este fake cobre é a lógica que pertence ao
 * service: validação, autorização, orquestração — coisas que não
 * deveriam precisar de uma rede pra serem testadas.
 *
 * Implementa só o subconjunto do query builder do supabase-js que o
 * código do projeto realmente usa: from/select/insert/update/delete/
 * eq/in/order/limit/single/maybeSingle/count. Qualquer método além
 * desses lançar um erro claro é intencional — sinaliza que o fake
 * precisa crescer, em vez de silenciosamente devolver algo errado.
 */
import { randomUUID } from 'node:crypto'
// `import type` é erased em tempo de compilação — não executa
// database.config.ts, então não precisa de SUPABASE_URL/SERVICE_ROLE_KEY
// só pra rodar os testes.
import type { Cliente } from '../../src/config/database.config.js'

export type Linha = Record<string, unknown>

interface ResultadoUnico {
  data: Linha | null
  error: { message: string } | null
}

interface ResultadoLista {
  data: Linha[]
  error: { message: string } | null
  count: number | null
}

class TabelaFake {
  linhas: Linha[] = []

  inserir(dados: Linha): Linha {
    const agora = new Date().toISOString()
    const linha: Linha = { id: randomUUID(), criado_em: agora, atualizado_em: agora, ...dados }
    this.linhas.push(linha)
    return { ...linha }
  }

  atualizar(id: string, patch: Linha): Linha | null {
    const linha = this.linhas.find((l) => l['id'] === id)
    if (!linha) return null
    Object.assign(linha, patch, { atualizado_em: new Date().toISOString() })
    return { ...linha }
  }

  remover(id: string): void {
    this.linhas = this.linhas.filter((l) => l['id'] !== id)
  }
}

type Modo = 'select' | 'insert' | 'update' | 'delete'

class ConstrutorConsultaFake implements PromiseLike<ResultadoLista> {
  private modo: Modo = 'select'
  private payload?: Linha | Linha[]
  private filtrosEq: [string, unknown][] = []
  private filtrosIn: [string, unknown[]][] = []
  private ordenar?: { coluna: string; ascendente: boolean }
  private limite?: number
  private contar = false

  constructor(private readonly tabela: TabelaFake) {}

  select(_colunas?: string, opcoes?: { count?: 'exact'; head?: boolean }): this {
    if (opcoes?.count) this.contar = true
    return this
  }

  insert(payload: Linha | Linha[]): this {
    this.modo = 'insert'
    this.payload = payload
    return this
  }

  update(payload: Linha): this {
    this.modo = 'update'
    this.payload = payload
    return this
  }

  delete(): this {
    this.modo = 'delete'
    return this
  }

  eq(coluna: string, valor: unknown): this {
    this.filtrosEq.push([coluna, valor])
    return this
  }

  in(coluna: string, valores: unknown[]): this {
    this.filtrosIn.push([coluna, valores])
    return this
  }

  order(coluna: string, opcoes?: { ascending?: boolean }): this {
    this.ordenar = { coluna, ascendente: opcoes?.ascending ?? true }
    return this
  }

  limit(n: number): this {
    this.limite = n
    return this
  }

  private linhasFiltradas(): Linha[] {
    let linhas = this.tabela.linhas
    for (const [coluna, valor] of this.filtrosEq) linhas = linhas.filter((l) => l[coluna] === valor)
    for (const [coluna, valores] of this.filtrosIn) linhas = linhas.filter((l) => valores.includes(l[coluna]))
    if (this.ordenar) {
      const { coluna, ascendente } = this.ordenar
      linhas = [...linhas].sort((a, b) => {
        const av = a[coluna]
        const bv = b[coluna]
        if (av === bv) return 0
        const maior = av! > bv! ? 1 : -1
        return ascendente ? maior : -maior
      })
    }
    if (this.limite !== undefined) linhas = linhas.slice(0, this.limite)
    return linhas.map((l) => ({ ...l }))
  }

  private executar(): ResultadoLista {
    if (this.modo === 'insert') {
      const linhas = (Array.isArray(this.payload) ? this.payload : [this.payload as Linha]).map((l) => this.tabela.inserir(l))
      return { data: linhas, error: null, count: null }
    }
    if (this.modo === 'update') {
      const alvo = this.linhasFiltradas()
      const atualizadas = alvo.map((l) => this.tabela.atualizar(l['id'] as string, this.payload as Linha)).filter((l): l is Linha => l !== null)
      return { data: atualizadas, error: null, count: null }
    }
    if (this.modo === 'delete') {
      const alvo = this.linhasFiltradas()
      for (const l of alvo) this.tabela.remover(l['id'] as string)
      return { data: alvo, error: null, count: null }
    }
    const linhas = this.linhasFiltradas()
    return { data: linhas, error: null, count: this.contar ? linhas.length : null }
  }

  async single(): Promise<ResultadoUnico> {
    const { data } = this.executar()
    if (data.length !== 1) return { data: null, error: { message: `esperado 1 linha, veio ${data.length}` } }
    return { data: data[0]!, error: null }
  }

  async maybeSingle(): Promise<ResultadoUnico> {
    const { data } = this.executar()
    return { data: data[0] ?? null, error: null }
  }

  then<TResult1 = ResultadoLista, TResult2 = never>(
    onfulfilled?: ((value: ResultadoLista) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.executar()).then(onfulfilled, onrejected)
  }
}

interface UsuarioAuthFake {
  id: string
  email: string
  user_metadata: Record<string, unknown>
}

interface ResultadoAuthUnico {
  data: { user: UsuarioAuthFake | null }
  error: { message: string } | null
}

/**
 * Fake mínimo de `client.auth` — só o que `UserService.autenticarViaSupabase`
 * e o espelhamento em `criarUsuario` usam (`admin.createUser`,
 * `admin.listUsers`, `getUser`). Deliberadamente não verifica JWT de
 * verdade: nesse fake, o "token" que `getUser` aceita É o id do usuário
 * — suficiente pra testar a lógica do service, que é o que interessa
 * aqui (mesma filosofia do resto deste arquivo, ver comentário no topo).
 */
class AuthFake {
  private usuarios: UsuarioAuthFake[] = []

  admin = {
    createUser: async (dados: { email: string; password: string; email_confirm?: boolean; user_metadata?: Record<string, unknown> }): Promise<ResultadoAuthUnico> => {
      if (this.usuarios.some((u) => u.email === dados.email)) {
        return { data: { user: null }, error: { message: 'A user with this email address has already been registered' } }
      }
      const user: UsuarioAuthFake = { id: randomUUID(), email: dados.email, user_metadata: dados.user_metadata ?? {} }
      this.usuarios.push(user)
      return { data: { user }, error: null }
    },
    listUsers: async (): Promise<{ data: { users: UsuarioAuthFake[] }; error: null }> => ({
      data: { users: this.usuarios.map((u) => ({ ...u })) },
      error: null,
    }),
  }

  getUser = async (token: string): Promise<ResultadoAuthUnico> => {
    const user = this.usuarios.find((u) => u.id === token)
    if (!user) return { data: { user: null }, error: { message: 'Invalid token' } }
    return { data: { user: { ...user } }, error: null }
  }

  /** Atalho de teste: registra (ou reaproveita) uma identidade falsa e devolve o "token" que `getUser` reconhece pra ela. */
  criarIdentidade(email: string, user_metadata: Record<string, unknown> = {}): { id: string; token: string } {
    let user = this.usuarios.find((u) => u.email === email)
    if (!user) {
      user = { id: randomUUID(), email, user_metadata }
      this.usuarios.push(user)
    }
    return { id: user.id, token: user.id }
  }
}

export class ClienteFake {
  private readonly tabelas = new Map<string, TabelaFake>()
  readonly auth = new AuthFake()

  from(nomeTabela: string): ConstrutorConsultaFake {
    if (!this.tabelas.has(nomeTabela)) this.tabelas.set(nomeTabela, new TabelaFake())
    return new ConstrutorConsultaFake(this.tabelas.get(nomeTabela)!)
  }

  /**
   * Popula uma tabela direto (sem passar pelo builder) — útil pra
   * preparar o cenário de um teste. Acrescenta às linhas que já
   * existirem na tabela (não substitui) — chamar `semear` mais de uma
   * vez pra montar um cenário com várias linhas relacionadas precisa
   * funcionar sem que a segunda chamada apague a primeira.
   */
  semear(nomeTabela: string, linhas: Linha[]): Linha[] {
    if (!this.tabelas.has(nomeTabela)) this.tabelas.set(nomeTabela, new TabelaFake())
    const tabela = this.tabelas.get(nomeTabela)!
    const novas = linhas.map((l) => ({ id: randomUUID(), criado_em: new Date().toISOString(), atualizado_em: new Date().toISOString(), ...l }))
    tabela.linhas.push(...novas)
    return novas.map((l) => ({ ...l }))
  }

  /** Lê o estado bruto de uma tabela — útil pra afirmar o que um service escreveu, sem depender de outro método do próprio service pra ler de volta. */
  linhasDe(nomeTabela: string): Linha[] {
    return (this.tabelas.get(nomeTabela)?.linhas ?? []).map((l) => ({ ...l }))
  }
}

export function criarClienteFake(): ClienteFake {
  return new ClienteFake()
}

/** Tipa uma instância de `ClienteFake` como `Cliente` — o que os construtores de service esperam. Usar quando o teste também precisa de `semear`/`linhasDe`, que só existem em `ClienteFake`. */
export function paraTipado(cliente: ClienteFake): Cliente {
  return cliente as unknown as Cliente
}

/** Atalho pra quando o teste não precisa semear nada antes de chamar o service. */
export function criarClienteFakeTipado(): Cliente {
  return paraTipado(new ClienteFake())
}
