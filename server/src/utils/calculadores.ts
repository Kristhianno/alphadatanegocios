/**
 * Cálculos numéricos reutilizados por mais de um service — antes da
 * Tarefa 6, cada um fazia seu próprio `Math.round(x * 100) / 100` (em
 * ConfeitariaService, SalaoFestasService e ManutencaoService, cada um
 * podendo divergir sutilmente). Centralizado aqui e os 3 services
 * atualizados pra usar esta função.
 *
 * Não inclui nada que o Postgres já calcula via coluna gerada (ex:
 * margem_lucro_percentual, horas_trabalhadas) — replicar essas contas
 * em JS arriscaria divergir do valor que o banco realmente guarda,
 * mesma razão documentada em ConfeitariaService.calcularMargemLucro.
 */

/** Arredonda pra 2 casas decimais — evita o erro de ponto flutuante de somar `0.1 + 0.2` direto. */
export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100
}

/** Soma uma lista de valores monetários já arredondando o resultado. */
export function somarArredondado(valores: readonly number[]): number {
  return arredondarMoeda(valores.reduce((soma, v) => soma + v, 0))
}

/** Percentual de `parte` sobre `total`, arredondado a 2 casas — 0 quando `total` é 0 (não divide por zero). */
export function calcularPercentual(parte: number, total: number): number {
  if (total === 0) return 0
  return arredondarMoeda((parte / total) * 100)
}
