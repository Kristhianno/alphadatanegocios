/**
 * Regra do teste grátis de 7 dias: roda inteiramente local (sem cartão,
 * sem Stripe) — `trialTerminaEm` é gravado na conta já no cadastro
 * (ver UserService.criarUsuario) e só quando ele já passou, e a conta
 * ainda não tem uma assinatura paga ativa, é que o acesso é bloqueado
 * (ver ContaRepository.paraDominio, que usa `calcularAssinaturaPendente`
 * pra popular `Conta.assinaturaPendente` de forma sempre atualizada,
 * já que "o trial acabou" é um fato que muda sozinho com o tempo, não
 * um evento que alguém dispara).
 */
import type { Conta } from '../models/User.js'

export function trialAindaAtivo(trialTerminaEm: Date | null): boolean {
  return trialTerminaEm != null && trialTerminaEm.getTime() > Date.now()
}

/**
 * Contas sem `trialTerminaEm` (cadastradas antes desse campo virar
 * obrigatório, ou que nunca chegaram a escolher plano) mantêm o valor
 * gravado no banco — sem essa data de referência não dá pra saber se
 * o teste "acabou", então não faz sentido bloquear ninguém por conta
 * disso.
 */
export function calcularAssinaturaPendente(
  conta: Pick<Conta, 'trialTerminaEm' | 'stripeSubscriptionId' | 'status' | 'assinaturaPendente'>,
): boolean {
  if (!conta.trialTerminaEm) return conta.assinaturaPendente
  const assinaturaPaga = !!conta.stripeSubscriptionId && conta.status === 'ativo'
  return !trialAindaAtivo(conta.trialTerminaEm) && !assinaturaPaga
}
