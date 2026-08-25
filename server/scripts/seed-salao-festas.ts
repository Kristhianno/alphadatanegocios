/**
 * Semeia a conta demo do vertical "salao_festas". Mesmo padrão dos
 * outros seeds: idempotente por checagem de email, feito pra persistir.
 *
 * Roda com: npx tsx --env-file=.env scripts/seed-salao-festas.ts
 */
import { getSupabase } from '../src/config/database.config.js'
import { UsuarioRepository } from '../src/repositories/UsuarioRepository.js'
import { UserService } from '../src/services/UserService.js'
import { ClienteService } from '../src/services/ClienteService.js'
import { ServicoService } from '../src/services/ServicoService.js'
import { SalaoFestasService } from '../src/services/tipo-especifico/SalaoFestasService.js'
import { logger } from '../src/utils/logger.js'

const EMAIL_ADMIN = 'salaodefestas@alphadata.com'
const SENHA_ADMIN = 'admin123'

const supabase = getSupabase()
const usuarios = new UsuarioRepository(supabase)
const userService = new UserService(supabase)
const clienteService = new ClienteService(supabase)
const servicoService = new ServicoService(supabase)
const salaoFestasService = new SalaoFestasService(supabase)

const CLIENTES_DEMO = [
  { nome: 'Ana Paula Ribeiro', cidade: 'Rio de Janeiro', estado: 'RJ' },
  { nome: 'Empresa TechNova Ltda', cidade: 'Rio de Janeiro', estado: 'RJ' },
  { nome: 'Carlos & Juliana (Casamento)', cidade: 'Niterói', estado: 'RJ' },
  { nome: 'Escola Novo Saber', cidade: 'Rio de Janeiro', estado: 'RJ' },
  { nome: 'Fernanda Costa', cidade: 'Duque de Caxias', estado: 'RJ' },
  { nome: 'Clube Recreativo União', cidade: 'Niterói', estado: 'RJ' },
]

const SERVICOS_CATALOGO = [
  { nome: 'Pacote Bronze', precoBase: 3500 },
  { nome: 'Pacote Prata', precoBase: 6500 },
  { nome: 'Pacote Ouro', precoBase: 12000 },
  { nome: 'Pacote Premium', precoBase: 22000 },
]

const EVENTOS_DEMO: { tipoEvento: 'aniversario' | 'casamento' | 'corporativo' | 'formatura'; nome: string }[] = [
  { tipoEvento: 'aniversario', nome: 'Aniversário de 30 anos — Ana Paula' },
  { tipoEvento: 'corporativo', nome: 'Confraternização de fim de ano — TechNova' },
  { tipoEvento: 'casamento', nome: 'Casamento Carlos & Juliana' },
  { tipoEvento: 'formatura', nome: 'Formatura Turma 2026' },
]

async function jaExiste(): Promise<boolean> {
  return (await usuarios.buscarComCredenciaisPorEmail(EMAIL_ADMIN)) !== null
}

async function main(): Promise<void> {
  if (await jaExiste()) {
    logger.info('Conta demo de salão de festas já existe — nada a fazer.')
    return
  }

  const { conta, usuario: admin } = await userService.criarUsuario(EMAIL_ADMIN, SENHA_ADMIN, 'Festas & Eventos Premium')
  await userService.selecionarTipoNegocio(admin.id, 'salao_festas')
  logger.info({ contaId: conta.id }, 'Conta demo de salão de festas criada.')

  const clienteIds: string[] = []
  for (const c of CLIENTES_DEMO) {
    const cliente = await clienteService.criarClienteParaConta(conta.id, { nome: c.nome, cidade: c.cidade, estado: c.estado })
    clienteIds.push(cliente.id)
  }

  for (const s of SERVICOS_CATALOGO) {
    await servicoService.criarServico(admin.id, 'salao_festas', { nome: s.nome, precoBase: s.precoBase })
  }

  const { data: pacote, error: erroPacote } = await supabase
    .from('pacotes_salao')
    .insert({ conta_id: conta.id, nome: 'Pacote Ouro', tipo_evento: 'aniversario', preco_base: 12000, capacidade_convidados: 150 })
    .select()
    .single()
  if (erroPacote || !pacote) throw new Error(`Falha ao criar pacote: ${erroPacote?.message}`)

  for (let i = 0; i < EVENTOS_DEMO.length; i++) {
    const item = EVENTOS_DEMO[i]!
    const evento = await salaoFestasService.criarEvento(admin.id, {
      clienteId: clienteIds[i]!,
      pacoteId: i === 0 ? pacote.id : undefined,
      nomeEvento: item.nome,
      tipoEvento: item.tipoEvento,
      dataEvento: new Date(Date.now() + (i + 5) * 7 * 86_400_000).toISOString(),
      numeroConvidados: 80 + i * 30,
    })

    await salaoFestasService.adicionarEquipeEvento(evento.id, 'Garçom', 4)
    await salaoFestasService.adicionarEquipamentoEvento(evento.id, { nomeEquipamento: 'Sistema de som', quantidade: 1 })

    if (i === 0) {
      await salaoFestasService.gerarChecklistEvento(evento.id)
      await supabase.from('financeiro_evento').insert([
        { evento_id: evento.id, tipo: 'receita', descricao: 'Sinal recebido', valor: 4000 },
        { evento_id: evento.id, tipo: 'despesa', descricao: 'Decoração', valor: 900 },
      ])
    }
  }

  logger.info('Seed da conta demo de salão de festas concluído.')
  console.log('\n=== Credenciais da conta demo (salão de festas) ===')
  console.log(`Admin: ${EMAIL_ADMIN} / ${SENHA_ADMIN}`)
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao semear a conta demo de salão de festas.')
  process.exit(1)
})
