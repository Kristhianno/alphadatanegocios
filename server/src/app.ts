/**
 * Montagem do app Hono — o próprio `app` já é um handler `fetch`
 * compatível com Cloudflare Workers (`export default app` no
 * entrypoint é suficiente, sem adaptador nenhum). Continua separado do
 * entrypoint de Workers pra poder ser testado (supertest-like) sem
 * precisar do runtime de Workers.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth.routes.js'
import clientesRoutes from './routes/clientes.routes.js'
import configRoutes from './routes/config.routes.js'
import convitesRoutes from './routes/convites.routes.js'
import equipeRoutes from './routes/equipe.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import agendamentosRoutes from './routes/agendamentos.routes.js'
import servicosRoutes from './routes/servicos.routes.js'
import confeitariaRoutes from './routes/confeitaria.routes.js'
import salaoFestasRoutes from './routes/salao-festas.routes.js'
import fotografiaRoutes from './routes/fotografia.routes.js'
import manutencaoRoutes from './routes/manutencao.routes.js'
import contratosRoutes from './routes/contratos.routes.js'
import financeiroRoutes from './routes/financeiro.routes.js'
import billingRoutes from './routes/billing.routes.js'
import leadsRoutes from './routes/leads.routes.js'
import { tratarErro } from './middleware/erro.middleware.js'
import type { AppEnv } from './types/hono.js'

export const app = new Hono<AppEnv>()

/**
 * Bindings de Workers (secrets/vars configurados no dashboard/wrangler)
 * chegam via `c.env`, não `process.env` — mesmo com `nodejs_compat`,
 * `process.env` não veio populado de verdade nem durante o
 * processamento de uma requisição (comprovado rodando `wrangler dev`).
 * Essa ponte copia `c.env` pra `process.env` uma vez por requisição,
 * bem no início — daí em diante, código que só sabe ler `process.env`
 * (getSupabase, obterChave, logger — todos genéricos, sem acesso a
 * `c`) funciona sem precisar receber `env` explicitamente por parâmetro
 * em cada camada. Em Node (dev com tsx, scripts), `c.env` é undefined
 * e isso é um no-op — `process.env` já vem do `.env`/`--env-file`.
 */
app.use('*', async (c, next) => {
  if (c.env && typeof c.env === 'object') {
    Object.assign(process.env, c.env)
  }
  await next()
})

app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'ok' }, 200))

app.route('/auth', authRoutes)
app.route('/clientes', clientesRoutes)
app.route('/config', configRoutes)
app.route('/convites', convitesRoutes)
app.route('/equipe', equipeRoutes)
app.route('/dashboard', dashboardRoutes)
app.route('/agendamentos', agendamentosRoutes)
app.route('/servicos', servicosRoutes)
app.route('/confeitaria', confeitariaRoutes)
app.route('/salao-festas', salaoFestasRoutes)
app.route('/fotografia', fotografiaRoutes)
app.route('/manutencao', manutencaoRoutes)
app.route('/contratos', contratosRoutes)
app.route('/financeiro', financeiroRoutes)
app.route('/billing', billingRoutes)
app.route('/leads', leadsRoutes)

app.notFound((c) => c.json({ erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: `Rota "${c.req.method} ${c.req.path}" não existe.` } }, 404))

app.onError(tratarErro)
