/**
 * Entrypoint de Cloudflare Workers. Um app Hono já É um handler
 * `fetch(request, env, ctx)` — não precisa de adaptador, diferente do
 * que seria necessário pra rodar Express nesse mesmo runtime.
 *
 * `scheduled` roda o cron diário de wrangler.jsonc: faxina do Storage
 * (pastas de contas excluídas e uploads nunca confirmados).
 */
import { app } from './app.js'
import { getSupabase } from './config/database.config.js'
import { ArquivoService } from './services/ArquivoService.js'
import { logger } from './utils/logger.js'

interface ContextoExecucao {
  waitUntil(promessa: Promise<unknown>): void
}

export default {
  fetch: app.fetch,
  async scheduled(_evento: unknown, env: Record<string, unknown>, ctx: ContextoExecucao): Promise<void> {
    // Mesma ponte de app.ts: bindings chegam em `env`, o resto do código lê `process.env`.
    Object.assign(process.env, env)
    ctx.waitUntil(
      new ArquivoService(getSupabase()).limparOrfaos().catch((erro: unknown) => {
        logger.error({ erro }, 'Falha na limpeza diária do storage.')
      }),
    )
  },
}
