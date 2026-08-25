/**
 * Error handler global — não fazia parte da lista original de
 * middlewares da Tarefa 5, mas é infraestrutura que as rotas não têm
 * como funcionar sem (mesmo padrão de "puxar pra frente" usado com
 * database.config.ts na Tarefa 3): sem ele, todo `throw new AppError(...)`
 * dentro de um service viraria um HTML de stack trace do Express em vez
 * de um JSON com o `statusCode` que AppError já carrega.
 *
 * Trata também `ZodError` cru: services como UserService/AgendamentoService
 * chamam `schema.parse(dados)` diretamente (não `.safeParse`), então uma
 * entrada inválida propaga um ZodError, não um ErroValidacao — sem este
 * tratamento específico, cairia no branch genérico de 500.
 */
import type { NextFunction, Request, Response } from 'express'
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

/** `_req`/`_next` não são usados, mas precisam estar na assinatura — é a aridade 4 que faz o Express reconhecer isto como error handler. */
export function tratarErro(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const corpo: CorpoErro = { erro: { codigo: err.codigo, mensagem: err.message } }
    if (err instanceof ErroValidacao && err.detalhes) corpo.erro.detalhes = err.detalhes
    if (err.statusCode >= 500) logger.error({ err, causa: err.causa }, err.message)
    else logger.warn({ codigo: err.codigo }, err.message)
    res.status(err.statusCode).json(corpo)
    return
  }

  if (err instanceof ZodError) {
    const detalhes = err.issues.map((problema) => ({ campo: problema.path.join('.'), mensagem: problema.message }))
    logger.warn({ detalhes }, 'Erro de validação (Zod) não tratado no service.')
    res.status(400).json({ erro: { codigo: 'VALIDACAO', mensagem: 'Dados inválidos.', detalhes } } satisfies CorpoErro)
    return
  }

  logger.error({ err }, 'Erro não tratado.')
  res.status(500).json({ erro: { codigo: 'INTERNO', mensagem: 'Erro interno do servidor.' } } satisfies CorpoErro)
}
