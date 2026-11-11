import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BillingService, cicloDoPrice, montarItensCheckout } from '../../src/services/BillingService.js'
import { getConfigPlano, listarPlanosComCheckout } from '../../src/config/planos.config.js'
import type { Conta } from '../../src/models/User.js'
import { ErroValidacao } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

const HORA = 60 * 60 * 1000

/** Semeia uma conta crua na tabela fake e devolve um objeto `Conta` de domínio com o mesmo id, pra passar pro service (que espera receber a Conta já carregada, como as rotas fazem via carregarContexto). */
function semearConta(cliente: ReturnType<typeof criarClienteFake>, overrides: Partial<Record<string, unknown>> = {}): Conta {
  const [linha] = cliente.semear('contas', [
    {
      nome_empresa: 'Confeitaria da Ana',
      tipo_negocio: null,
      plano: 'startup',
      status: 'ativo',
      configuracoes_gerais: {},
      ciclo_cobranca: 'mensal',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      trial_termina_em: new Date(Date.now() + 7 * 24 * HORA).toISOString(),
      assinatura_pendente: false,
      ...overrides,
    },
  ])
  return {
    id: linha!['id'] as string,
    nomeEmpresa: linha!['nome_empresa'] as string,
    tipoNegocio: null,
    plano: linha!['plano'] as Conta['plano'],
    status: linha!['status'] as Conta['status'],
    configuracoesGerais: {},
    cicloCobranca: (linha!['ciclo_cobranca'] as Conta['cicloCobranca']) ?? null,
    stripeCustomerId: (linha!['stripe_customer_id'] as string) ?? null,
    stripeSubscriptionId: (linha!['stripe_subscription_id'] as string) ?? null,
    trialTerminaEm: linha!['trial_termina_em'] ? new Date(linha!['trial_termina_em'] as string) : null,
    assinaturaPendente: (linha!['assinatura_pendente'] as boolean) ?? false,
    criadoEm: new Date(linha!['criado_em'] as string),
    atualizadoEm: new Date(linha!['atualizado_em'] as string),
  }
}

describe('BillingService.trocarPlanoTrial', () => {
  it('troca plano/ciclo direto na conta, sem Stripe, enquanto o trial está ativo', async () => {
    const cliente = criarClienteFake()
    const conta = semearConta(cliente)
    const service = new BillingService(paraTipado(cliente))

    const atualizada = await service.trocarPlanoTrial(conta, 'profissional', 'anual')
    expect(atualizada.plano).toBe('profissional')
    expect(atualizada.cicloCobranca).toBe('anual')
  })

  it('rejeita se a conta já tem uma assinatura no Stripe (deve usar o Customer Portal, não isto)', async () => {
    const cliente = criarClienteFake()
    const conta = semearConta(cliente, { stripe_customer_id: 'cus_123' })
    const service = new BillingService(paraTipado(cliente))

    await expect(service.trocarPlanoTrial(conta, 'profissional', 'mensal')).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('rejeita se o trial já expirou', async () => {
    const cliente = criarClienteFake()
    const conta = semearConta(cliente, { trial_termina_em: new Date(Date.now() - HORA).toISOString() })
    const service = new BillingService(paraTipado(cliente))

    await expect(service.trocarPlanoTrial(conta, 'profissional', 'mensal')).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('rejeita se a conta nunca teve um trial local (trialTerminaEm null)', async () => {
    const cliente = criarClienteFake()
    const conta = semearConta(cliente, { trial_termina_em: null })
    const service = new BillingService(paraTipado(cliente))

    await expect(service.trocarPlanoTrial(conta, 'profissional', 'mensal')).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('rejeita plano sem checkout self-service (enterprise)', async () => {
    const cliente = criarClienteFake()
    const conta = semearConta(cliente)
    const service = new BillingService(paraTipado(cliente))

    await expect(service.trocarPlanoTrial(conta, 'enterprise', 'mensal')).rejects.toBeInstanceOf(ErroValidacao)
  })
})

describe('montarItensCheckout', () => {
  const ENV = {
    STRIPE_PRICE_STARTUP_MENSAL: 'price_ess_sem_fid',
    STRIPE_PRICE_STARTUP_ANUAL: 'price_ess_12m',
    STRIPE_PRICE_PROFISSIONAL_MENSAL: 'price_comp_sem_fid',
    STRIPE_PRICE_PROFISSIONAL_ANUAL: 'price_comp_12m',
    STRIPE_PRICE_IMPLEMENTACAO: 'price_impl',
  }
  let anterior: Record<string, string | undefined>
  beforeEach(() => {
    anterior = Object.fromEntries(Object.keys(ENV).map((k) => [k, process.env[k]]))
    Object.assign(process.env, ENV)
  })
  afterEach(() => {
    for (const [k, v] of Object.entries(anterior)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  })

  it('na primeira assinatura cobra a mensalidade do plano+ciclo e a taxa de implementação', () => {
    const itens = montarItensCheckout({ plano: 'profissional', stripeSubscriptionId: null }, 'anual')
    expect(itens).toEqual([
      { price: 'price_comp_12m', quantity: 1 },
      { price: 'price_impl', quantity: 1 },
    ])
  })

  it('quem já teve assinatura não paga implementação de novo', () => {
    const itens = montarItensCheckout({ plano: 'startup', stripeSubscriptionId: 'sub_antiga' }, 'mensal')
    expect(itens).toEqual([{ price: 'price_ess_sem_fid', quantity: 1 }])
  })

  it('falha alto se o price da implementação não estiver configurado (nunca cobra a menos em silêncio)', () => {
    delete process.env['STRIPE_PRICE_IMPLEMENTACAO']
    expect(() => montarItensCheckout({ plano: 'startup', stripeSubscriptionId: null }, 'mensal')).toThrow(/STRIPE_PRICE_IMPLEMENTACAO/)
  })
})

describe('cicloDoPrice', () => {
  it('usa metadata.ciclo — os dois ciclos agora são mensais', () => {
    expect(cicloDoPrice({ metadata: { ciclo: 'anual' }, recurring: { interval: 'month' } as never })).toBe('anual')
    expect(cicloDoPrice({ metadata: { ciclo: 'mensal' }, recurring: { interval: 'month' } as never })).toBe('mensal')
  })

  it('cai no intervalo pros Prices antigos sem metadata', () => {
    expect(cicloDoPrice({ metadata: {}, recurring: { interval: 'year' } as never })).toBe('anual')
    expect(cicloDoPrice({ metadata: {}, recurring: { interval: 'month' } as never })).toBe('mensal')
  })
})

describe('planos (print de 2026-11)', () => {
  it('Essencial 497 (12 meses) / 697 (sem fidelidade); Completo 797 / 997; implementação 1.997', () => {
    expect(listarPlanosComCheckout().map((p) => p.nomeMarketing)).toEqual(['Essencial', 'Completo'])
    expect(getConfigPlano('startup')).toMatchObject({ precoAnualMensalCentavos: 49_700, precoMensalCentavos: 69_700, taxaImplementacaoCentavos: 199_700 })
    expect(getConfigPlano('profissional')).toMatchObject({ precoAnualMensalCentavos: 79_700, precoMensalCentavos: 99_700, taxaImplementacaoCentavos: 199_700 })
  })
})
