import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const TAMANHO_CHAVE = 64

/** Hash de senha com scrypt (nativo do Node — sem dependência externa). Formato armazenado: `salt:hash`, ambos hex. */
export async function hashSenha(senhaPlana: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const chave = (await scryptAsync(senhaPlana, salt, TAMANHO_CHAVE)) as Buffer
  return `${salt}:${chave.toString('hex')}`
}

/** Compara em tempo constante — evita timing attack na verificação de login. */
export async function verificarSenha(senhaPlana: string, hashArmazenado: string): Promise<boolean> {
  const [salt, hashHex] = hashArmazenado.split(':')
  if (!salt || !hashHex) return false
  const chaveEsperada = Buffer.from(hashHex, 'hex')
  const chaveInformada = (await scryptAsync(senhaPlana, salt, TAMANHO_CHAVE)) as Buffer
  if (chaveEsperada.length !== chaveInformada.length) return false
  return timingSafeEqual(chaveEsperada, chaveInformada)
}
