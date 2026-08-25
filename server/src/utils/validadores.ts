/**
 * Validações reutilizáveis que não são só "formato de campo" (isso já é
 * Zod nos schemas de cada service) — regras com lógica própria (dígito
 * verificador de CPF/CNPJ) ou usadas em mais de um lugar. `validarUuid`
 * é o caso disso último: vive aqui, não em validacao.middleware.ts, pra
 * middleware e qualquer service que precise checar um id solto usarem a
 * mesma regra em vez de duas regexes que podem divergir com o tempo.
 */

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validarUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && REGEX_UUID.test(valor)
}

function calcularDigitoCpf(base: string, pesoInicial: number): number {
  let soma = 0
  for (let i = 0; i < base.length; i++) {
    soma += Number(base.charAt(i)) * (pesoInicial - i)
  }
  const resto = (soma * 10) % 11
  return resto === 10 ? 0 : resto
}

/** Validação por dígito verificador — não consulta a Receita Federal, só descarta números estruturalmente inválidos (sequência repetida, dígito verificador errado). */
export function validarCpf(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false

  const d1 = calcularDigitoCpf(digitos.slice(0, 9), 10)
  const d2 = calcularDigitoCpf(digitos.slice(0, 10), 11)
  return d1 === Number(digitos.charAt(9)) && d2 === Number(digitos.charAt(10))
}

function calcularDigitoCnpj(base: string, pesos: readonly number[]): number {
  let soma = 0
  for (let i = 0; i < base.length; i++) {
    soma += Number(base.charAt(i)) * pesos[i]!
  }
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function validarCnpj(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) return false

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = calcularDigitoCnpj(digitos.slice(0, 12), pesos1)
  const d2 = calcularDigitoCnpj(digitos.slice(0, 13), pesos2)
  return d1 === Number(digitos.charAt(12)) && d2 === Number(digitos.charAt(13))
}

/** Aceita CPF (11 dígitos) ou CNPJ (14 dígitos) no mesmo campo — é o que `clientes.documento` guarda ("CPF ou CNPJ", ver comentário na migration de schema_shared.sql). */
export function validarDocumento(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length === 11) return validarCpf(valor)
  if (digitos.length === 14) return validarCnpj(valor)
  return false
}

/** Telefone BR: 10 dígitos (fixo, DDD + 8) ou 11 (celular, DDD + 9) — só checa a quantidade de dígitos, não se o DDD existe de fato. */
export function validarTelefoneBr(valor: string): boolean {
  const digitos = valor.replace(/\D/g, '')
  return digitos.length === 10 || digitos.length === 11
}
