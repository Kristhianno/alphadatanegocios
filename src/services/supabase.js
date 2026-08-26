import { createClient } from '@supabase/supabase-js'

// Cliente Supabase do FRONTEND — usa a URL + anon key (públicas, seguras
// de expor no browser). Serve só pra login social (Google) e "esqueci
// minha senha": o resultado (accessToken da sessão) é trocado pelo JWT
// de sempre em POST /auth/entrar-supabase (ver useAuth.entrarComSupabase).
// Não confundir com o client do server/ (esse usa a service role key,
// que nunca pode chegar no browser).
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
