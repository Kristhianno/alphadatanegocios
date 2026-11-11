/**
 * Cria/atualiza no Stripe os Products + Prices dos planos vendidos na
 * landing (Essencial = `startup`, Completo = `profissional`), a taxa
 * única de implementação, e configura o Customer Portal (cartão,
 * faturas e cancelamento). Idempotente: roda de novo sem duplicar nada
 * (Products são achados por `metadata`, Prices por `lookup_key`).
 *
 * Os dois ciclos são cobrados por MÊS desde 2026-11: `mensal` = sem
 * fidelidade, `anual` = plano de 12 meses (fidelidade contratual). O
 * ciclo vai em `price.metadata.ciclo` (é o que BillingService lê). Se
 * um lookup_key já existir com valor/intervalo/ciclo diferente, cria um
 * Price novo com `transfer_lookup_key` e arquiva o antigo — Prices são
 * imutáveis no Stripe.
 *
 * No final, imprime os STRIPE_PRICE_* pra colar em `server/.dev.vars`
 * (dev) e depois em `wrangler secret put` (produção).
 *
 * Roda com: npx tsx --env-file=.dev.vars scripts/stripe-setup.ts
 * (sk_test_... pra testar sem mexer com dinheiro real, sk_live_... só
 * quando for pra valer)
 */
import Stripe from 'stripe'
import { getConfigPlano, PLANOS_COM_CHECKOUT, TAXA_IMPLEMENTACAO_CENTAVOS } from '../src/config/planos.config.js'
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

async function garantirProduto(metadata: Record<string, string>, nome: string, descricao: string): Promise<Stripe.Product> {
  const [chave, valor] = Object.entries(metadata)[0]!
  // list (consistente) em vez de products.search, que é indexado com atraso —
  // rodar o script duas vezes seguidas duplicava o produto recém-criado.
  let encontrado: Stripe.Product | undefined
  for await (const produto of stripe.products.list({ active: true, limit: 100 })) {
    if (produto.metadata[chave] === valor) {
      encontrado = produto
      break
    }
  }
  if (encontrado) {
    return stripe.products.update(encontrado.id, { name: nome, description: descricao, metadata })
  }
  return stripe.products.create({ name: nome, description: descricao, metadata })
}

/** `intervalo` null = Price avulso (cobrança única). */
async function garantirPreco(
  produtoId: string,
  lookupKey: string,
  valorCentavos: number,
  intervalo: 'month' | 'year' | null,
  metadata: Record<string, string>,
): Promise<Stripe.Price> {
  const existentes = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })
  const encontrado = existentes.data[0]
  const igual =
    encontrado &&
    encontrado.product === produtoId &&
    encontrado.unit_amount === valorCentavos &&
    (encontrado.recurring?.interval ?? null) === intervalo &&
    Object.entries(metadata).every(([k, v]) => encontrado.metadata[k] === v)
  if (encontrado && igual) return encontrado

  const novo = await stripe.prices.create({
    product: produtoId,
    currency: 'brl',
    unit_amount: valorCentavos,
    ...(intervalo ? { recurring: { interval: intervalo } } : {}),
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    nickname: lookupKey,
    metadata,
  })
  if (encontrado) {
    await stripe.prices.update(encontrado.id, { active: false })
    console.log(`  (price antigo ${encontrado.id} — ${encontrado.unit_amount} centavos — arquivado)`)
  }
  return novo
}

async function garantirWebhook(url: string): Promise<{ secret: string | null; jaExistia: boolean }> {
  const existentes = await stripe.webhookEndpoints.list({ limit: 100 })
  const encontrado = existentes.data.find((w) => w.url === url)
  if (encontrado) return { secret: null, jaExistia: true } // o signing secret só vem no retorno da criação
  const criado = await stripe.webhookEndpoints.create({ url, enabled_events: EVENTOS_WEBHOOK })
  return { secret: criado.secret ?? null, jaExistia: false }
}

