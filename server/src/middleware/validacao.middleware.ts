/**
 * Validação de request via Zod, para os casos que os services não
 * cobrem sozinhos: parâmetros de rota (`:id`), query string de filtros
 * de listagem, e o punhado de métodos de service que recebem
 * parâmetros primitivos soltos em vez de um `dados: unknown` (ex:
 * ManutencaoService.criarChamado(userId, tipoManutencao, descricao)).
 *
 * Onde o service já valida sua própria entrada com Zod (a maioria dos
 * `criar*`/`atualizar*`), a rota passa o corpo direto — validar de
 * novo aqui seria duplicar o schema em dois lugares e deixá-los
 * divergir com o tempo.
 *
 * O resultado validado fica em `c.set('dadosValidados', ...)`.
 */
import type { Context, Next } from 'hono'
import type { z } from 'zod'
import { ErroValidacao } from '../errors/AppError.js'
import { validarUuid } from '../utils/validadores.js'
import type { AppEnv } from '../types/hono.js'

export function validar(schema: z.ZodTypeAny, origem: 'body' | 'query' | 'params' = 'body') {
  return async (c: Context<AppEnv>, next: Next): Promise<void> => {
    let dados: unknown
    if (origem === 'body') dados = await c.req.json().catch(() => ({}))
    else if (origem === 'query') dados = c.req.query()
    else dados = c.req.param()

    const resultado = schema.safeParse(dados)
    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((problema) => ({ campo: problema.path.join('.'), mensagem: problema.message }))
      throw new ErroValidacao('Dados inválidos.', detalhes)
    }
    c.set('dadosValidados', resultado.data)
    await next()
  }
}

/** Rejeita cedo um `:id` de rota que nem parece um UUID, antes de gastar uma consulta no banco. */
export function validarUuidParam(nomeParametro: string) {
  return async (c: Context<AppEnv>, next: Next): Promise<void> => {
    const valor = c.req.param(nomeParametro)
    if (!validarUuid(valor)) {
      throw new ErroValidacao(`Parâmetro de rota "${nomeParametro}" precisa ser um UUID válido.`)
    }
    await next()
  }
}
