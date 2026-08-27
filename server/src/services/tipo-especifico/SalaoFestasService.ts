/**
 * Regras de negócio específicas de Salão de Festas: eventos, equipe
 * por cargo, controle de equipamento, checklist operacional e
 * apuração financeira por evento.
 */
import { z } from 'zod'
import type { Cliente } from '../../config/database.config.js'
import type { Database, Json } from '../../types/database.types.js'
import { UsuarioRepository } from '../../repositories/UsuarioRepository.js'
import { executarOuFalhar } from '../../utils/supabaseHelpers.js'
import { arredondarMoeda } from '../../utils/calculadores.js'
import { ErroNaoEncontrado, ErroValidacao } from '../../errors/AppError.js'
import { logger } from '../../utils/logger.js'

type Tabelas = Database['public']['Tables']
type LinhaEvento = Tabelas['eventos']['Row']
type LinhaEquipe = Tabelas['equipes_evento']['Row']
type LinhaEquipamento = Tabelas['equipamentos_evento']['Row']

export interface Evento {
  id: string
  contaId: string
  nomeEvento: string
  tipoEvento: string
  dataEvento: string
  status: string
  valorTotal: number
  checklist: EtapaChecklist[]
}

export interface EtapaChecklist {
  etapa: string
  concluida: boolean
}

const CHECKLIST_EVENTO_PADRAO: readonly string[] = [
  'Contrato assinado',
  'Sinal recebido',
  'Equipe confirmada',
  'Equipamentos separados',
  'Decoração montada',
  'Som e iluminação testados',
  'Espaço limpo pós-evento',
]

const schemaCriarEvento = z.object({
  clienteId: z.string().uuid(),
  pacoteId: z.string().uuid().optional(),
  agendamentoId: z.string().uuid().optional(),
  nomeEvento: z.string().trim().min(2),
  tipoEvento: z.enum(['aniversario', 'casamento', 'corporativo', 'formatura', 'confraternizacao', 'outro']),
  dataEvento: z.coerce.date(),
  numeroConvidados: z.number().int().positive().optional(),
})

const schemaEquipamento = z.object({
  nomeEquipamento: z.string().trim().min(2),
  quantidade: z.number().int().positive().default(1),
  dataRetirada: z.coerce.date().optional(),
  dataDevolucaoPrevista: z.coerce.date().optional(),
  condicaoSaida: z.enum(['novo', 'bom', 'regular', 'danificado']).optional(),
})

export class SalaoFestasService {
  private readonly usuarios: UsuarioRepository

  constructor(private readonly client: Cliente) {
    this.usuarios = new UsuarioRepository(client)
  }

  async criarEvento(userId: string, dados: unknown): Promise<Evento> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarEvento.parse(dados)

    let valorTotal = 0
    if (validado.pacoteId) {
      const pacote = await this.client.from('pacotes_salao').select('preco_base').eq('id', validado.pacoteId).maybeSingle()
      if (pacote.error || !pacote.data) throw new ErroValidacao(`Pacote "${validado.pacoteId}" não existe.`)
      valorTotal = Number(pacote.data.preco_base)
    }

    const linha = await executarOuFalhar<LinhaEvento>(
      'eventos',
      'criar',
      this.client
        .from('eventos')
        .insert({
          conta_id: usuario.contaId,
          cliente_id: validado.clienteId,
          pacote_id: validado.pacoteId ?? null,
          agendamento_id: validado.agendamentoId ?? null,
          nome_evento: validado.nomeEvento,
          tipo_evento: validado.tipoEvento,
          data_evento: validado.dataEvento.toISOString(),
          numero_convidados: validado.numeroConvidados ?? null,
          valor_total: valorTotal,
          status: 'orcamento', // explícito, não deixado pro default da coluna
        })
        .select()
        .single()
    )

