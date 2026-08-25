/**
 * Cliente Supabase do backend. Usa a service_role key — o backend é
 * código confiável rodando fora do navegador, então ele contorna RLS
 * de propósito (é o único lugar do sistema que deve fazer isso).
 * auth.middleware.ts é quem garante, por fora do banco, que um usuário
 * só acessa dados da própria conta.
 *
 * `getSupabase()` é lazy (cria e cacheia no primeiro uso), não um
 * `export const` de valor pronto — em Cloudflare Workers, `process.env`
 * só reflete os bindings do Worker durante o processamento de uma
 * requisição, não na avaliação do módulo no cold start (comprovado ao
 * rodar `wrangler dev`: ler `process.env` no top-level do módulo
 * lançava "SUPABASE_URL ausente" mesmo com os bindings configurados).
 * Um `export const` no topo do módulo rodaria cedo demais.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types.js'
import { logger } from '../utils/logger.js'

/**
 * Tipado com `Database` (gerado via `supabase gen types typescript
 * --linked` a partir do schema real). Isso é o que dá tipo forte em
 * `.from('tabela').select(...)` sem precisar tipar cada linha
 * manualmente nos repositories/services, e pega coluna com nome errado
 * em tempo de compilação em vez de em runtime.
 */
export type Cliente = SupabaseClient<Database>

let clienteCache: Cliente | null = null

export function getSupabase(): Cliente {
  if (clienteCache) return clienteCache

  const SUPABASE_URL = process.env['SUPABASE_URL']
  const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios. Copie server/.env.example para server/.env (dev local Node) ou server/.dev.vars (wrangler dev) e preencha; em produção, configure via `wrangler secret put`.'
    )
  }

  clienteCache = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  })
  logger.debug({ url: SUPABASE_URL }, 'Cliente Supabase inicializado (service_role).')
  return clienteCache
}
