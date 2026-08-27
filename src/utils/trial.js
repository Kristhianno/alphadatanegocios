// Teste grátis de 7 dias: roda local, sem Stripe/cartão (ver
// server/src/utils/assinatura.ts). `trialTerminaEm` vem da Conta
// (ver useAuth.jsx/montarSessao) — null pra contas que já têm uma
// assinatura paga ativa ou que nunca tiveram um trial local.

/** Dias inteiros restantes até o fim do trial, ou null se não há trial ativo. */
export function diasRestantesTrial(trialTerminaEm) {
  if (!trialTerminaEm) return null
  const diff = new Date(trialTerminaEm).getTime() - Date.now()
  if (diff <= 0) return null
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function trialAindaAtivo(trialTerminaEm) {
  return diasRestantesTrial(trialTerminaEm) != null
}
