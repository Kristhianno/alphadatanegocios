/**
 * Semeia a conta demo do vertical "fotografia_video". Mesmo padrão dos
 * outros seeds: idempotente por checagem de email, feito pra persistir.
 *
 * Roda com: npx tsx --env-file=.env scripts/seed-fotografia.ts
 */
import { getSupabase } from '../src/config/database.config.js'
import { UsuarioRepository } from '../src/repositories/UsuarioRepository.js'
import { UserService } from '../src/services/UserService.js'
import { ClienteService } from '../src/services/ClienteService.js'
import { ServicoService } from '../src/services/ServicoService.js'
import { FotografiaService } from '../src/services/tipo-especifico/FotografiaService.js'
import { logger } from '../src/utils/logger.js'

const EMAIL_ADMIN = 'fotografia@alphadata.com'
const SENHA_ADMIN = 'admin123'

const supabase = getSupabase()
const usuarios = new UsuarioRepository(supabase)
const userService = new UserService(supabase)
const clienteService = new ClienteService(supabase)
const servicoService = new ServicoService(supabase)
const fotografiaService = new FotografiaService(supabase)

const CLIENTES_DEMO = [
  { nome: 'Beatriz e Rafael (Casamento)', cidade: 'Belo Horizonte', estado: 'MG' },
  { nome: 'Studio Criativo Design', cidade: 'Belo Horizonte', estado: 'MG' },
  { nome: 'Larissa Mendes (Gestante)', cidade: 'Contagem', estado: 'MG' },
  { nome: 'Auto Peças Rodavia', cidade: 'Belo Horizonte', estado: 'MG' },
  { nome: 'Escritório Contábil Fortes', cidade: 'Belo Horizonte', estado: 'MG' },
  { nome: 'Pedro Henrique (15 anos)', cidade: 'Betim', estado: 'MG' },
]

const SERVICOS_CATALOGO = [
  { nome: 'Ensaio Fotográfico', precoBase: 450 },
  { nome: 'Cobertura de Casamento', precoBase: 3800 },
  { nome: 'Sessão Corporativa', precoBase: 900 },
  { nome: 'Vídeo Institucional', precoBase: 2200 },
]

const SESSOES_DEMO: { tipoSessao: 'ensaio' | 'casamento' | 'produto' | 'institucional'; cliente: number }[] = [
  { tipoSessao: 'casamento', cliente: 0 },
  { tipoSessao: 'institucional', cliente: 1 },
  { tipoSessao: 'ensaio', cliente: 2 },
  { tipoSessao: 'produto', cliente: 3 },
]

async function jaExiste(): Promise<boolean> {
  return (await usuarios.buscarComCredenciaisPorEmail(EMAIL_ADMIN)) !== null
}

async function main(): Promise<void> {
  if (await jaExiste()) {
    logger.info('Conta demo de fotografia já existe — nada a fazer.')
    return
  }

  const { conta, usuario: admin } = await userService.criarUsuario(EMAIL_ADMIN, SENHA_ADMIN, 'Studio Fotografia & Vídeo')
  await userService.selecionarTipoNegocio(admin.id, 'fotografia_video')
  logger.info({ contaId: conta.id }, 'Conta demo de fotografia criada.')

  const clienteIds: string[] = []
  for (const c of CLIENTES_DEMO) {
    const cliente = await clienteService.criarClienteParaConta(conta.id, { nome: c.nome, cidade: c.cidade, estado: c.estado })
    clienteIds.push(cliente.id)
  }

  for (const s of SERVICOS_CATALOGO) {
    await servicoService.criarServico(admin.id, 'fotografia_video', { nome: s.nome, precoBase: s.precoBase })
  }

  const { data: pacote, error: erroPacote } = await supabase
    .from('pacotes_fotografia')
    .insert({ conta_id: conta.id, nome: 'Pacote Casamento Completo', tipo_sessao: 'casamento', quantidade_fotos_inclusas: 300, horas_inclusas: 8, preco_base: 3800 })
    .select()
    .single()
  if (erroPacote || !pacote) throw new Error(`Falha ao criar pacote: ${erroPacote?.message}`)

  for (let i = 0; i < SESSOES_DEMO.length; i++) {
    const item = SESSOES_DEMO[i]!
    const sessao = await fotografiaService.criarSessaoFoto(admin.id, {
      clienteId: clienteIds[item.cliente]!,
      pacoteId: i === 0 ? pacote.id : undefined,
      tipoSessao: item.tipoSessao,
      dataSessao: new Date(Date.now() + (i + 3) * 86_400_000).toISOString(),
      local: 'Estúdio principal',
    })

    if (i === 0) {
      await fotografiaService.uploadFotosOriginal(sessao.id, ['https://placehold.co/600x400?text=Foto+1', 'https://placehold.co/600x400?text=Foto+2'])
      await fotografiaService.atualizarStatusEdicao(sessao.id, 40)
    }
  }

  await fotografiaService.criarProducaoVideo(admin.id, {
    clienteId: clienteIds[1]!,
    titulo: 'Vídeo institucional — Studio Criativo Design',
    duracaoEstimadaSegundos: 120,
  })

  logger.info('Seed da conta demo de fotografia concluído.')
  console.log('\n=== Credenciais da conta demo (fotografia) ===')
  console.log(`Admin: ${EMAIL_ADMIN} / ${SENHA_ADMIN}`)
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao semear a conta demo de fotografia.')
  process.exit(1)
})
