/**
 * Semeia a conta demo (vertical "manutencao") com dados realistas —
 * ao contrário dos scripts `_smoke-test-*.ts` das tarefas anteriores,
 * este é feito pra PERSISTIR em produção, não ser apagado no final.
 * Idempotente por checagem simples: se admin@alphadata.com já existe,
 * aborta sem duplicar nada.
 *
 * Credenciais replicadas 1:1 do antigo data/mock.js do frontend
 * (USUARIOS_DEMO) — só que agora reais, contra o Postgres de verdade.
 *
 * Roda com: npx tsx --env-file=.env scripts/seed-demo.ts
 */
import { supabase } from '../src/config/database.config.js'
import { UsuarioRepository } from '../src/repositories/UsuarioRepository.js'
import { UserService } from '../src/services/UserService.js'
import { ClienteService } from '../src/services/ClienteService.js'
import { ServicoService } from '../src/services/ServicoService.js'
import { ManutencaoService } from '../src/services/tipo-especifico/ManutencaoService.js'
import { hashSenha } from '../src/utils/senha.js'
import { logger } from '../src/utils/logger.js'

const usuarios = new UsuarioRepository(supabase)
const userService = new UserService(supabase)
const clienteService = new ClienteService(supabase)
const servicoService = new ServicoService(supabase)
const manutencaoService = new ManutencaoService(supabase)

const EMPRESAS_DEMO = [
  { nome: 'Acme Facilities', cidade: 'São Paulo', estado: 'SP' },
  { nome: 'Condomínio Jardim das Flores', cidade: 'Rio de Janeiro', estado: 'RJ' },
  { nome: 'Torre Sul Empresarial', cidade: 'Belo Horizonte', estado: 'MG' },
  { nome: 'Residencial Bela Vista', cidade: 'Curitiba', estado: 'PR' },
  { nome: 'Mercado Central', cidade: 'Porto Alegre', estado: 'RS' },
  { nome: 'Clínica Vida Nova', cidade: 'Salvador', estado: 'BA' },
  { nome: 'Escola Novo Saber', cidade: 'Fortaleza', estado: 'CE' },
  { nome: 'Shopping Praça Norte', cidade: 'Recife', estado: 'PE' },
  { nome: 'Hotel Estrela do Sul', cidade: 'Brasília', estado: 'DF' },
  { nome: 'Edifício Copacabana Office', cidade: 'Campinas', estado: 'SP' },
]

const TECNICOS_DEMO = [
  { email: 'tecnico@alphadata.com', nome: 'Carlos Santos', especialidades: ['Elétrico', 'Manutenção Predial'] },
  { email: 'fernanda.lima@alphadata.com', nome: 'Fernanda Lima', especialidades: ['HVAC', 'Encanamento'] },
  { email: 'roberto.alves@alphadata.com', nome: 'Roberto Alves', especialidades: ['Manutenção Predial', 'Reparos Gerais'] },
]

const SERVICOS_CATALOGO = [
  { nome: 'Manutenção Predial', precoBase: 250 },
  { nome: 'Reparo Elétrico', precoBase: 300 },
  { nome: 'Encanamento e Hidráulica', precoBase: 280 },
  { nome: 'HVAC — Ar Condicionado', precoBase: 450 },
  { nome: 'Reparos Gerais', precoBase: 180 },
]

