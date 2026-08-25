/**
 * Augmenta `Request` com o que os middlewares da Tarefa 5 anexam.
 * `usuarioAutenticado` vem do JWT (auth.middleware); `conta` vem da
 * releitura ao vivo do banco (contexto-negocio.middleware) — tipoNegocio
 * e status precisam ser lidos na hora, não confiados ao token, porque
 * podem mudar durante a validade dos 7 dias do token (ver
 * contexto-negocio.middleware.ts para o porquê).
 */
import type { Conta, Papel } from '../models/User.js'

export interface UsuarioAutenticado {
  id: string
  contaId: string
  papel: Papel
  email: string
  clienteId: string | null
}

declare global {
  namespace Express {
    interface Request {
      usuarioAutenticado?: UsuarioAutenticado
      conta?: Conta
      dadosValidados?: unknown
    }
  }
}

export {}
