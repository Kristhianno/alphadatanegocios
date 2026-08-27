/**
 * Cria/atualiza no Stripe os Products + Prices dos planos vendidos na
 * landing (Starter = `startup`, Pro = `profissional`) e garante que o
 * Customer Portal permite upgrade/downgrade entre eles. Idempotente:
 * roda de novo sem duplicar nada (Products são achados por
 * `metadata.plano`, Prices por `lookup_key`).
 *
 * No final, imprime os 4 STRIPE_PRICE_* pra colar em `server/.dev.vars`
 * (dev) e depois em `wrangler secret put` (produção).
 *
 * Roda com: npx tsx --env-file=.env scripts/stripe-setup.ts
 * (precisa de STRIPE_SECRET_KEY no .env — sk_test_... pra testar sem
 * mexer com dinheiro real, sk_live_... só quando for pra valer)
 */
import Stripe from 'stripe'
import { getConfigPlano, PLANOS_COM_CHECKOUT } from '../src/config/planos.config.js'
import type { CicloCobranca, Plano } from '../src/models/User.js'

// URL pública do Worker (server/wrangler.jsonc → name "servicehub-api") — é onde
// POST /billing/webhook vive, não a URL do frontend (APP_URL). Fixo aqui de
// propósito: este script é específico deste projeto, não um utilitário genérico.
const URL_WEBHOOK = 'https://servicehub-api.ekriator.workers.dev/billing/webhook'
const EVENTOS_WEBHOOK: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]

const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY']
if (!STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY ausente — configure em server/.env antes de rodar este script.')
  process.exit(1)
}
const modo = STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE (dinheiro real)' : 'TESTE'
console.log(`Rodando contra o Stripe em modo ${modo}.\n`)

const stripe = new Stripe(STRIPE_SECRET_KEY)

async function garantirProduto(plano: Plano, nomeMarketing: string): Promise<Stripe.Product> {
  const existentes = await stripe.products.search({ query: `metadata['plano']:'${plano}' AND active:'true'` })
  const encontrado = existentes.data[0]
  if (encontrado) {
    return stripe.products.update(encontrado.id, { name: nomeMarketing, metadata: { plano } })
  }
  return stripe.products.create({ name: nomeMarketing, metadata: { plano } })
}

async function garantirPreco(produtoId: string, lookupKey: string, valorCentavos: number, intervalo: 'month' | 'year'): Promise<Stripe.Price> {
  const existentes = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })
  const encontrado = existentes.data[0]
  if (encontrado) {
    if (encontrado.unit_amount !== valorCentavos) {
      console.warn(`  ! Preço "${lookupKey}" já existe com valor diferente (${encontrado.unit_amount} centavos) — Prices são imutáveis no Stripe, crie um novo lookup_key se precisar mudar o valor.`)
    }
    return encontrado
  }
  return stripe.prices.create({
    product: produtoId,
    currency: 'brl',
    unit_amount: valorCentavos,
    recurring: { interval: intervalo },
    lookup_key: lookupKey,
    nickname: lookupKey,
  })
}

async function garantirWebhook(url: string): Promise<{ secret: string | null; jaExistia: boolean }> {
  const existentes = await stripe.webhookEndpoints.list({ limit: 100 })
  const encontrado = existentes.data.find((w) => w.url === url)
  if (encontrado) return { secret: null, jaExistia: true } // o signing secret só vem no retorno da criação
  const criado = await stripe.webhookEndpoints.create({ url, enabled_events: EVENTOS_WEBHOOK })
  return { secret: criado.secret ?? null, jaExistia: false }
}

/** Garante que o Customer Portal permite trocar entre Starter/Pro (Configuracoes.jsx → "Gerenciar assinatura") e é a config ativa da conta. */
async function garantirPortalConfig(produtos: { productId: string; priceIds: string[] }[]): Promise<void> {
  const subscriptionUpdate: Stripe.BillingPortal.ConfigurationUpdateParams.Features.SubscriptionUpdate = {
    enabled: true,
    default_allowed_updates: ['price'],
    proration_behavior: 'create_prorations',
    products: produtos.map(({ productId, priceIds }) => ({ product: productId, prices: priceIds })),
  }
  const featuresBase = {
    subscription_update: subscriptionUpdate,
    payment_method_update: { enabled: true },
    invoice_history: { enabled: true },
    subscription_cancel: { enabled: true, mode: 'at_period_end' as const },
  }

  const existentes = await stripe.billingPortal.configurations.list({ limit: 100 })
  const atual = existentes.data.find((c) => c.is_default) ?? existentes.data[0]

  if (atual) {
    await stripe.billingPortal.configurations.update(atual.id, { features: featuresBase })
  } else {
    // A primeira configuration criada numa conta vira `is_default` automaticamente —
    // não existe param pra setar isso via API (a Stripe rejeita `is_default` no create/update).
    await stripe.billingPortal.configurations.create({
      features: featuresBase,
      business_profile: { headline: 'Gerencie sua assinatura ALPHADATA' },
    })
  }
}

async function main() {
  const priceIdsPorEnvVar: Record<string, string> = {}
  const produtosParaPortal: { productId: string; priceIds: string[] }[] = []

  for (const plano of PLANOS_COM_CHECKOUT) {
    const config = getConfigPlano(plano)
    console.log(`Plano ${config.nomeMarketing} (${plano}):`)

    const produto = await garantirProduto(plano, config.nomeMarketing)
    console.log(`  produto: ${produto.id}`)

    const cicloPorIntervalo: { ciclo: CicloCobranca; intervalo: 'month' | 'year'; valor: number }[] = [
      { ciclo: 'mensal', intervalo: 'month', valor: config.precoMensalCentavos },
      { ciclo: 'anual', intervalo: 'year', valor: config.precoAnualTotalCentavos! },
    ]

    const priceIdsDoPlano: string[] = []
    for (const { ciclo, intervalo, valor } of cicloPorIntervalo) {
      const lookupKey = `${plano}_${ciclo}`
      const preco = await garantirPreco(produto.id, lookupKey, valor, intervalo)
      console.log(`  price (${ciclo}): ${preco.id} — R$ ${(valor / 100).toFixed(2)}${ciclo === 'anual' ? '/ano' : '/mês'}`)
      const nomeEnv = `STRIPE_PRICE_${plano.toUpperCase()}_${ciclo.toUpperCase()}`
      priceIdsPorEnvVar[nomeEnv] = preco.id
      priceIdsDoPlano.push(preco.id)
    }
    produtosParaPortal.push({ productId: produto.id, priceIds: priceIdsDoPlano })
    console.log()
  }

  await garantirPortalConfig(produtosParaPortal)
  console.log('Customer Portal configurado: troca entre Starter/Pro habilitada, cartão e cancelamento também.\n')

  console.log('Cole em server/.dev.vars (e depois em `wrangler secret put`, um por vez):\n')
  for (const [nomeEnv, priceId] of Object.entries(priceIdsPorEnvVar)) {
    console.log(`${nomeEnv}=${priceId}`)
  }

  console.log(`\nWebhook endpoint (${URL_WEBHOOK}):`)
  const webhook = await garantirWebhook(URL_WEBHOOK)
  if (webhook.jaExistia) {
    console.log('  já existe — se não tiver o STRIPE_WEBHOOK_SECRET salvo, veja em Developers → Webhooks → clique no endpoint → "Reveal" (ou delete e rode este script de novo pra recriar).')
  } else {
    console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`)
  }
}

main().catch((erro) => {
  console.error('Falha ao configurar o Stripe:', erro)
  process.exit(1)
})
