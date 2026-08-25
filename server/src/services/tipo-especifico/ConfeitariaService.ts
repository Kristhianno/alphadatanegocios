/**
 * Regras de negócio específicas de Confeitaria e Salgados: receitas,
 * pedidos, produção com checklist, estoque de ingredientes e cálculo
 * de custo/margem.
 *
 * Tabelas aqui (receitas, pedidos_confeitaria, ordens_producao, ...)
 * não passam pelo Repository genérico — só este service as usa, então
 * uma classe Repository por tabela seria abstração sem reúso real.
 * `executarOuFalhar` cobre o mesmo error-wrapping sem esse overhead, e
 * o client tipado com `Database` já garante que os nomes de coluna
 * usados abaixo existem de verdade no schema.
 */
import { z } from 'zod'
import type { Cliente } from '../../config/database.config.js'
import type { Database, Json } from '../../types/database.types.js'
import { UsuarioRepository } from '../../repositories/UsuarioRepository.js'
import { executarOuFalhar } from '../../utils/supabaseHelpers.js'
import { ErroNaoEncontrado, ErroValidacao } from '../../errors/AppError.js'
import { logger } from '../../utils/logger.js'

type Tabelas = Database['public']['Tables']
type LinhaReceita = Tabelas['receitas']['Row']
type LinhaPedido = Tabelas['pedidos_confeitaria']['Row']
type LinhaOrdemProducao = Tabelas['ordens_producao']['Row']

export interface Receita {
  id: string
  contaId: string
  nome: string
  categoria: string | null
  rendimentoQuantidade: number | null
  tempoPreparoMinutos: number | null
  modoPreparo: string | null
  ativo: boolean
}

export interface PedidoConfeitaria {
  id: string
  contaId: string
  clienteId: string
  numero: string
  status: string
  dataEntrega: string | null
  valorTotal: number
}

export interface OrdemProducao {
  id: string
  pedidoId: string
  status: string
  checklistEtapas: EtapaChecklist[]
}

export interface EtapaChecklist {
  etapa: string
  concluida: boolean
}

const CHECKLIST_PRODUCAO_PADRAO: readonly string[] = [
  'Ingredientes separados',
  'Massa/base preparada',
  'Montagem/recheio',
  'Acabamento/decoração',
  'Controle de qualidade',
]

const schemaCriarReceita = z.object({
  nome: z.string().trim().min(2),
  categoria: z.string().optional(),
  rendimentoQuantidade: z.number().positive().optional(),
  rendimentoUnidade: z.string().optional(),
  tempoPreparoMinutos: z.number().int().positive().optional(),
  modoPreparo: z.string().optional(),
  ingredientes: z.array(z.object({ ingredienteId: z.string().uuid(), quantidadeNecessaria: z.number().positive() })).default([]),
})

const schemaCriarPedido = z.object({
  clienteId: z.string().uuid(),
  agendamentoId: z.string().uuid().optional(),
  dataEntrega: z.coerce.date().optional(),
  enderecoEntrega: z.string().optional(),
  itens: z
    .array(
      z.object({
        produtoId: z.string().uuid(),
        quantidade: z.number().int().positive(),
        opcoesSelecionadas: z.array(z.record(z.string(), z.unknown())).default([]),
        observacoes: z.string().optional(),
      })
    )
    .min(1, 'O pedido precisa de ao menos um item.'),
})

export class ConfeitariaService {
  private readonly usuarios: UsuarioRepository

  constructor(private readonly client: Cliente) {
    this.usuarios = new UsuarioRepository(client)
  }

  async criarReceita(userId: string, dados: unknown): Promise<Receita> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarReceita.parse(dados)

    const linha = await executarOuFalhar<LinhaReceita>(
      'receitas',
      'criar',
      this.client
        .from('receitas')
        .insert({
          conta_id: usuario.contaId,
          nome: validado.nome,
          categoria: validado.categoria ?? null,
          rendimento_quantidade: validado.rendimentoQuantidade ?? null,
          rendimento_unidade: validado.rendimentoUnidade ?? null,
          tempo_preparo_minutos: validado.tempoPreparoMinutos ?? null,
          modo_preparo: validado.modoPreparo ?? null,
        })
        .select()
        .single()
    )

    if (validado.ingredientes.length > 0) {
      await executarOuFalhar(
        'receita_ingredientes',
        'criar',
        this.client
          .from('receita_ingredientes')
          .insert(
            validado.ingredientes.map((i) => ({
              receita_id: linha.id,
              ingrediente_id: i.ingredienteId,
              quantidade_necessaria: i.quantidadeNecessaria,
            }))
          )
          .select()
      )
    }

