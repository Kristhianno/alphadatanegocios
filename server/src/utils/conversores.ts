/**
 * Conversões de formato de saída (moeda/data em pt-BR). Deliberadamente
 * NÃO inclui recase snake_case↔camelCase de linha de banco — essa
 * conversão já é explícita em cada Repository (paraDominio/paraLinha),
 * de propósito, não "mágica" (ver comentário em repositories/Repository.ts).
 * Um conversor genérico aqui reintroduziria exatamente o que aquele
 * design evitou.
 */

const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
// timeZone fixo em 'UTC': todo Date aqui vem de uma coluna timestamptz do
// Postgres (já normalizada pra UTC) — sem isso, o mesmo Date formataria
// diferente dependendo do fuso horário local do processo Node, o que é
// exatamente o tipo de coisa que só aparece rodando em outro servidor.
const FORMATADOR_DATA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

export function formatarMoedaBr(valor: number): string {
  return FORMATADOR_MOEDA.format(valor)
}

export function formatarDataBr(data: Date): string {
  return FORMATADOR_DATA.format(data)
}

/** Formato `YYYY-MM-DD` — o que colunas Postgres `date` (não `timestamptz`), como `manutencoes_preventivas.proxima_execucao`, esperam. */
export function paraDataSql(data: Date): string {
  return data.toISOString().slice(0, 10)
}
