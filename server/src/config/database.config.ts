/**
 * Cliente Supabase do backend. Peça da Tarefa 7.1, adiantada aqui
 * porque os services (Tarefa 3) não têm como ser reais sem ela.
 *
 * Usa a service_role key — o backend é código confiável rodando fora
 * do navegador, então ele contorna RLS de propósito (é o único lugar
 * do sistema que deve fazer isso). auth.middleware.ts (Tarefa 5) é
 * quem garante, por fora do banco, que um usuário só acessa dados da
 * própria conta.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types.js'
import { logger } from '../utils/logger.js'

const SUPABASE_URL = process.env['SUPABASE_URL']
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios. Copie server/.env.example para server/.env e preencha.'
  )
}

/**
 * Tipado com `Database` (gerado via `supabase gen types typescript
 * --linked` a partir do schema real — Tarefa 1). Isso é o que dá tipo
 * forte em `.from('tabela').select(...)` sem precisar tipar cada linha
 * manualmente nos repositories/services, e pega coluna com nome errado
 * em tempo de compilação em vez de em runtime.
 */
export type Cliente = SupabaseClient<Database>

export const supabase: Cliente = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
})

logger.debug({ url: SUPABASE_URL }, 'Cliente Supabase inicializado (service_role).')
