import { describe, expect, it } from 'vitest'
import { BillingService } from '../../src/services/BillingService.js'
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
