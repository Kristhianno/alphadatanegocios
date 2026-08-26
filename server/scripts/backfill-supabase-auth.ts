/**
 * Espelha no Supabase Auth todo `usuarios` que ainda não tem
 * `auth_user_id` — contas criadas antes da adoção do login com Google e
 * da redefinição de senha via Supabase (inclui as contas demo/seed, que
 * são criadas direto via UsuarioRepository, sem passar por
 * UserService.criarUsuario). Sem isso, "esqueci minha senha" e o
 * linkeamento automático por email no primeiro login com Google não
 * funcionam pra essas contas.
 *
 * Senha usada no espelho é aleatória e descartável — ninguém loga com
 * ela, ela só existe pra satisfazer o Supabase Auth (que exige uma
 * senha na criação); o dono da conta continua entrando pela senha local
 * ou define uma nova de verdade via "esqueci minha senha"/Google.
 *
 * Idempotente: seguro rodar mais de uma vez (só processa quem ainda tem
 * `auth_user_id` nulo), inclusive depois de rodadas parciais.
 *
 * Roda com: npx tsx --env-file=.env scripts/backfill-supabase-auth.ts
 */
import { getSupabase } from '../src/config/database.config.js'
import { UsuarioRepository } from '../src/repositories/UsuarioRepository.js'
import { gerarSenhaTemporaria } from '../src/utils/senha.js'
import { logger } from '../src/utils/logger.js'

const supabase = getSupabase()
const usuarios = new UsuarioRepository(supabase)

async function main(): Promise<void> {
  const { data: pendentes, error } = await supabase.from('usuarios').select('id, email').is('auth_user_id', null)
  if (error) throw new Error(`Falha ao listar usuários pendentes: ${error.message}`)
  if (!pendentes || pendentes.length === 0) {
    logger.info('Nenhum usuário pendente de espelhamento no Supabase Auth.')
    return
  }

  logger.info({ quantidade: pendentes.length }, 'Espelhando usuários no Supabase Auth...')
  let linkados = 0
  let falhas = 0

  for (const linha of pendentes) {
    const id = linha['id'] as string
    const email = linha['email'] as string

    const { data: criado, error: erroCriar } = await supabase.auth.admin.createUser({
      email,
      password: gerarSenhaTemporaria(24),
      email_confirm: true,
    })

    let authUserId = criado?.user?.id ?? null
    if (erroCriar && !authUserId) {
      // Provavelmente já existe no Supabase Auth (rodada anterior parcial, ou criado manualmente) — recupera o id em vez de falhar.
      const { data: existentes, error: erroListar } = await supabase.auth.admin.listUsers()
      if (erroListar) {
        logger.warn({ email, erro: erroCriar.message }, 'Falha ao criar E ao listar no Supabase Auth — pulando.')
        falhas++
        continue
      }
      authUserId = existentes.users.find((u) => u.email === email)?.id ?? null
    }

    if (!authUserId) {
      logger.warn({ email, erro: erroCriar?.message }, 'Não foi possível obter um auth_user_id — pulando.')
      falhas++
      continue
    }

    await usuarios.atualizar(id, { authUserId })
    linkados++
  }

  logger.info({ linkados, falhas }, 'Backfill do Supabase Auth concluído.')
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao rodar o backfill do Supabase Auth.')
  process.exit(1)
})
