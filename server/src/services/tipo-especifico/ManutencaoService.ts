/**
 * Regras de negócio específicas de Manutenções Gerais: chamados com
 * prioridade, orçamento automático, agendamento de técnico, ordens com
 * horas trabalhadas calculadas pelo banco, rastreamento de materiais e
 * laudo técnico.
 */
import { z } from 'zod'
import type { Cliente } from '../../config/database.config.js'
import type { Database, Json } from '../../types/database.types.js'
import { UsuarioRepository } from '../../repositories/UsuarioRepository.js'
import { executarOuFalhar } from '../../utils/supabaseHelpers.js'
import { ErroNaoEncontrado, ErroProibido, ErroValidacao } from '../../errors/AppError.js'
import { logger } from '../../utils/logger.js'

type Tabelas = Database['public']['Tables']
type LinhaChamado = Tabelas['chamados_manutencao']['Row']
type LinhaOrcamento = Tabelas['orcamentos']['Row']
type LinhaOrdem = Tabelas['ordens_manutencao']['Row']
type LinhaLaudo = Tabelas['laudos_tecnicos']['Row']
type LinhaPreventiva = Tabelas['manutencoes_preventivas']['Row']

const CATEGORIAS_MANUTENCAO = ['preventiva', 'corretiva', 'emergencia'] as const
type CategoriaManutencao = (typeof CATEGORIAS_MANUTENCAO)[number]

/** Tarifa de mão de obra usada na estimativa automática do orçamento — provisória até existir uma tabela de precificação por tipo de serviço. */
const VALOR_HORA_PADRAO = 80

const DIAS_POR_FREQUENCIA: Record<string, number> = {
  semanal: 7,
  mensal: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365,
}

const schemaMaterialUsado = z.object({ materialId: z.string().uuid(), quantidade: z.number().positive() })

export class ManutencaoService {
  private readonly usuarios: UsuarioRepository

  constructor(private readonly client: Cliente) {
    this.usuarios = new UsuarioRepository(client)
  }

  /** Quem abre o chamado é o próprio usuário logado como cliente — usuario.clienteId identifica de quem é o chamado. */
  async criarChamado(userId: string, tipoManutencao: CategoriaManutencao, descricao: string): Promise<LinhaChamado> {
    if (!CATEGORIAS_MANUTENCAO.includes(tipoManutencao)) {
      throw new ErroValidacao(`Tipo de manutenção inválido: "${tipoManutencao}".`)
    }
    if (!descricao || descricao.trim().length < 5) {
      throw new ErroValidacao('Descreva o problema com ao menos 5 caracteres.')
    }

    const usuario = await this.buscarUsuarioOuFalhar(userId)
    if (usuario.papel !== 'cliente' || !usuario.clienteId) {
      throw new ErroProibido('Apenas um usuário com papel "cliente" pode abrir um chamado.')
    }

    const prioridade = tipoManutencao === 'emergencia' ? 'urgente' : 'normal'
    const linha = await executarOuFalhar<LinhaChamado>(
      'chamados_manutencao',
      'criar',
      this.client
        .from('chamados_manutencao')
        .insert({
          conta_id: usuario.contaId,
          cliente_id: usuario.clienteId,
          categoria_manutencao: tipoManutencao,
          prioridade,
          descricao: descricao.trim(),
        })
        .select()
        .single()
    )

    logger.info({ chamadoId: linha.id, tipoManutencao, prioridade }, 'Chamado de manutenção aberto.')
    return linha
  }

