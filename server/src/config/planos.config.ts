/**
 * Dados dos planos de assinatura (`Conta.plano`). Puramente
 * declarativo — nenhuma rota ainda impõe `limiteUsuarios`/`limiteAgendamentosMes`;
 * isso ficaria pra um middleware de "verificar limite do plano" que
 * ninguém pediu ainda. Registrado aqui pra não fingir que o
 * enforcement existe quando não existe.
 *
 * `nomeMarketing` é o nome usado na landing page e no checkout
 * ("Essencial"/"Completo" desde 2026-11; antes "Starter"/"Pro") —
 * mantido separado de `nome` (usado internamente,
 * ex: rótulo de plano em telas administrativas) pra não precisar
 * renomear o `Plano` técnico (`startup`/`profissional`) só porque o
 * nome de vendas mudou.
 */
import type { CicloCobranca, Plano } from '../models/User.js'

export interface ConfigPlano {
  plano: Plano
  nome: string
  nomeMarketing: string
  /** Subtítulo curto do plano (ex: "sem follow-up") — exibido junto do nome. */
  descricaoCurta: string
  /** Mensalidade SEM fidelidade — ciclo técnico `mensal`. */
  precoMensalCentavos: number
  /**
   * Mensalidade no plano de 12 meses (COM fidelidade) — ciclo técnico
   * `anual`. Cobrada todo mês (não à vista); a fidelidade é contratual.
   * null = sem plano de 12 meses (ex: Plano Especial, sob consulta).
   */
  precoAnualMensalCentavos: number | null
  /** Total do contrato de 12 meses (precoAnualMensalCentavos * 12) — informativo. */
  precoAnualTotalCentavos: number | null
  /** Taxa única de implementação, cobrada junto da primeira mensalidade. */
  taxaImplementacaoCentavos: number
  limiteUsuarios: number
  /** null = ilimitado. */
  limiteAgendamentosMes: number | null
  /** null = ilimitado. */
  limiteContratosMes: number | null
  recursos: string[]
}

/** Implementação (configuração da IA no WhatsApp + integração com o sistema) — igual para os dois planos. */
export const TAXA_IMPLEMENTACAO_CENTAVOS = 199_700

/** Meses de fidelidade do ciclo `anual` ("plano de 12 meses"). */
export const FIDELIDADE_MESES = 12

const RECURSOS_ESSENCIAL = [
  'IA no WhatsApp: atendimento 24h com texto e áudio',
  'Orçamento e pacotes em PDF na conversa',
  'Agenda: consulta e reserva de datas',
  'Coleta dos dados do contrato',
  'Sistema ALPHADATA integrado: agenda, orçamentos, contratos e financeiro',
  'Suporte em horário comercial, resposta em até 48h úteis',
]

const PLANOS_CONFIG: Record<Plano, ConfigPlano> = {
  startup: {
    plano: 'startup',
    nome: 'Essencial',
    nomeMarketing: 'Essencial',
    descricaoCurta: 'sem follow-up',
    precoMensalCentavos: 69_700,
    precoAnualMensalCentavos: 49_700,
    precoAnualTotalCentavos: 49_700 * FIDELIDADE_MESES,
    taxaImplementacaoCentavos: TAXA_IMPLEMENTACAO_CENTAVOS,
    limiteUsuarios: 3,
    limiteAgendamentosMes: 200,
    limiteContratosMes: 200,
    recursos: RECURSOS_ESSENCIAL,
  },
  profissional: {
    plano: 'profissional',
    nome: 'Completo',
    nomeMarketing: 'Completo',
    descricaoCurta: 'com follow-up',
    precoMensalCentavos: 99_700,
    precoAnualMensalCentavos: 79_700,
    precoAnualTotalCentavos: 79_700 * FIDELIDADE_MESES,
    taxaImplementacaoCentavos: TAXA_IMPLEMENTACAO_CENTAVOS,
    limiteUsuarios: 15,
    limiteAgendamentosMes: null,
    limiteContratosMes: null,
    recursos: [
      'Tudo do Essencial',
      'CRM em kanban com todos os contatos',
      'Follow-up: alerta após 3 dias sem resposta, com o resumo da conversa',
      'Reunião mensal de resultados',
      'Suporte prioritário, resposta em até 24h úteis',
    ],
  },
  enterprise: {
    plano: 'enterprise',
    nome: 'Plano Especial',
    nomeMarketing: 'Plano Especial',
    descricaoCurta: 'monte seu plano',
    precoMensalCentavos: 0,
    precoAnualMensalCentavos: null,
    precoAnualTotalCentavos: null,
    taxaImplementacaoCentavos: TAXA_IMPLEMENTACAO_CENTAVOS,
    limiteUsuarios: 100,
    limiteAgendamentosMes: null,
    limiteContratosMes: null,
    recursos: [
      'Combine os recursos do Essencial e do Completo do seu jeito',
      'Pensado pra operações com necessidades específicas',
      'Condições combinadas direto com o nosso time',
    ],
  },
}

/**
 * Planos vendidos com checkout self-service via Stripe (landing/onboarding).
 * `enterprise` ("Plano Especial / monte seu plano") fica de fora — é sob
 * consulta, via formulário de contato.
 *
 * Os recursos de IA no WhatsApp, CRM em kanban e follow-up rodam numa
 * ferramenta externa implantada pela ALPHADATA (por isso a taxa de
 * implementação); este sistema não os implementa nem os restringe.
 */
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

/** Id do Price (único, não recorrente) da taxa de implementação — ver stripe-setup.ts. */
export function obterStripePriceIdImplementacao(): string {
  const priceId = process.env['STRIPE_PRICE_IMPLEMENTACAO']
  if (!priceId) {
    throw new Error('Variável de ambiente "STRIPE_PRICE_IMPLEMENTACAO" ausente — rode server/scripts/stripe-setup.ts e configure o price id.')
  }
  return priceId
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
