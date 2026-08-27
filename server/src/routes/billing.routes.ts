/**
 * Checkout do teste grátis (7 dias), confirmação pós-checkout, Customer
 * Portal (upgrade/downgrade + forma de pagamento) e o webhook do
 * Stripe. Só /webhook é pública — as outras exigem uma conta já
 * cadastrada e logada (o checkout roda depois do onboarding, ver
 * Login.jsx e o plano em /Users/efraim/.claude/plans/virtual-questing-abelson.md).
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { BillingService } from '../services/BillingService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validar } from '../middleware/validacao.middleware.js'
import { ErroValidacao } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function billing() { return new BillingService(getSupabase()) }

const schemaConfirmarCheckout = z.object({ sessionId: z.string().min(1) })
/** Ambos opcionais: a tela /checkout deixa trocar o plano/ciclo escolhido na landing antes de pagar. */
const schemaIniciarCheckout = z.object({
  plano: z.enum(['startup', 'profissional']).optional(),
  ciclo: z.enum(['mensal', 'anual']).optional(),
})

router.post('/checkout', autenticar, requererPapel('admin'), carregarContexto, validar(schemaIniciarCheckout), async (c) => {
  const usuario = c.get('usuarioAutenticado')
  const { plano, ciclo } = c.get('dadosValidados') as z.infer<typeof schemaIniciarCheckout>
  const resultado = await billing().criarSessaoCheckout(c.get('conta'), usuario.email, { plano, ciclo })
  return c.json(resultado, 200)
})

router.post('/confirmar-checkout', autenticar, requererPapel('admin'), carregarContexto, validar(schemaConfirmarCheckout), async (c) => {
  const { sessionId } = c.get('dadosValidados') as z.infer<typeof schemaConfirmarCheckout>
  const conta = await billing().confirmarCheckout(c.get('conta').id, sessionId)
  return c.json(conta, 200)
})

router.post('/portal', autenticar, requererPapel('admin'), carregarContexto, async (c) => {
  const resultado = await billing().criarSessaoPortal(c.get('conta'))
  return c.json(resultado, 200)
})

/** Pública — o Stripe assina o corpo cru com STRIPE_WEBHOOK_SECRET, por isso não passa por `validar()` (que já faz `c.req.json()`). */
router.post('/webhook', async (c) => {
  const assinatura = c.req.header('stripe-signature')
  if (!assinatura) throw new ErroValidacao('Header "stripe-signature" ausente.')
  const payload = await c.req.text()
  await billing().processarWebhook(payload, assinatura)
  return c.json({ recebido: true }, 200)
})

export default router