    logger.info({ receitaId: linha.id }, 'Receita criada.')
    return this.linhaParaReceita(linha)
  }

  async criarPedidoConfeitaria(userId: string, dados: unknown): Promise<PedidoConfeitaria> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarPedido.parse(dados)

    const produtoIds = [...new Set(validado.itens.map((i) => i.produtoId))]
    const produtos = await executarOuFalhar(
      'catalogo_produtos',
      'buscarParaPedido',
      this.client.from('catalogo_produtos').select('id, preco_venda').in('id', produtoIds)
    )
    const precoPorProduto = new Map(produtos.map((p) => [p.id, Number(p.preco_venda)]))
    for (const id of produtoIds) {
      if (!precoPorProduto.has(id)) throw new ErroValidacao(`Produto "${id}" não existe no catálogo.`)
    }

    const valorTotal = validado.itens.reduce((soma, item) => soma + (precoPorProduto.get(item.produtoId) ?? 0) * item.quantidade, 0)
    const numero = await this.proximoNumeroPedido(usuario.contaId)

    const pedido = await executarOuFalhar<LinhaPedido>(
      'pedidos_confeitaria',
      'criar',
      this.client
        .from('pedidos_confeitaria')
        .insert({
          conta_id: usuario.contaId,
          cliente_id: validado.clienteId,
          agendamento_id: validado.agendamentoId ?? null,
          numero,
          data_entrega: validado.dataEntrega?.toISOString() ?? null,
          endereco_entrega: validado.enderecoEntrega ?? null,
          valor_total: valorTotal,
        })
        .select()
        .single()
    )

    await executarOuFalhar(
      'itens_pedido',
      'criar',
      this.client
        .from('itens_pedido')
        .insert(
          validado.itens.map((item) => ({
            pedido_id: pedido.id,
            produto_id: item.produtoId,
            quantidade: item.quantidade,
            preco_unitario: precoPorProduto.get(item.produtoId) as number,
            opcoes_selecionadas: item.opcoesSelecionadas as Json,
            observacoes: item.observacoes ?? null,
          }))
        )
        .select()
    )

    logger.info({ pedidoId: pedido.id, numero, valorTotal }, 'Pedido de confeitaria criado.')
    return this.linhaParaPedido(pedido)
  }

  async criarOrdenProducao(pedidoId: string): Promise<OrdemProducao> {
    const contaId = await this.contaDoPedido(pedidoId)

    const linha = await executarOuFalhar<LinhaOrdemProducao>(
      'ordens_producao',
      'criar',
      this.client
        .from('ordens_producao')
        .insert({ conta_id: contaId, pedido_id: pedidoId, status: 'aguardando', checklist_etapas: [] as Json })
        .select()
        .single()
    )
    return this.linhaParaOrdem(linha)
  }

  /** Cria a ordem de produção já com o checklist padrão de etapas — o que a UI do técnico marca conforme avança. */
  async gerarOrdenProducaoComChecklist(pedidoId: string): Promise<OrdemProducao> {
    const ordem = await this.criarOrdenProducao(pedidoId)
    const checklist: EtapaChecklist[] = CHECKLIST_PRODUCAO_PADRAO.map((etapa) => ({ etapa, concluida: false }))
    const linha = await executarOuFalhar<LinhaOrdemProducao>(
      'ordens_producao',
      'atualizar',
      this.client.from('ordens_producao').update({ checklist_etapas: checklist as unknown as Json }).eq('id', ordem.id).select().single()
    )
    logger.info({ ordemId: ordem.id, etapas: checklist.length }, 'Checklist de produção gerado.')
    return this.linhaParaOrdem(linha)
  }

  /**
   * Atualiza o estoque de um ingrediente e registra a movimentação.
   * `quantidade` é um delta assinado: positivo = entrada, negativo = saída.
   *
   * Nota: leitura + escrita não são atômicas (duas chamadas concorrentes
   * para o mesmo ingrediente podem perder uma atualização). Para volume
   * alto, isso deveria virar uma função Postgres (`UPDATE ... RETURNING`
   * em uma única viagem) — fica registrado como próximo passo, não
   * escondido.
   */
  async atualizarMovimentacaoEstoque(ingredienteId: string, quantidade: number): Promise<{ quantidadeAtual: number }> {
    if (quantidade === 0) throw new ErroValidacao('A quantidade da movimentação não pode ser zero.')

    const ingrediente = await this.client.from('ingredientes_estoque').select('id, conta_id, quantidade_atual').eq('id', ingredienteId).maybeSingle()
    if (ingrediente.error) throw new ErroNaoEncontrado('Ingrediente', ingredienteId)
    if (!ingrediente.data) throw new ErroNaoEncontrado('Ingrediente', ingredienteId)

    const quantidadeResultante = Number(ingrediente.data.quantidade_atual) + quantidade
    if (quantidadeResultante < 0) {
      throw new ErroValidacao(`Estoque insuficiente: disponível ${ingrediente.data.quantidade_atual}, solicitado ${-quantidade}.`)
    }

    await executarOuFalhar(
      'ingredientes_estoque',
      'atualizar',
      this.client.from('ingredientes_estoque').update({ quantidade_atual: quantidadeResultante }).eq('id', ingredienteId).select().single()
    )

    await executarOuFalhar(
      'movimentacoes_estoque',
      'criar',
      this.client
        .from('movimentacoes_estoque')
        .insert({
          conta_id: ingrediente.data.conta_id,
          ingrediente_id: ingredienteId,
          tipo: quantidade > 0 ? 'entrada' : 'saida',
          quantidade: Math.abs(quantidade),
          quantidade_resultante: quantidadeResultante,
        })
        .select()
        .single()
    )

    logger.info({ ingredienteId, quantidade, quantidadeResultante }, 'Movimentação de estoque registrada.')
    return { quantidadeAtual: quantidadeResultante }
  }

  /** Soma quantidade_necessaria * custo_unitario de cada ingrediente da receita. Duas queries simples em vez de embed, pra não depender de cardinalidade inferida do PostgREST. */
  async calcularCustoProducao(receitaId: string): Promise<number> {
    const composicao = await executarOuFalhar(
      'receita_ingredientes',
      'calcularCusto',
      this.client.from('receita_ingredientes').select('ingrediente_id, quantidade_necessaria').eq('receita_id', receitaId)
    )
    if (composicao.length === 0) throw new ErroNaoEncontrado('Composição da receita', receitaId)

    const ingredienteIds = composicao.map((c) => c.ingrediente_id)
    const ingredientes = await executarOuFalhar(
      'ingredientes_estoque',
      'buscarCustos',
      this.client.from('ingredientes_estoque').select('id, custo_unitario').in('id', ingredienteIds)
    )
    const custoPorIngrediente = new Map(ingredientes.map((i) => [i.id, Number(i.custo_unitario)]))

    const custo = composicao.reduce((soma, c) => soma + Number(c.quantidade_necessaria) * (custoPorIngrediente.get(c.ingrediente_id) ?? 0), 0)
    return Math.round(custo * 100) / 100
  }

  /**
   * Recalcula custo_producao_estimado do produto a partir da receita
   * vinculada (se houver) e devolve a margem já atualizada.
   * margem_lucro_percentual é coluna gerada no Postgres — não é
   * recalculada aqui em JS, só lida de volta após o UPDATE, pra nunca
   * divergir do que o banco realmente guarda.
   */
  async calcularMargemLucro(produtoId: string): Promise<number> {
    const produto = await this.client.from('catalogo_produtos').select('id, receita_id').eq('id', produtoId).maybeSingle()
    if (produto.error || !produto.data) throw new ErroNaoEncontrado('Produto', produtoId)

    if (produto.data.receita_id) {
      const custoProducaoEstimado = await this.calcularCustoProducao(produto.data.receita_id)
      await executarOuFalhar(
        'catalogo_produtos',
        'atualizar',
        this.client.from('catalogo_produtos').update({ custo_producao_estimado: custoProducaoEstimado }).eq('id', produtoId).select().single()
      )
    }

    const atualizado = await executarOuFalhar<{ margem_lucro_percentual: number | null }>(
      'catalogo_produtos',
      'buscarMargem',
      this.client.from('catalogo_produtos').select('margem_lucro_percentual').eq('id', produtoId).single()
    )
    return Number(atualizado.margem_lucro_percentual)
  }

  private async proximoNumeroPedido(contaId: string): Promise<string> {
    const { count } = await this.client.from('pedidos_confeitaria').select('id', { count: 'exact', head: true }).eq('conta_id', contaId)
    return `PED-${String((count ?? 0) + 1).padStart(4, '0')}`
  }

  private async contaDoPedido(pedidoId: string): Promise<string> {
    const linha = await executarOuFalhar<{ conta_id: string }>(
      'pedidos_confeitaria',
      'contaDoPedido',
      this.client.from('pedidos_confeitaria').select('conta_id').eq('id', pedidoId).single()
    )
    return linha.conta_id
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private linhaParaReceita(linha: {
    id: string
    conta_id: string
    nome: string
    categoria: string | null
    rendimento_quantidade: number | null
    tempo_preparo_minutos: number | null
    modo_preparo: string | null
    ativo: boolean
  }): Receita {
    return {
      id: linha.id,
      contaId: linha.conta_id,
      nome: linha.nome,
      categoria: linha.categoria,
      rendimentoQuantidade: linha.rendimento_quantidade,
      tempoPreparoMinutos: linha.tempo_preparo_minutos,
      modoPreparo: linha.modo_preparo,
      ativo: linha.ativo,
    }
  }

  private linhaParaPedido(linha: {
    id: string
    conta_id: string
    cliente_id: string
    numero: string
    status: string
    data_entrega: string | null
    valor_total: number
  }): PedidoConfeitaria {
    return {
      id: linha.id,
      contaId: linha.conta_id,
      clienteId: linha.cliente_id,
      numero: linha.numero,
      status: linha.status,
      dataEntrega: linha.data_entrega,
      valorTotal: Number(linha.valor_total),
    }
  }

  private linhaParaOrdem(linha: { id: string; pedido_id: string; status: string; checklist_etapas: unknown }): OrdemProducao {
    return {
      id: linha.id,
      pedidoId: linha.pedido_id,
      status: linha.status,
      checklistEtapas: (linha.checklist_etapas as EtapaChecklist[] | null) ?? [],
    }
  }
}
