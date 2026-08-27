import { describe, expect, it } from 'vitest'
import { calcularAssinaturaPendente, trialAindaAtivo } from '../../src/utils/assinatura.js'

const HORA = 60 * 60 * 1000

describe('trialAindaAtivo', () => {
  it('true quando trialTerminaEm está no futuro', () => {
    expect(trialAindaAtivo(new Date(Date.now() + HORA))).toBe(true)
  })

  it('false quando trialTerminaEm já passou', () => {
    expect(trialAindaAtivo(new Date(Date.now() - HORA))).toBe(false)
  })

  it('false quando trialTerminaEm é null', () => {
    expect(trialAindaAtivo(null)).toBe(false)
  })
})

describe('calcularAssinaturaPendente', () => {
  it('conta nova, trial ativo: acesso liberado mesmo sem assinatura no Stripe', () => {
    const pendente = calcularAssinaturaPendente({
      trialTerminaEm: new Date(Date.now() + HORA),
      stripeSubscriptionId: null,
      status: 'ativo',
      assinaturaPendente: false,
    })
    expect(pendente).toBe(false)
  })

  it('trial expirado e sem assinatura paga: bloqueia (manda pro checkout)', () => {
    const pendente = calcularAssinaturaPendente({
      trialTerminaEm: new Date(Date.now() - HORA),
      stripeSubscriptionId: null,
      status: 'ativo',
      assinaturaPendente: false,
    })
    expect(pendente).toBe(true)
  })

  it('trial expirado mas já virou assinante pago: não bloqueia', () => {
    const pendente = calcularAssinaturaPendente({
      trialTerminaEm: new Date(Date.now() - HORA),
      stripeSubscriptionId: 'sub_123',
      status: 'ativo',
      assinaturaPendente: false,
    })
    expect(pendente).toBe(false)
  })

  it('assinante pago com status suspenso (ex: pagamento falhou): volta a bloquear', () => {
    const pendente = calcularAssinaturaPendente({
      trialTerminaEm: new Date(Date.now() - HORA),
      stripeSubscriptionId: 'sub_123',
      status: 'suspenso',
      assinaturaPendente: false,
    })
    expect(pendente).toBe(true)
  })

  it('conta antiga sem trialTerminaEm: usa o valor gravado, não recalcula', () => {
    expect(
      calcularAssinaturaPendente({ trialTerminaEm: null, stripeSubscriptionId: null, status: 'ativo', assinaturaPendente: false }),
    ).toBe(false)
    expect(
      calcularAssinaturaPendente({ trialTerminaEm: null, stripeSubscriptionId: null, status: 'ativo', assinaturaPendente: true }),
    ).toBe(true)
  })
})
