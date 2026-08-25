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

// Sem 0/O/1/I/l — evita confusão visual numa senha temporária que o
// cliente vai digitar de um papel/tela, não colar.
const ALFABETO_SENHA_TEMPORARIA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

/** Gera uma senha temporária legível (10 caracteres) — usada quando o sistema cria o login, não o próprio usuário (ver ConvitesService). */
export function gerarSenhaTemporaria(tamanho = 10): string {
  const bytes = randomBytes(tamanho)
  let senha = ''
  for (let i = 0; i < tamanho; i++) {
    senha += ALFABETO_SENHA_TEMPORARIA[bytes[i]! % ALFABETO_SENHA_TEMPORARIA.length]
  }
  return senha
}
