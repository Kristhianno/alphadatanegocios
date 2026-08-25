/**
 * Error handler global, ligado via `app.onError(tratarErro)` em app.ts.
 * Sem ele, todo `throw new AppError(...)` dentro de um service viraria
 * uma resposta genérica de erro do Hono em vez de um JSON com o
 * `statusCode` que AppError já carrega.
 *
 * Trata também `ZodError` cru: services como UserService/AgendamentoService
 * chamam `schema.parse(dados)` diretamente (não `.safeParse`), então uma
 * entrada inválida propaga um ZodError, não um ErroValidacao — sem este
 * tratamento específico, cairia no branch genérico de 500.
 */
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { ZodError } from 'zod'
import { AppError, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

interface CorpoErro {
  erro: {
    codigo: string
    mensagem: string
    detalhes?: readonly { campo: string; mensagem: string }[]
  }
}

export function tratarErro(err: Error, c: Context): Response | Promise<Response> {
  if (err instanceof AppError) {
    const corpo: CorpoErro = { erro: { codigo: err.codigo, mensagem: err.message } }
    if (err instanceof ErroValidacao && err.detalhes) corpo.erro.detalhes = err.detalhes
    if (err.statusCode >= 500) logger.error({ err, causa: err.causa }, err.message)
    else logger.warn({ codigo: err.codigo }, err.message)
    return c.json(corpo, err.statusCode as ContentfulStatusCode)
  }

  if (err instanceof ZodError) {
    const detalhes = err.issues.map((problema) => ({ campo: problema.path.join('.'), mensagem: problema.message }))
    logger.warn({ detalhes }, 'Erro de validação (Zod) não tratado no service.')
    return c.json({ erro: { codigo: 'VALIDACAO', mensagem: 'Dados inválidos.', detalhes } } satisfies CorpoErro, 400)
  }

  logger.error({ err }, 'Erro não tratado.')
  return c.json({ erro: { codigo: 'INTERNO', mensagem: 'Erro interno do servidor.' } } satisfies CorpoErro, 500)
}