  /** Orçamento automático: horas estimadas do tipo de serviço (ou 2h default) × tarifa padrão. */
  async gerarOrcamento(chamadoId: string): Promise<LinhaOrcamento> {
    const chamado = await this.buscarChamadoOuFalhar(chamadoId)

    let horasEstimadas = 2
    if (chamado.tipo_servico_id) {
      const tipo = await this.client.from('tipos_servico_manutencao').select('tempo_estimado_horas').eq('id', chamado.tipo_servico_id).maybeSingle()
      if (tipo.data?.tempo_estimado_horas) horasEstimadas = Number(tipo.data.tempo_estimado_horas)
    }

    const valorMaoObra = Math.round(horasEstimadas * VALOR_HORA_PADRAO * 100) / 100
    const itens = [{ descricao: 'Mão de obra estimada', quantidade: horasEstimadas, valorUnitario: VALOR_HORA_PADRAO }]

    const orcamento = await executarOuFalhar<LinhaOrcamento>(
      'orcamentos',
      'criar',
      this.client
        .from('orcamentos')
        .insert({ chamado_id: chamadoId, itens: itens as unknown as Json, valor_mao_obra: valorMaoObra, valor_materiais: 0, gerado_automaticamente: true })
        .select()
        .single()
    )

    await this.client.from('chamados_manutencao').update({ status: 'orcamento_enviado' }).eq('id', chamadoId)
    logger.info({ chamadoId, orcamentoId: orcamento.id, valorMaoObra }, 'Orçamento gerado automaticamente.')
    return orcamento
  }

  async aceitarOrcamento(chamadoId: string, clienteId: string): Promise<LinhaOrcamento> {
    const chamado = await this.buscarChamadoOuFalhar(chamadoId)
    if (chamado.cliente_id !== clienteId) {
      throw new ErroProibido('Este chamado não pertence a este cliente.')
    }

    const { data: orcamento, error: erroOrcamento } = await this.client
      .from('orcamentos')
      .select('*')
      .eq('chamado_id', chamadoId)
      .eq('status', 'pendente')
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (erroOrcamento || !orcamento) throw new ErroNaoEncontrado('Orçamento pendente', chamadoId)

    const atualizado = await executarOuFalhar<LinhaOrcamento>(
      'orcamentos',
      'atualizar',
      this.client.from('orcamentos').update({ status: 'aceito', respondido_em: new Date().toISOString() }).eq('id', orcamento.id).select().single()
    )
    await this.client.from('chamados_manutencao').update({ status: 'orcamento_aceito' }).eq('id', chamadoId)

    logger.info({ chamadoId, orcamentoId: orcamento.id }, 'Orçamento aceito pelo cliente.')
    return atualizado
  }

  /** Cria a ordem (se ainda não existir) e agenda data/técnico — a criação em si fica em criarOrdenManutencao, reaproveitada aqui. */
  async agendarTecnico(chamadoId: string, tecnicoId: string, data: Date): Promise<LinhaOrdem> {
    await this.buscarChamadoOuFalhar(chamadoId)
    const ordem = await this.criarOrdenManutencao(chamadoId, tecnicoId)

    const atualizada = await executarOuFalhar<LinhaOrdem>(
      'ordens_manutencao',
      'atualizar',
      this.client.from('ordens_manutencao').update({ data_agendada: data.toISOString() }).eq('id', ordem.id).select().single()
    )
    await this.client.from('chamados_manutencao').update({ status: 'agendado' }).eq('id', chamadoId)

    logger.info({ chamadoId, tecnicoId, data: atualizada.data_agendada }, 'Técnico agendado.')
    return atualizada
  }

  async criarOrdenManutencao(chamadoId: string, tecnicoId: string): Promise<LinhaOrdem> {
    const chamado = await this.buscarChamadoOuFalhar(chamadoId)

    return executarOuFalhar<LinhaOrdem>(
      'ordens_manutencao',
      'criar',
      this.client
        .from('ordens_manutencao')
        .insert({ conta_id: chamado.conta_id, chamado_id: chamadoId, tecnico_id: tecnicoId, status: 'agendada' })
        .select()
        .single()
    )
  }