    logger.info({ eventoId: linha.id, tipoEvento: validado.tipoEvento }, 'Evento criado.')
    return this.linhaParaEvento(linha)
  }

  /**
   * Lista eventos da conta do usuário logado — se quem chama tem papel
   * 'cliente', filtra automaticamente só os eventos dele (mesmo padrão
   * de ManutencaoService.listarChamados: nunca deixa um cliente listar
   * eventos de outro cliente da mesma conta).
   */
  async listarEventos(userId: string, filtros: { status?: string } = {}): Promise<Evento[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)

    let query = this.client.from('eventos').select('*').eq('conta_id', usuario.contaId)
    if (usuario.papel === 'cliente') {
      if (!usuario.clienteId) return []
      query = query.eq('cliente_id', usuario.clienteId)
    }
    if (filtros.status) query = query.eq('status', filtros.status)

    const { data, error } = await query.order('data_evento', { ascending: false })
    if (error) throw new ErroValidacao(`Falha ao listar eventos: ${error.message}`)
    return data.map((linha) => this.linhaParaEvento(linha))
  }

  /**
   * Adiciona uma "vaga" de equipe para o evento (ex: "3x Garçom"). O
   * nome do integrante específico ainda não existe nesse ponto — a
   * escalação de pessoas fica pra depois, então `nome` recebe o
   * próprio cargo como placeholder legível.
   */
  async adicionarEquipeEvento(eventoId: string, cargo: string, quantidade: number): Promise<void> {
    if (quantidade <= 0) throw new ErroValidacao('A quantidade precisa ser maior que zero.')
    await this.buscarEventoOuFalhar(eventoId)

    await executarOuFalhar<LinhaEquipe>(
      'equipes_evento',
      'criar',
      this.client
        .from('equipes_evento')
        .insert({ evento_id: eventoId, nome: cargo, cargo, quantidade })
        .select()
        .single()
    )
    logger.info({ eventoId, cargo, quantidade }, 'Vaga de equipe adicionada ao evento.')
  }

  async adicionarEquipamentoEvento(eventoId: string, equipamento: unknown): Promise<void> {
    await this.buscarEventoOuFalhar(eventoId)
    const validado = schemaEquipamento.parse(equipamento)

    await executarOuFalhar<LinhaEquipamento>(
      'equipamentos_evento',
      'criar',
      this.client
        .from('equipamentos_evento')
        .insert({
          evento_id: eventoId,
          nome_equipamento: validado.nomeEquipamento,
          quantidade: validado.quantidade,
          data_retirada: validado.dataRetirada?.toISOString() ?? null,
          data_devolucao_prevista: validado.dataDevolucaoPrevista?.toISOString() ?? null,
          condicao_saida: validado.condicaoSaida ?? null,
        })
        .select()
        .single()
    )
    logger.info({ eventoId, equipamento: validado.nomeEquipamento }, 'Equipamento reservado para o evento.')
  }

  /** Confirma toda a equipe escalada. Pensado pra rodar ~1 semana antes do evento — fora dessa janela só avisa no log, não bloqueia (o gestor pode ter motivo pra confirmar cedo). */
  async confirmarEquipesEvento(eventoId: string): Promise<number> {
    const evento = await this.buscarEventoOuFalhar(eventoId)
    const diasAteEvento = (new Date(evento.data_evento).getTime() - Date.now()) / 86_400_000
    if (diasAteEvento > 7) {
      logger.warn({ eventoId, diasAteEvento: Math.round(diasAteEvento) }, 'Confirmando equipe com mais de 7 dias de antecedência.')
    }

    const { data, error } = await this.client
      .from('equipes_evento')
      .update({ confirmado: true, confirmado_em: new Date().toISOString() })
      .eq('evento_id', eventoId)
      .select('id')
    if (error) throw new ErroValidacao(`Falha ao confirmar equipe: ${error.message}`)

    logger.info({ eventoId, confirmados: data.length }, 'Equipe do evento confirmada.')
    return data.length
  }

  /** Gera o checklist operacional padrão do evento (idempotente — chamar de novo reinicia o checklist). */
  async gerarChecklistEvento(eventoId: string): Promise<Evento> {
    await this.buscarEventoOuFalhar(eventoId)
    const checklist: EtapaChecklist[] = CHECKLIST_EVENTO_PADRAO.map((etapa) => ({ etapa, concluida: false }))

    const linha = await executarOuFalhar<LinhaEvento>(
      'eventos',
      'atualizar',
      this.client.from('eventos').update({ checklist: checklist as unknown as Json }).eq('id', eventoId).select().single()
    )
    logger.info({ eventoId, etapas: checklist.length }, 'Checklist do evento gerado.')
    return this.linhaParaEvento(linha)
  }

  /** Marca o evento como finalizado e registra as fotos entregues. */
  async finalizarEvento(eventoId: string, fotos: string[]): Promise<Evento> {
    await this.buscarEventoOuFalhar(eventoId)
    if (fotos.length > 0) {
      await executarOuFalhar(
        'fotos_evento',
        'criar',
        this.client.from('fotos_evento').insert(fotos.map((url) => ({ evento_id: eventoId, url }))).select()
      )
    }

    const linha = await executarOuFalhar<LinhaEvento>(
      'eventos',
      'atualizar',
      this.client.from('eventos').update({ status: 'finalizado' }).eq('id', eventoId).select().single()
    )
    logger.info({ eventoId, fotos: fotos.length }, 'Evento finalizado.')
    return this.linhaParaEvento(linha)
  }

  /** Soma receita - despesa em financeiro_evento. Sem lançamentos, o lucro é 0 (não usa eventos.valor_total como receita implícita — só o que foi de fato lançado). */
  async calcularLucroEvento(eventoId: string): Promise<number> {
    await this.buscarEventoOuFalhar(eventoId)
    const lancamentos = await executarOuFalhar(
      'financeiro_evento',
      'calcularLucro',
      this.client.from('financeiro_evento').select('tipo, valor').eq('evento_id', eventoId)
    )

    const lucro = lancamentos.reduce((soma, l) => soma + (l.tipo === 'receita' ? Number(l.valor) : -Number(l.valor)), 0)
    return arredondarMoeda(lucro)
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarEventoOuFalhar(eventoId: string): Promise<LinhaEvento> {
    const { data, error } = await this.client.from('eventos').select('*').eq('id', eventoId).maybeSingle()
    if (error || !data) throw new ErroNaoEncontrado('Evento', eventoId)
    return data
  }

  private linhaParaEvento(linha: LinhaEvento): Evento {
    return {
      id: linha.id,
      contaId: linha.conta_id,
      nomeEvento: linha.nome_evento,
      tipoEvento: linha.tipo_evento,
      dataEvento: linha.data_evento,
      status: linha.status,
      valorTotal: Number(linha.valor_total),
      checklist: (linha.checklist as unknown as EtapaChecklist[]) ?? [],
    }
  }
}
