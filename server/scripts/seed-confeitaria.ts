/**
 * Semeia a conta demo do vertical "confeitaria" — segunda conta demo,
 * pra dar pra testar um tipo de negócio diferente de manutenção sem
 * misturar dados na mesma conta. Mesmo padrão do seed-demo.ts:
 * idempotente por checagem de email, feito pra persistir.
 *
 * Roda com: npx tsx --env-file=.env scripts/seed-confeitaria.ts
 */
import { getSupabase } from '../src/config/database.config.js'
import { UsuarioRepository } from '../src/repositories/UsuarioRepository.js'
import { UserService } from '../src/services/UserService.js'
import { ClienteService } from '../src/services/ClienteService.js'
import { ServicoService } from '../src/services/ServicoService.js'
import { ConfeitariaService } from '../src/services/tipo-especifico/ConfeitariaService.js'
import { logger } from '../src/utils/logger.js'

const EMAIL_ADMIN = 'confeitaria@alphadata.com'
const SENHA_ADMIN = 'admin123'

const supabase = getSupabase()
const usuarios = new UsuarioRepository(supabase)
const userService = new UserService(supabase)
const clienteService = new ClienteService(supabase)
const servicoService = new ServicoService(supabase)
const confeitariaService = new ConfeitariaService(supabase)

const CLIENTES_DEMO = [
  { nome: 'Buffet Doce Encanto', cidade: 'São Paulo', estado: 'SP' },
  { nome: 'Condomínio Vila Nova', cidade: 'Campinas', estado: 'SP' },
  { nome: 'Escritório Almeida & Souza', cidade: 'São Paulo', estado: 'SP' },
  { nome: 'Maria Fernandes (Aniversário)', cidade: 'Guarulhos', estado: 'SP' },
  { nome: 'Igreja Comunidade Viva', cidade: 'São Paulo', estado: 'SP' },
  { nome: 'Academia Corpo em Forma', cidade: 'Osasco', estado: 'SP' },
]

const SERVICOS_CATALOGO = [
  { nome: 'Bolo Personalizado', precoBase: 180 },
  { nome: 'Docinhos Gourmet (cento)', precoBase: 150 },
  { nome: 'Bolo de Casamento', precoBase: 900 },
  { nome: 'Kit Festa Infantil', precoBase: 320 },
]

const INGREDIENTES_DEMO = [
  { nome: 'Farinha de Trigo', unidade: 'kg', quantidade_atual: 50, custo_unitario: 5.5 },
  { nome: 'Açúcar Refinado', unidade: 'kg', quantidade_atual: 40, custo_unitario: 4.2 },
  { nome: 'Chocolate Belga', unidade: 'kg', quantidade_atual: 15, custo_unitario: 42 },
  { nome: 'Ovos', unidade: 'dúzia', quantidade_atual: 20, custo_unitario: 12 },
]

async function jaExiste(): Promise<boolean> {
  return (await usuarios.buscarComCredenciaisPorEmail(EMAIL_ADMIN)) !== null
}

async function main(): Promise<void> {
  if (await jaExiste()) {
    logger.info('Conta demo de confeitaria já existe — nada a fazer.')
    return
  }

  const { conta, usuario: admin } = await userService.criarUsuario(EMAIL_ADMIN, SENHA_ADMIN, 'Doces & Cia Confeitaria')
  await userService.selecionarTipoNegocio(admin.id, 'confeitaria')
  logger.info({ contaId: conta.id }, 'Conta demo de confeitaria criada.')

  const clienteIds: string[] = []
  for (const c of CLIENTES_DEMO) {
    const cliente = await clienteService.criarClienteParaConta(conta.id, { nome: c.nome, cidade: c.cidade, estado: c.estado })
    clienteIds.push(cliente.id)
  }

  for (const s of SERVICOS_CATALOGO) {
    await servicoService.criarServico(admin.id, 'confeitaria', { nome: s.nome, precoBase: s.precoBase })
  }

  const ingredienteIds: string[] = []
  for (const i of INGREDIENTES_DEMO) {
    const { data, error } = await supabase
      .from('ingredientes_estoque')
      .insert({ conta_id: conta.id, nome: i.nome, unidade_medida: i.unidade, quantidade_atual: i.quantidade_atual, custo_unitario: i.custo_unitario })
      .select()
      .single()
    if (error || !data) throw new Error(`Falha ao criar ingrediente ${i.nome}: ${error?.message}`)
    ingredienteIds.push(data.id)
  }

  const receita = await confeitariaService.criarReceita(admin.id, {
    nome: 'Bolo de Chocolate com Ganache',
    categoria: 'bolos',
    tempoPreparoMinutos: 90,
    ingredientes: [
      { ingredienteId: ingredienteIds[0]!, quantidadeNecessaria: 1.2 },
      { ingredienteId: ingredienteIds[1]!, quantidadeNecessaria: 0.8 },
      { ingredienteId: ingredienteIds[2]!, quantidadeNecessaria: 0.5 },
    ],
  })
  logger.info({ receitaId: receita.id }, 'Receita demo criada.')

  const { data: produto, error: erroProduto } = await supabase
    .from('catalogo_produtos')
    .insert({ conta_id: conta.id, nome: 'Bolo de Chocolate 20cm', preco_venda: 180, receita_id: receita.id })
    .select()
    .single()
  if (erroProduto || !produto) throw new Error(`Falha ao criar produto: ${erroProduto?.message}`)

  for (let i = 0; i < 3; i++) {
    const pedido = await confeitariaService.criarPedidoConfeitaria(admin.id, {
      clienteId: clienteIds[i % clienteIds.length]!,
      dataEntrega: new Date(Date.now() + (i + 2) * 86_400_000).toISOString(),
      itens: [{ produtoId: produto.id, quantidade: 1 + i }],
    })
    if (i === 0) await confeitariaService.gerarOrdenProducaoComChecklist(pedido.id)
  }

  logger.info('Seed da conta demo de confeitaria concluído.')
  console.log('\n=== Credenciais da conta demo (confeitaria) ===')
  console.log(`Admin: ${EMAIL_ADMIN} / ${SENHA_ADMIN}`)
}

main().catch((err) => {
  logger.error({ err }, 'Falha ao semear a conta demo de confeitaria.')
  process.exit(1)
})
