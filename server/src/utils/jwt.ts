/**
 * Emissão/verificação de JWT para autenticação da API. `jose` em vez de
 * `jsonwebtoken` porque é ESM nativo — compatível com NodeNext sem
 * `esModuleInterop` gambiarra, e é a lib que a própria doc do Node
 * recomenda hoje para JOSE/JWT.
 */
import { jwtVerify, SignJWT } from 'jose'
import type { Papel } from '../models/User.js'
import { ErroNaoAutorizado } from '../errors/AppError.js'

const SEGREDO = process.env['JWT_SECRET']
if (!SEGREDO) {
  throw new Error('JWT_SECRET é obrigatório. Copie server/.env.example para server/.env e preencha.')
}
const CHAVE = new TextEncoder().encode(SEGREDO)
const EMISSOR = 'servicehub-api'
const VALIDADE = '7d'

export interface PayloadAutenticacao {
  /** id do Usuario (login) — vai em `sub`, não no corpo do payload. */
  sub: string
  contaId: string
  papel: Papel
  email: string
  /** Só preenchido quando papel === 'cliente'. */
  clienteId: string | null
}

export async function assinarToken(payload: PayloadAutenticacao): Promise<string> {
  return new SignJWT({ contaId: payload.contaId, papel: payload.papel, email: payload.email, clienteId: payload.clienteId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(EMISSOR)
    .setIssuedAt()
    .setExpirationTime(VALIDADE)
    .sign(CHAVE)
}

/** Lança {@link ErroNaoAutorizado} para qualquer token ausente/expirado/adulterado — o chamador nunca precisa distinguir o motivo. */
export async function verificarToken(token: string): Promise<PayloadAutenticacao> {
  try {
    const { payload } = await jwtVerify(token, CHAVE, { issuer: EMISSOR })
    if (typeof payload.sub !== 'string') throw new Error('Token sem "sub".')
    return {
      sub: payload.sub,
      contaId: payload['contaId'] as string,
      papel: payload['papel'] as Papel,
      email: payload['email'] as string,
      clienteId: (payload['clienteId'] as string | null) ?? null,
    }
  } catch {
    throw new ErroNaoAutorizado('Token inválido ou expirado.')
  }
}
