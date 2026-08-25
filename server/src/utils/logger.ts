/**
 * Logger mínimo baseado em `console`, com a mesma assinatura de
 * chamada que o código já usa em todo lugar: `logger.info({...}, 'msg')`.
 *
 * Antes usava pino — trocado ao portar o backend pra Cloudflare
 * Workers: pino depende de APIs Node (process.stdout, worker_threads
 * pro transport bonito) que não existem de forma confiável no runtime
 * de Workers, mesmo com `nodejs_compat`. `console.log` é suportado
 * nativamente em Workers e no Node, então isso roda igual nos dois
 * lugares sem nenhuma dependência a mais.
 */
type Nivel = 'debug' | 'info' | 'warn' | 'error'

const PESO_NIVEL: Record<Nivel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function nivelMinimo(): number {
  const configurado = (process.env['LOG_LEVEL'] as Nivel | undefined) ?? 'info'
  return PESO_NIVEL[configurado] ?? PESO_NIVEL.info
}

function registrar(nivel: Nivel, contexto: unknown, mensagem?: string): void {
  if (PESO_NIVEL[nivel] < nivelMinimo()) return

  const linha = {
    nivel,
    tempo: new Date().toISOString(),
    ...(typeof contexto === 'string' ? { mensagem: contexto } : { ...toObjetoRegistravel(contexto), mensagem }),
  }

  const saida = JSON.stringify(linha, substituirErros)
  if (nivel === 'error') console.error(saida)
  else if (nivel === 'warn') console.warn(saida)
  else console.log(saida)
}

function toObjetoRegistravel(valor: unknown): Record<string, unknown> {
  return typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : { valor }
}

/** `JSON.stringify` ignora `message`/`stack` de um Error por padrão (não são "own enumerable properties") — sem isso, `logger.error({ err }, ...)` vira `{}` no log. */
function substituirErros(_chave: string, valor: unknown): unknown {
  if (valor instanceof Error) {
    return { nome: valor.name, mensagem: valor.message, stack: valor.stack, ...(('causa' in valor) ? { causa: (valor as { causa?: unknown }).causa } : {}) }
  }
  return valor
}

export const logger = {
  debug: (contexto: unknown, mensagem?: string) => registrar('debug', contexto, mensagem),
  info: (contexto: unknown, mensagem?: string) => registrar('info', contexto, mensagem),
  warn: (contexto: unknown, mensagem?: string) => registrar('warn', contexto, mensagem),
  error: (contexto: unknown, mensagem?: string) => registrar('error', contexto, mensagem),
}