const DESCRICOES_CHAMADO: { categoria: 'preventiva' | 'corretiva' | 'emergencia'; descricao: string }[] = [
  { categoria: 'corretiva', descricao: 'Vazamento no encanamento do banheiro do 2º andar.' },
  { categoria: 'emergencia', descricao: 'Curto-circuito no quadro elétrico principal — sem energia no bloco B.' },
  { categoria: 'preventiva', descricao: 'Manutenção trimestral programada do sistema de ar condicionado central.' },
  { categoria: 'corretiva', descricao: 'Porta de emergência com fechadura travada.' },
  { categoria: 'corretiva', descricao: 'Infiltração no teto da sala de reuniões.' },
  { categoria: 'emergencia', descricao: 'Vazamento de gás detectado próximo à cozinha industrial.' },
  { categoria: 'preventiva', descricao: 'Inspeção anual de para-raios e aterramento.' },
  { categoria: 'corretiva', descricao: 'Elevador social apresentando ruído excessivo.' },
  { categoria: 'corretiva', descricao: 'Lâmpadas do estacionamento queimadas — setor G.' },
  { categoria: 'preventiva', descricao: 'Limpeza e manutenção preventiva de calhas e telhado.' },
  { categoria: 'corretiva', descricao: 'Torneira do vestiário masculino pingando continuamente.' },
  { categoria: 'emergencia', descricao: 'Alarme de incêndio disparando sem motivo aparente.' },
  { categoria: 'corretiva', descricao: 'Ar condicionado da recepção não está gelando.' },
  { categoria: 'preventiva', descricao: 'Revisão semestral do gerador de energia.' },
  { categoria: 'corretiva', descricao: 'Piso do hall de entrada solto e com risco de queda.' },
  { categoria: 'corretiva', descricao: 'Portão eletrônico da garagem não abre com o controle.' },
  { categoria: 'preventiva', descricao: 'Dedetização e controle de pragas — vistoria trimestral.' },
  { categoria: 'corretiva', descricao: 'Vidro quebrado na fachada do 3º andar.' },
  { categoria: 'emergencia', descricao: 'Rompimento de cano principal — alagamento no subsolo.' },
  { categoria: 'corretiva', descricao: 'Interfone do bloco A sem funcionar.' },
  { categoria: 'preventiva', descricao: 'Manutenção preventiva das bombas d\'água.' },
  { categoria: 'corretiva', descricao: 'Fiação exposta no corredor do 1º andar — risco de segurança.' },
]

async function jaExisteDemo(): Promise<boolean> {
  const existente = await usuarios.buscarComCredenciaisPorEmail('admin@alphadata.com')
  return existente !== null
}

