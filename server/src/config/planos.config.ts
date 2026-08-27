/**
 * Dados dos planos de assinatura (`Conta.plano`). Puramente
 * declarativo — nenhuma rota ainda impõe `limiteUsuarios`/`limiteAgendamentosMes`;
 * isso ficaria pra um middleware de "verificar limite do plano" que
 * ninguém pediu ainda. Registrado aqui pra não fingir que o
 * enforcement existe quando não existe.
 *
 * `nomeMarketing` é o nome usado na landing page e no checkout
 * ("Starter"/"Pro") — mantido separado de `nome` (usado internamente,
 * ex: rótulo de plano em telas administrativas) pra não precisar
 * renomear o `Plano` técnico (`startup`/`profissional`) só porque o
 * nome de vendas mudou.
 */
import type { CicloCobranca, Plano } from '../models/User.js'

export interface ConfigPlano {
  plano: Plano
  nome: string
  nomeMarketing: string
  precoMensalCentavos: number
  /** Preço mensal equivalente quando cobrado anualmente (à vista, 1x/ano). null = sem cobrança anual disponível (ex: Enterprise, sob consulta). */
  precoAnualMensalCentavos: number | null
  /** Total cobrado de uma vez no ciclo anual (precoAnualMensalCentavos * 12). */
  precoAnualTotalCentavos: number | null
  limiteUsuarios: number
  /** null = ilimitado. */
  limiteAgendamentosMes: number | null
  recursos: string[]
}

const PLANOS_CONFIG: Record<Plano, ConfigPlano> = {
  startup: {
    plano: 'startup',
    nome: 'Startup',
    nomeMarketing: 'Starter',
    precoMensalCentavos: 6_990,
    precoAnualMensalCentavos: 4_990,
    precoAnualTotalCentavos: 59_880,
    limiteUsuarios: 3,
    limiteAgendamentosMes: 100,
    recursos: ['1 vertical de negócio', 'Agendamentos e catálogo', 'Suporte por email'],
  },
  profissional: {
    plano: 'profissional',
    nome: 'Profissional',
    nomeMarketing: 'Pro',
    precoMensalCentavos: 14_990,
    precoAnualMensalCentavos: 11_990,
    precoAnualTotalCentavos: 143_880,
    limiteUsuarios: 15,
    limiteAgendamentosMes: 1_000,
    recursos: ['1 vertical de negócio', 'Relatórios do vertical', 'Suporte prioritário'],
  },
  enterprise: {
    plano: 'enterprise',
    nome: 'Enterprise',
    nomeMarketing: 'Enterprise',
    precoMensalCentavos: 39_900,
    precoAnualMensalCentavos: null,
    precoAnualTotalCentavos: null,
    limiteUsuarios: 100,
    limiteAgendamentosMes: null,
    recursos: ['1 vertical de negócio', 'Relatórios avançados', 'Suporte dedicado'],
  },
}

/** Planos vendidos com checkout self-service via Stripe (landing/onboarding). Enterprise fica de fora — é sob consulta. */
export const PLANOS_COM_CHECKOUT: readonly Plano[] = ['startup', 'profissional']

export function getConfigPlano(plano: Plano): ConfigPlano {
  return PLANOS_CONFIG[plano]
}

export function listarPlanosDisponiveis(): ConfigPlano[] {
  return Object.values(PLANOS_CONFIG)
}

export function listarPlanosComCheckout(): ConfigPlano[] {
  return PLANOS_COM_CHECKOUT.map((plano) => PLANOS_CONFIG[plano])
}

const ENV_PRICE_ID_POR_PLANO_CICLO: Record<Plano, Record<CicloCobranca, string>> = {
  startup: { mensal: 'STRIPE_PRICE_STARTUP_MENSAL', anual: 'STRIPE_PRICE_STARTUP_ANUAL' },
  profissional: { mensal: 'STRIPE_PRICE_PROFISSIONAL_MENSAL', anual: 'STRIPE_PRICE_PROFISSIONAL_ANUAL' },
  enterprise: { mensal: '', anual: '' },
}

/** Id do Price no Stripe pra um plano+ciclo — lido de `process.env` (lazy, mesmo motivo de `stripe.config.ts`). */
export function obterStripePriceId(plano: Plano, ciclo: CicloCobranca): string {
  if (!PLANOS_COM_CHECKOUT.includes(plano)) {
    throw new Error(`Plano "${plano}" não tem checkout self-service via Stripe.`)
  }
  const nomeEnv = ENV_PRICE_ID_POR_PLANO_CICLO[plano][ciclo]
  const priceId = process.env[nomeEnv]
  if (!priceId) {
    throw new Error(`Variável de ambiente "${nomeEnv}" ausente — rode server/scripts/stripe-setup.ts e configure o price id.`)
  }
  return priceId
}
