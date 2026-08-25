/**
 * Emissão/verificação de JWT para autenticação da API. `jose` em vez de
 * `jsonwebtoken` porque é ESM nativo — compatível com NodeNext sem
 * `esModuleInterop` gambiarra, e é a lib que a própria doc do Node
 * recomenda hoje para JOSE/JWT.
 */
import { jwtVerify, SignJWT } from 'jose'
import type { Papel } from '../models/User.js'
import { ErroNaoAutorizado, ErroValidacao } from '../errors/AppError.js'

// Lazy — em Workers, `process.env` só reflete os bindings durante o
// processamento de uma requisição, não na avaliação do módulo no cold
// start (mesmo motivo documentado em config/database.config.ts).
let chaveCache: Uint8Array | null = null
function obterChave(): Uint8Array {
  if (chaveCache) return chaveCache
  const segredo = process.env['JWT_SECRET']
  if (!segredo) {
    throw new Error('JWT_SECRET é obrigatório. Copie server/.env.example para server/.env (Node) ou server/.dev.vars (wrangler) e preencha.')
  }
  chaveCache = new TextEncoder().encode(segredo)
  return chaveCache
}

const EMISSOR = 'servicehub-api'
const VALIDADE = '7d'

// Emissor diferente do de autenticação, de propósito: um convite de
// cliente e um token de sessão têm o mesmo segredo (mesma CHAVE), mas
// `jwtVerify(..., { issuer })` rejeita um token do tipo errado sendo
// usado no lugar do outro — um token de convite vazado não vira uma
// sessão autenticada, e vice-versa.
const EMISSOR_CONVITE = 'servicehub-convite-cliente'
const VALIDADE_CONVITE = '7d'

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
    .sign(obterChave())
}

/** Lança {@link ErroNaoAutorizado} para qualquer token ausente/expirado/adulterado — o chamador nunca precisa distinguir o motivo. */
export async function verificarToken(token: string): Promise<PayloadAutenticacao> {
  try {
    const { payload } = await jwtVerify(token, obterChave(), { issuer: EMISSOR })
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

export interface PayloadConvite {
  contaId: string
  /** id do Usuario (admin/gestor/tecnico) que gerou o link — só pra auditoria/log, não usado em regra de negócio. */
  criadoPor: string
}

export async function assinarConviteCliente(payload: PayloadConvite): Promise<string> {
  return new SignJWT({ contaId: payload.contaId, criadoPor: payload.criadoPor })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(EMISSOR_CONVITE)
    .setIssuedAt()
    .setExpirationTime(VALIDADE_CONVITE)
    .sign(obterChave())
}

/** Lança {@link ErroValidacao} (não ErroNaoAutorizado) — pro visitante público do formulário ver "link inválido/expirado", não algo que pareça um problema de login. */
export async function verificarConviteCliente(token: string): Promise<PayloadConvite> {
  try {
    const { payload } = await jwtVerify(token, obterChave(), { issuer: EMISSOR_CONVITE })
    return { contaId: payload['contaId'] as string, criadoPor: payload['criadoPor'] as string }
  } catch {
    throw new ErroValidacao('Este link de convite é inválido ou já expirou.')
  }
}
