/**
 * Cliente Stripe do backend. Mesmo padrão lazy-singleton de
 * `database.config.ts`: `process.env` só reflete os bindings do Worker
 * durante o processamento de uma requisição, então ler `STRIPE_SECRET_KEY`
 * no topo do módulo falharia no cold start.
 *
 * `httpClient: Stripe.createFetchHttpClient()` é o que permite essa
 * mesma configuração rodar tanto em Cloudflare Workers (sem os módulos
 * `http`/`crypto` do Node) quanto em Node local (dev com tsx, testes) —
 * o cliente HTTP padrão do SDK depende de `http.request`, que não
 * existe em Workers.
 */
import Stripe from 'stripe'
import { logger } from '../utils/logger.js'

let stripeCache: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeCache) return stripeCache

  const STRIPE_SECRET_KEY = process.env['STRIPE_SECRET_KEY']
  if (!STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY é obrigatório. Copie server/.dev.vars.example para server/.dev.vars (wrangler dev) e preencha; em produção, configure via `wrangler secret put`.'
    )
  }

  stripeCache = new Stripe(STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
  })
  logger.debug('Cliente Stripe inicializado.')
  return stripeCache
}

/** URL pública do frontend, usada pra montar success_url/cancel_url/return_url — nunca a partir de header do request (evita open redirect). */
export function getAppUrl(): string {
  const APP_URL = process.env['APP_URL']
  if (!APP_URL) {
    throw new Error('APP_URL é obrigatório (ex: https://www.alphadatanegocios.com.br). Configure em server/.dev.vars ou via `wrangler secret put`.')
  }
  return APP_URL.replace(/\/$/, '')
}
