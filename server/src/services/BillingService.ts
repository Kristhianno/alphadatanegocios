/**
 * Comunicação com o Stripe: checkout do teste grátis de 7 dias, sync
 * de assinatura (checkout concluído + mudanças feitas no Customer
 * Portal) e abertura do Portal. `sincronizarAssinatura` é o único
 * lugar que escreve status/plano/ciclo vindos do Stripe na `Conta` —
 * chamado tanto por POST /billing/confirmar-checkout (assim que o
 * usuário volta do Checkout) quanto pelo webhook (fonte de verdade
 * assíncrona, cobre aba fechada antes de voltar e mudanças feitas
 * depois, direto no Portal). Sempre busca a subscription de novo no
 * Stripe (com o produto expandido) em vez de confiar no objeto que
 * veio dentro do evento do webhook — o metadata do produto (plano) só
 * vem populado com o expand.
 */
import Stripe from 'stripe'
import type { Cliente } from '../config/database.config.js'
import { PLANOS_COM_CHECKOUT, obterStripePriceId } from '../config/planos.config.js'
import { getAppUrl, getStripe } from '../config/stripe.config.js'
import type { CicloCobranca, Conta, Plano, StatusConta } from '../models/User.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import { ErroProibido, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

function mapearStatus(status: Stripe.Subscription.Status): StatusConta {
  switch (status) {
    case 'trialing':
    case 'active':
      return 'ativo'
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelado'
    default:
      // past_due, unpaid, incomplete, paused — trata como suspenso até resolver
      return 'suspenso'
  }
}

export class BillingService {
  private readonly contas: ContaRepository

  constructor(client: Cliente) {
    this.contas = new ContaRepository(client)
  }

  /**
   * Cria a Checkout Session do teste grátis — conta já existe e já
   * passou pelo onboarding (ver Login.jsx). `override` deixa a tela de
   * /checkout trocar o plano/ciclo escolhido na landing antes de pagar
   * (persiste na conta antes de montar a sessão).
   */
  async criarSessaoCheckout(
    conta: Conta,
    emailAdmin: string,
    override?: { plano?: Plano | undefined; ciclo?: CicloCobranca | undefined },
  ): Promise<{ url: string }> {
    let contaAtual = conta
    if (override?.plano || override?.ciclo) {
      if (override.plano && !PLANOS_COM_CHECKOUT.includes(override.plano)) {
        throw new ErroValidacao(`O plano "${override.plano}" não tem checkout self-service — fale com o time comercial.`)
      }
      contaAtual = await this.contas.atualizar(conta.id, {
        ...(override.plano ? { plano: override.plano } : {}),
        ...(override.ciclo ? { cicloCobranca: override.ciclo } : {}),
      })
    }

    if (!PLANOS_COM_CHECKOUT.includes(contaAtual.plano)) {
      throw new ErroValidacao(`O plano "${contaAtual.plano}" não tem checkout self-service — fale com o time comercial.`)
    }
    if (!contaAtual.cicloCobranca) {
      throw new ErroValidacao('Escolha o ciclo de cobrança (mensal ou anual) antes de continuar.')
    }

    const appUrl = getAppUrl()
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: obterStripePriceId(contaAtual.plano, contaAtual.cicloCobranca), quantity: 1 }],
      subscription_data: { trial_period_days: 7, metadata: { contaId: conta.id } },
      client_reference_id: conta.id,
      success_url: `${appUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
    }
    if (conta.stripeCustomerId) {
      params.customer = conta.stripeCustomerId
    } else {
      params.customer_email = emailAdmin
    }

    const session = await getStripe().checkout.sessions.create(params)
    if (!session.url) throw new Error('Stripe não retornou a URL da sessão de checkout.')
    return { url: session.url }
  }

  /** Chamado pela página /checkout/sucesso assim que o usuário volta do Stripe. */
  async confirmarCheckout(contaId: string, sessionId: string): Promise<Conta> {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    if (session.client_reference_id !== contaId) {
      throw new ErroProibido('Esta sessão de checkout não pertence a esta conta.')
    }
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    if (!subscriptionId) throw new ErroValidacao('O checkout ainda não foi concluído no Stripe.')

    return this.sincronizarAssinatura(contaId, subscriptionId)
  }

  /** Abre o Customer Portal — troca de cartão e upgrade/downgrade de plano em uma tela só (configurado em stripe-setup.ts). */
  async criarSessaoPortal(conta: Conta): Promise<{ url: string }> {
    if (!conta.stripeCustomerId) {
      throw new ErroValidacao('Esta conta ainda não tem uma assinatura ativa no Stripe.')
    }
    const session = await getStripe().billingPortal.sessions.create({
      customer: conta.stripeCustomerId,
      return_url: `${getAppUrl()}/admin/configuracoes`,
    })
    return { url: session.url }
  }

  /** Verifica a assinatura no Stripe e grava status/plano/ciclo/trial na Conta. Idempotente. */
  private async sincronizarAssinatura(contaId: string, subscriptionId: string): Promise<Conta> {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product'],
    })

    const price = subscription.items.data[0]?.price
    const produto = price?.product as Stripe.Product | undefined
    const plano = produto?.metadata?.['plano'] as Plano | undefined
    const ciclo: CicloCobranca | undefined =
      price?.recurring?.interval === 'year' ? 'anual' : price?.recurring?.interval === 'month' ? 'mensal' : undefined
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

    const atualizacao: Partial<Conta> = {
      status: mapearStatus(subscription.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      trialTerminaEm: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      assinaturaPendente: false,
    }
    if (plano) atualizacao.plano = plano
    if (ciclo) atualizacao.cicloCobranca = ciclo

    const conta = await this.contas.atualizar(contaId, atualizacao)
    logger.info({ contaId, subscriptionId, status: subscription.status }, 'Assinatura sincronizada com o Stripe.')
    return conta
  }

  /** Verifica a assinatura + despacha pros handlers. `payload` precisa ser o corpo cru da requisição (string), não json já parseado. */
  async processarWebhook(payload: string, assinaturaHeader: string): Promise<void> {
    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET ausente.')

    // constructEventAsync (em vez de constructEvent) porque Cloudflare Workers não tem o módulo `crypto` do Node —
    // a variante async usa WebCrypto por baixo, compatível com os dois runtimes.
    let evento: Stripe.Event
    try {
      evento = await getStripe().webhooks.constructEventAsync(payload, assinaturaHeader, webhookSecret)
    } catch (erro) {
      throw new ErroValidacao(`Assinatura do webhook inválida: ${erro instanceof Error ? erro.message : 'erro desconhecido'}.`)
    }

    switch (evento.type) {
      case 'checkout.session.completed': {
        const session = evento.data.object
        const contaId = session.client_reference_id
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (contaId && subscriptionId) await this.sincronizarAssinatura(contaId, subscriptionId)
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = evento.data.object
        const contaId = (subscription.metadata?.['contaId'] as string | undefined) ?? (await this.contas.buscarPorStripeSubscriptionId(subscription.id))?.id
        if (contaId) {
          await this.sincronizarAssinatura(contaId, subscription.id)
        } else {
          logger.warn({ subscriptionId: subscription.id }, 'Webhook do Stripe: nenhuma conta encontrada para esta subscription.')
        }
        break
      }
      default:
        // outros eventos (invoice.*, payment_intent.*, ...) não são tratados de propósito — não temos ação pra eles hoje.
        break
    }
  }
}
