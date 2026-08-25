/**
 * Autenticação por JWT (Bearer) + checagem de papel. Hono, assim como
 * Express 5, propaga sozinho uma Promise rejeitada de um
 * handler/middleware assíncrono pro error handler (`app.onError`) —
 * nenhum wrapper try/catch é necessário aqui.
 */
import type { Context, Next } from 'hono'
import type { Papel } from '../models/User.js'
import { verificarToken } from '../utils/jwt.js'
import { ErroNaoAutorizado, ErroProibido } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

export async function autenticar(c: Context<AppEnv>, next: Next): Promise<void> {
  const cabecalho = c.req.header('authorization')
  if (!cabecalho?.startsWith('Bearer ')) {
    throw new ErroNaoAutorizado('Envie o token no header "Authorization: Bearer <token>".')
  }
  const token = cabecalho.slice('Bearer '.length)
  const payload = await verificarToken(token)
  c.set('usuarioAutenticado', { id: payload.sub, contaId: payload.contaId, papel: payload.papel, email: payload.email, clienteId: payload.clienteId })
  await next()
}

/** Restringe a rota a um subconjunto de papéis — sempre depois de {@link autenticar}. */
export function requererPapel(...papeis: readonly Papel[]) {
  return async (c: Context<AppEnv>, next: Next): Promise<void> => {
    const usuario = c.get('usuarioAutenticado')
    if (!usuario) throw new ErroNaoAutorizado('Autenticação necessária.')
    if (!papeis.includes(usuario.papel)) {
      throw new ErroProibido(`Este recurso exige um dos papéis: ${papeis.join(', ')}.`)
    }
    await next()
  }
}
