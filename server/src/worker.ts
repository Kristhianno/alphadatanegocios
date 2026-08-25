/**
 * Entrypoint de Cloudflare Workers. Um app Hono já É um handler
 * `fetch(request, env, ctx)` — não precisa de adaptador, diferente do
 * que seria necessário pra rodar Express nesse mesmo runtime.
 */
import { app } from './app.js'

export default app
