/**
 * Validação de request via Zod, para os casos que os services não
 * cobrem sozinhos: parâmetros de rota (`:id`), query string de filtros
 * de listagem, e o punhado de métodos de service que recebem
 * parâmetros primitivos soltos em vez de um `dados: unknown` (ex:
 * ManutencaoService.criarChamado(userId, tipoManutencao, descricao)).
 *
 * Onde o service já valida sua própria entrada com Zod (a maioria dos
 * `criar*`/`atualizar*`), a rota passa `req.body` direto — validar de
 * novo aqui seria duplicar o schema em dois lugares e deixá-los
 * divergir com o tempo.
 *
 * O resultado validado fica em `req.dadosValidados`, nunca sobrescreve
 * `req.body`/`req.query` diretamente — no Express 5 `req.query` é
 * somente leitura (getter sem setter).
 */
import type { NextFunction, Request, Response } from 'express'
import type { z } from 'zod'
import { ErroValidacao } from '../errors/AppError.js'
import { validarUuid } from '../utils/validadores.js'

export function validar(schema: z.ZodTypeAny, origem: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req[origem])
    if (!resultado.success) {
      const detalhes = resultado.error.issues.map((problema) => ({ campo: problema.path.join('.'), mensagem: problema.message }))
      throw new ErroValidacao('Dados inválidos.', detalhes)
    }
    req.dadosValidados = resultado.data
    next()
  }
}

/** Rejeita cedo um `:id` de rota que nem parece um UUID, antes de gastar uma consulta no banco. */
export function validarUuidParam(nomeParametro: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const valor = req.params[nomeParametro]
    if (!validarUuid(valor)) {
      throw new ErroValidacao(`Parâmetro de rota "${nomeParametro}" precisa ser um UUID válido.`)
    }
    next()
  }
}
