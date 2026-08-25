/**
 * Montagem do app Express — separado de server.ts pra poder ser
 * importado por testes de integração (Tarefa 8) sem precisar abrir uma
 * porta de rede de verdade (supertest bate direto no `app`).
 */
import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth.routes.js'
import clientesRoutes from './routes/clientes.routes.js'
import configRoutes from './routes/config.routes.js'
import convitesRoutes from './routes/convites.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import agendamentosRoutes from './routes/agendamentos.routes.js'
import servicosRoutes from './routes/servicos.routes.js'
import confeitariaRoutes from './routes/confeitaria.routes.js'
import salaoFestasRoutes from './routes/salao-festas.routes.js'
import fotografiaRoutes from './routes/fotografia.routes.js'
import manutencaoRoutes from './routes/manutencao.routes.js'
import { tratarErro } from './middleware/erro.middleware.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/clientes', clientesRoutes)
app.use('/config', configRoutes)
app.use('/convites', convitesRoutes)
app.use('/dashboard', dashboardRoutes)
app.use('/agendamentos', agendamentosRoutes)
app.use('/servicos', servicosRoutes)
app.use('/confeitaria', confeitariaRoutes)
app.use('/salao-festas', salaoFestasRoutes)
app.use('/fotografia', fotografiaRoutes)
app.use('/manutencao', manutencaoRoutes)

app.use((req, res) => {
  res.status(404).json({ erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: `Rota "${req.method} ${req.path}" não existe.` } })
})

app.use(tratarErro)