async function main(): Promise<void> {
  if (await jaExisteDemo()) {
    logger.info('Conta demo (admin@alphadata.com) já existe — nada a fazer. Abortando sem duplicar.')
    return
  }

  logger.info('Criando conta demo...')
  const { conta, usuario: admin } = await userService.criarUsuario('admin@alphadata.com', 'admin123', 'ALPHADATA Manutenção')
  await userService.selecionarTipoNegocio(admin.id, 'manutencao')
  logger.info({ contaId: conta.id }, 'Conta demo criada e vertical "manutencao" selecionado.')

  // ─── Técnicos (usuario + linha em tecnicos) ────────────────────────
  const tecnicoIds: string[] = []
  for (const t of TECNICOS_DEMO) {
    const senhaHash = await hashSenha('tecnico123')
    const usuarioTecnico = await usuarios.criar({
      contaId: conta.id,
      email: t.email,
      senhaHash,
      nome: t.nome,
      papel: 'tecnico',
      status: 'ativo',
      deveTrocarSenha: false,
    })
    const { data: tecnico, error } = await supabase
      .from('tecnicos')
      .insert({ usuario_id: usuarioTecnico.id, especialidades: t.especialidades, disponivel: true })
      .select()
      .single()
    if (error || !tecnico) throw new Error(`Falha ao criar técnico ${t.nome}: ${error?.message}`)
    tecnicoIds.push(tecnico.id)
  }
  logger.info({ quantidade: tecnicoIds.length }, 'Técnicos criados (login: <email> / tecnico123).')

  // ─── Clientes ───────────────────────────────────────────────────────
  const clienteIds: string[] = []
  for (const e of EMPRESAS_DEMO) {
    const cliente = await clienteService.criarClienteParaConta(conta.id, {
      nome: e.nome,
      cidade: e.cidade,
      estado: e.estado,
      telefone: `(11) 9${String(Math.floor(1000 + Math.random() * 9000))}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    })
    clienteIds.push(cliente.id)
  }
  logger.info({ quantidade: clienteIds.length }, 'Clientes criados.')

  // Login do cliente demo, vinculado ao primeiro cliente (Acme Facilities) — mesmo mapeamento do mock antigo (CLI-01).
  const senhaHashCliente = await hashSenha('cliente123')
  await usuarios.criar({
    contaId: conta.id,
    email: 'cliente@alphadata.com',
    senhaHash: senhaHashCliente,
    nome: EMPRESAS_DEMO[0]!.nome,
    papel: 'cliente',
    clienteId: clienteIds[0]!,
    status: 'ativo',
    deveTrocarSenha: false,
  })
  logger.info('Login do cliente demo criado (cliente@alphadata.com / cliente123).')

  // ─── Catálogo de serviços ───────────────────────────────────────────
  for (const s of SERVICOS_CATALOGO) {
    await servicoService.criarServico(admin.id, 'manutencao', { nome: s.nome, precoBase: s.precoBase })
  }
  logger.info({ quantidade: SERVICOS_CATALOGO.length }, 'Catálogo de serviços criado.')

  // ─── Chamados em vários estágios do fluxo ──────────────────────────
  // Os primeiros ficam com o cliente demo (cliente@alphadata.com), pra
  // ele ter um histórico rico de verdade ao logar. O resto é distribuído
  // entre os outros clientes via insert direto — não têm login, então
  // não dá pra passar pelo fluxo autenticado normal do service.
  let abertos = 0
  let comOrcamento = 0
  let agendados = 0
  let concluidos = 0
  let cancelados = 0

  for (let i = 0; i < DESCRICOES_CHAMADO.length; i++) {
    const item = DESCRICOES_CHAMADO[i]!
    const clienteId = clienteIds[i % clienteIds.length]!
    const tecnicoId = tecnicoIds[i % tecnicoIds.length]!
    const estagio = i % 6 // distribui os estágios de forma previsível

    const { data: chamado, error: erroChamado } = await supabase
      .from('chamados_manutencao')
      .insert({
        conta_id: conta.id,
        cliente_id: clienteId,
        categoria_manutencao: item.categoria,
        prioridade: item.categoria === 'emergencia' ? 'urgente' : 'normal',
        descricao: item.descricao,
        status: 'aberto',
      })
      .select()
      .single()
    if (erroChamado || !chamado) throw new Error(`Falha ao criar chamado: ${erroChamado?.message}`)

    if (estagio === 0) {
      abertos++
      continue
    }

    const orcamento = await manutencaoService.gerarOrcamento(chamado.id)
    if (estagio === 1) {
      comOrcamento++
      continue
    }

    await supabase.from('orcamentos').update({ status: 'aceito', respondido_em: new Date().toISOString() }).eq('id', orcamento.id)
    await supabase.from('chamados_manutencao').update({ status: 'orcamento_aceito' }).eq('id', chamado.id)
    if (estagio === 2) {
      comOrcamento++
      continue
    }

    if (estagio === 5) {
      await supabase.from('chamados_manutencao').update({ status: 'cancelado' }).eq('id', chamado.id)
      cancelados++
      continue
    }

    const diasAgendamento = estagio === 4 ? -3 : 4 // "concluído" fica com data no passado
    const ordem = await manutencaoService.agendarTecnico(chamado.id, tecnicoId, new Date(Date.now() + diasAgendamento * 86_400_000))
    if (estagio === 3) {
      agendados++
      continue
    }

    // estagio === 4: concluído, com laudo
    await manutencaoService.gerarLaudoTecnico(ordem.id, {
      servicosRealizados: `${item.descricao} — serviço executado conforme solicitado.`,
      recomendacoes: 'Recomenda-se nova inspeção em 6 meses.',
    })
    concluidos++
  }
  logger.info({ abertos, comOrcamento, agendados, concluidos, cancelados }, 'Chamados semeados em vários estágios.')

  // ─── Manutenções preventivas ────────────────────────────────────────
  await manutencaoService.criarManutencaoPreventiva(clienteIds[0]!, 'trimestral')
  await manutencaoService.criarManutencaoPreventiva(clienteIds[2]!, 'semestral')
  logger.info('Manutenções preventivas agendadas.')

  logger.info('Seed da conta demo concluído com sucesso.')
  console.log('\n=== Credenciais da conta demo ===')
  console.log('Admin:    admin@alphadata.com     / admin123')
  console.log('Técnico:  tecnico@alphadata.com    / tecnico123')
  console.log('Cliente:  cliente@alphadata.com    / cliente123')
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao semear a conta demo.')
  process.exit(1)
})