/**
 * Customer Portal (Configuracoes.jsx → "Gerenciar assinatura"): cartão,
 * faturas e cancelamento. Troca de plano pelo portal fica DESLIGADA: o
 * Stripe exige intervalos distintos por produto no portal, e os dois
 * ciclos (12 meses / sem fidelidade) são mensais — além disso, trocar
 * sozinho de "12 meses" pra outro preço furaria a fidelidade. Mudança
 * de plano passa pelo suporte.
 */
async function garantirPortalConfig(): Promise<void> {
  const features: Stripe.BillingPortal.ConfigurationCreateParams.Features = {
    subscription_update: { enabled: false },
    payment_method_update: { enabled: true },
    invoice_history: { enabled: true },
    subscription_cancel: { enabled: true, mode: 'at_period_end' },
  }

  const existentes = await stripe.billingPortal.configurations.list({ limit: 100 })
  const atual = existentes.data.find((c) => c.is_default) ?? existentes.data[0]

  if (atual) {
    // `products: ''` esvazia a lista antiga (que apontava pros Prices arquivados) — o Stripe valida mesmo com enabled: false.
    await stripe.billingPortal.configurations.update(atual.id, {
      features: { ...features, subscription_update: { enabled: false, products: '' } },
    })
  } else {
    // A primeira configuration criada numa conta vira `is_default` automaticamente —
    // não existe param pra setar isso via API (a Stripe rejeita `is_default` no create/update).
    await stripe.billingPortal.configurations.create({
      features,
      business_profile: { headline: 'Gerencie sua assinatura ALPHADATA' },
    })
  }
}

async function main() {
  const priceIdsPorEnvVar: Record<string, string> = {}

  for (const plano of PLANOS_COM_CHECKOUT) {
    const config = getConfigPlano(plano)
    console.log(`Plano ${config.nomeMarketing} (${plano}):`)

    const produto = await garantirProduto({ plano }, `ALPHADATA ${config.nomeMarketing}`, `Plano ${config.nomeMarketing} (${config.descricaoCurta})`)
    console.log(`  produto: ${produto.id}`)

    const ciclos: { ciclo: CicloCobranca; valor: number; rotulo: string }[] = [
      { ciclo: 'mensal', valor: config.precoMensalCentavos, rotulo: 'sem fidelidade' },
      { ciclo: 'anual', valor: config.precoAnualMensalCentavos!, rotulo: 'plano 12 meses' },
    ]

    for (const { ciclo, valor, rotulo } of ciclos) {
      const preco = await garantirPreco(produto.id, `${plano}_${ciclo}`, valor, 'month', { plano, ciclo })
      console.log(`  price (${rotulo}): ${preco.id} — R$ ${(valor / 100).toFixed(2)}/mês`)
      priceIdsPorEnvVar[`STRIPE_PRICE_${plano.toUpperCase()}_${ciclo.toUpperCase()}`] = preco.id
    }
    console.log()
  }

  console.log('Implementação:')
  const produtoImplementacao = await garantirProduto(
    { tipo: 'implementacao' },
    'Implementação ALPHADATA',
    'Configuração da IA no WhatsApp e integração com o sistema — cobrança única',
  )
  const precoImplementacao = await garantirPreco(produtoImplementacao.id, 'implementacao_unica', TAXA_IMPLEMENTACAO_CENTAVOS, null, { tipo: 'implementacao' })
  console.log(`  price (único): ${precoImplementacao.id} — R$ ${(TAXA_IMPLEMENTACAO_CENTAVOS / 100).toFixed(2)}\n`)
  priceIdsPorEnvVar['STRIPE_PRICE_IMPLEMENTACAO'] = precoImplementacao.id

  await garantirPortalConfig()
  console.log('Customer Portal configurado: cartão, faturas e cancelamento (troca de plano via suporte).\n')

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