  /**
   * Registra os materiais usados numa ordem, com custo travado no
   * momento (materiais_manutencao pode mudar de preço depois — o que
   * foi cobrado nessa ordem não deve mudar retroativamente). Mesmo
   * aviso de não-atomicidade do ConfeitariaService.atualizarMovimentacaoEstoque
   * se aplica ao decremento de estoque_atual abaixo.
   */
  async registrarMaterialsUsados(ordemId: string, materiais: unknown[]): Promise<number> {
    const validados = materiais.map((m) => schemaMaterialUsado.parse(m))
    if (validados.length === 0) throw new ErroValidacao('Informe ao menos um material.')

    const materialIds = validados.map((m) => m.materialId)
    const catalogo = await executarOuFalhar(
      'materiais_manutencao',
      'buscarCustos',
      this.client.from('materiais_manutencao').select('id, custo_unitario, estoque_atual').in('id', materialIds)
    )
    const infoPorMaterial = new Map(catalogo.map((m) => [m.id, m]))

    for (const item of validados) {
      const info = infoPorMaterial.get(item.materialId)
      if (!info) throw new ErroValidacao(`Material "${item.materialId}" não existe.`)
      if (Number(info.estoque_atual) < item.quantidade) {
        throw new ErroValidacao(`Estoque insuficiente de "${item.materialId}": disponível ${info.estoque_atual}.`)
      }
    }

    await executarOuFalhar(
      'materiais_utilizados',
      'criar',
      this.client
        .from('materiais_utilizados')
        .insert(
          validados.map((item) => ({
            ordem_id: ordemId,
            material_id: item.materialId,
            quantidade: item.quantidade,
            custo_unitario_no_momento: infoPorMaterial.get(item.materialId)!.custo_unitario,
          }))
        )
        .select()
    )

    for (const item of validados) {
      const info = infoPorMaterial.get(item.materialId)!
      await this.client
        .from('materiais_manutencao')
        .update({ estoque_atual: Number(info.estoque_atual) - item.quantidade })
        .eq('id', item.materialId)
    }

    logger.info({ ordemId, materiais: validados.length }, 'Materiais utilizados registrados.')
    return validados.length
  }

  async gerarLaudoTecnico(
    ordemId: string,
    dados: { diagnostico?: string; servicosRealizados?: string; recomendacoes?: string } = {}
  ): Promise<LinhaLaudo> {
    const ordem = await this.buscarOrdemOuFalhar(ordemId)
    const diagnostico = dados.diagnostico?.trim() || `Serviço de manutenção executado em ${new Date().toLocaleDateString('pt-BR')}.`

    const laudo = await executarOuFalhar<LinhaLaudo>(
      'laudos_tecnicos',
      'criar',
      this.client
        .from('laudos_tecnicos')
        .insert({
          ordem_id: ordemId,
          tecnico_id: ordem.tecnico_id,
          diagnostico,
          servicos_realizados: dados.servicosRealizados ?? null,
          recomendacoes: dados.recomendacoes ?? null,
        })
        .select()
        .single()
    )

    await this.client.from('ordens_manutencao').update({ status: 'concluida' }).eq('id', ordemId)
    logger.info({ ordemId, laudoId: laudo.id }, 'Laudo técnico gerado.')
    return laudo
  }

  async criarManutencaoPreventiva(clienteId: string, frequencia: string): Promise<LinhaPreventiva> {
    const dias = DIAS_POR_FREQUENCIA[frequencia]
    if (!dias) throw new ErroValidacao(`Frequência inválida: "${frequencia}". Use semanal, mensal, trimestral, semestral ou anual.`)

    const cliente = await this.client.from('clientes').select('conta_id').eq('id', clienteId).maybeSingle()
    if (cliente.error || !cliente.data) throw new ErroNaoEncontrado('Cliente', clienteId)

    const proximaExecucao = new Date(Date.now() + dias * 86_400_000)
    const linha = await executarOuFalhar<LinhaPreventiva>(
      'manutencoes_preventivas',
      'criar',
      this.client
        .from('manutencoes_preventivas')
        .insert({
          conta_id: cliente.data.conta_id,
          cliente_id: clienteId,
          frequencia,
          proxima_execucao: proximaExecucao.toISOString().slice(0, 10),
        })
        .select()
        .single()
    )

    logger.info({ clienteId, frequencia, proximaExecucao: linha.proxima_execucao }, 'Manutenção preventiva agendada.')
    return linha
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarChamadoOuFalhar(chamadoId: string): Promise<LinhaChamado> {
    const { data, error } = await this.client.from('chamados_manutencao').select('*').eq('id', chamadoId).maybeSingle()
    if (error || !data) throw new ErroNaoEncontrado('Chamado', chamadoId)
    return data
  }

  private async buscarOrdemOuFalhar(ordemId: string): Promise<LinhaOrdem> {
    const { data, error } = await this.client.from('ordens_manutencao').select('*').eq('id', ordemId).maybeSingle()
    if (error || !data) throw new ErroNaoEncontrado('Ordem de manutenção', ordemId)
    return data
  }
}
