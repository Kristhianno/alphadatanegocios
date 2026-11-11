// Rótulos de exibição dos planos e ciclos — espelha server/src/config/planos.config.ts.
// Um lugar só (antes cada tela tinha sua cópia de NOME_MARKETING_PLANO).

export const NOME_MARKETING_PLANO = { startup: 'Essencial', profissional: 'Completo', enterprise: 'Plano Especial' }

// Ciclos técnicos continuam 'anual' | 'mensal' (banco/Stripe); pro cliente
// são "plano de 12 meses" (com fidelidade, cobrado por mês) e "sem fidelidade".
export const OPCOES_CICLO = [
  ['anual', '12 meses'],
  ['mensal', 'Sem fidelidade'],
]

export const ROTULO_CICLO = { anual: 'plano de 12 meses', mensal: 'sem fidelidade' }

/** Ciclo pré-selecionado em landing, cadastro e checkout — o plano de 12 meses é o preço de vitrine. */
export const CICLO_PADRAO = 'anual'

export function formatarPreco(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: centavos % 100 ? 2 : 0 })
}

export function precoMensalDoCiclo(config, ciclo) {
  return ciclo === 'anual' ? config.precoAnualMensalCentavos : config.precoMensalCentavos
}
