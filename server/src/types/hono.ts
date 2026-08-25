/**
 * Equivalente ao antigo `types/express.d.ts` — só que Hono não estende
 * um tipo global de Request; em vez disso, cada `Hono<AppEnv>` carrega
 * o formato das variáveis de contexto (`c.set`/`c.get`) como generic.
 */
import type { Conta, Papel } from '../models/User.js'

export interface UsuarioAutenticado {
  id: string
  contaId: string
  papel: Papel
  email: string
  clienteId: string | null
}

export interface Variaveis {
  usuarioAutenticado: UsuarioAutenticado
  conta: Conta
  dadosValidados: unknown
}

export type AppEnv = { Variables: Variaveis }
