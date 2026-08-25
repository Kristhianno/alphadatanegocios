/**
 * Autenticação por JWT (Bearer) + checagem de papel. Express 5 propaga
 * sozinho uma Promise rejeitada de um handler/middleware assíncrono para
 * o error handler (`next(err)` automático) — por isso nenhum wrapper
 * try/catch é necessário aqui, diferente do que Express 4 exigiria.
 */
import type { NextFunction, Request, Response } from 'express'
import type { Papel } from '../models/User.js'
import { verificarToken } from '../utils/jwt.js'
import { ErroNaoAutorizado, ErroProibido } from '../errors/AppError.js'

export async function autenticar(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const cabecalho = req.headers.authorization
  if (!cabecalho?.startsWith('Bearer ')) {
    throw new ErroNaoAutorizado('Envie o token no header "Authorization: Bearer <token>".')
  }
  const token = cabecalho.slice('Bearer '.length)
  const payload = await verificarToken(token)
  req.usuarioAutenticado = { id: payload.sub, contaId: payload.contaId, papel: payload.papel, email: payload.email, clienteId: payload.clienteId }
  next()
}

/** Restringe a rota a um subconjunto de papéis — sempre depois de {@link autenticar}. */
export function requererPapel(...papeis: readonly Papel[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuarioAutenticado) throw new ErroNaoAutorizado('Autenticação necessária.')
    if (!papeis.includes(req.usuarioAutenticado.papel)) {
      throw new ErroProibido(`Este recurso exige um dos papéis: ${papeis.join(', ')}.`)
    }
    next()
  }
}
