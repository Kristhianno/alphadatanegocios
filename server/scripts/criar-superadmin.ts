/**
 * Cria (ou atualiza) o login de superadmin — o dono da plataforma.
 *
 * Credenciais SEMPRE por variável de ambiente, nunca no código: este
 * repositório é público. Exige a migration
 * 20261111000001_papel_superadmin.sql já aplicada no banco.
 *
 * Idempotente: se o email já existe, só redefine senha/papel/status.
 * O superadmin ganha uma conta interna própria (configuracoesGerais.interna
 * = true), escondida das listagens de PlataformaService.
 *
 * Roda com:
 *   SUPERADMIN_EMAIL=... SUPERADMIN_SENHA=... npx tsx --env-file=.dev.vars scripts/criar-superadmin.ts
 */
import { getSupabase } from '../src/config/database.config.js'
import { ContaRepository } from '../src/repositories/ContaRepository.js'
import { UsuarioRepository } from '../src/repositories/UsuarioRepository.js'
import { hashSenha } from '../src/utils/senha.js'

const email = process.env['SUPERADMIN_EMAIL']?.trim().toLowerCase()
const senha = process.env['SUPERADMIN_SENHA']
if (!email || !senha) {
  console.error('Defina SUPERADMIN_EMAIL e SUPERADMIN_SENHA.')
  process.exit(1)
}
if (senha.length < 8) {
  console.error('A senha precisa de ao menos 8 caracteres.')
  process.exit(1)
}

const supabase = getSupabase()
const contas = new ContaRepository(supabase)
const usuarios = new UsuarioRepository(supabase)

const senhaHash = await hashSenha(senha)
const existente = await usuarios.buscarComCredenciaisPorEmail(email)

if (existente) {
  await usuarios.atualizar(existente.id, { senhaHash, papel: 'superadmin', status: 'ativo', deveTrocarSenha: false })
  const conta = await contas.buscarPorId(existente.contaId)
  if (conta && conta.configuracoesGerais['interna'] !== true) {
    console.warn(`Atenção: ${email} já existia numa conta de cliente ("${conta.nomeEmpresa}") e virou superadmin nela.`)
  }
  console.log(`Superadmin atualizado: ${email}`)
} else {
  const conta = await contas.criar({
    nomeEmpresa: 'ALPHADATA Plataforma',
    plano: 'enterprise',
    configuracoesGerais: { interna: true },
  })
  await usuarios.criar({
    contaId: conta.id,
    email,
    senhaHash,
    nome: 'Superadmin ALPHADATA',
    papel: 'superadmin',
    status: 'ativo',
    deveTrocarSenha: false,
  })
  console.log(`Superadmin criado: ${email} (conta interna ${conta.id})`)
}
