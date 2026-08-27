/**
 * Regras de negócio específicas de Fotografia e Vídeo: sessões, upload
 * de fotos (originais x editadas), progresso de edição, portfólio com
 * permissão do cliente, galeria privada com expiração e produção de
 * vídeo.
 */
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import type { Cliente } from '../../config/database.config.js'
import type { Database } from '../../types/database.types.js'
import { UsuarioRepository } from '../../repositories/UsuarioRepository.js'
import { executarOuFalhar } from '../../utils/supabaseHelpers.js'
import { ErroNaoEncontrado, ErroProibido, ErroValidacao } from '../../errors/AppError.js'
import { logger } from '../../utils/logger.js'

type Tabelas = Database['public']['Tables']
type LinhaSessao = Tabelas['sessoes_foto']['Row']
type LinhaGaleria = Tabelas['galeria_cliente']['Row']
type LinhaProducaoVideo = Tabelas['producoes_video']['Row']

export interface SessaoFoto {
  id: string
  contaId: string
  clienteId: string
  tipoSessao: string
  dataSessao: string
  status: string
  percentualEdicaoConcluida: number
}

const schemaCriarSessao = z.object({
  clienteId: z.string().uuid(),
  pacoteId: z.string().uuid().optional(),
  agendamentoId: z.string().uuid().optional(),
  fotografoId: z.string().uuid().optional(),
  tipoSessao: z.enum(['ensaio', 'casamento', 'evento', 'produto', 'institucional', 'outro']),
  dataSessao: z.coerce.date(),
  local: z.string().optional(),
})

const schemaCriarProducaoVideo = z.object({
  clienteId: z.string().uuid(),
  sessaoId: z.string().uuid().optional(),
  titulo: z.string().trim().min(2),
  duracaoEstimadaSegundos: z.number().int().positive().optional(),
  editorId: z.string().uuid().optional(),
})

const ORDEM_STATUS_SESSAO = ['agendada', 'realizada', 'em_edicao', 'entregue', 'cancelada'] as const

export class FotografiaService {
  private readonly usuarios: UsuarioRepository

  constructor(private readonly client: Cliente) {
    this.usuarios = new UsuarioRepository(client)
  }

  async criarSessaoFoto(userId: string, dados: unknown): Promise<SessaoFoto> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarSessao.parse(dados)

    let valorTotal: number | null = null
    if (validado.pacoteId) {
      const pacote = await this.client.from('pacotes_fotografia').select('preco_base').eq('id', validado.pacoteId).maybeSingle()
      if (pacote.error || !pacote.data) throw new ErroValidacao(`Pacote "${validado.pacoteId}" não existe.`)
      valorTotal = Number(pacote.data.preco_base)
    }

    const linha = await executarOuFalhar<LinhaSessao>(
      'sessoes_foto',
      'criar',
      this.client
        .from('sessoes_foto')
        .insert({
          conta_id: usuario.contaId,
          cliente_id: validado.clienteId,
          pacote_id: validado.pacoteId ?? null,
          agendamento_id: validado.agendamentoId ?? null,
          fotografo_id: validado.fotografoId ?? null,
          tipo_sessao: validado.tipoSessao,
          data_sessao: validado.dataSessao.toISOString(),
          local: validado.local ?? null,
          status: 'agendada', // explícito, não deixado pro default da coluna — é o estado inicial que atualizarStatusEdicao espera encontrar
          valor_total: valorTotal,
        })
        .select()
        .single()
    )

    logger.info({ sessaoId: linha.id, tipoSessao: validado.tipoSessao }, 'Sessão de fotografia criada.')
    return this.linhaParaSessao(linha)
  }

  /**
   * Lista sessões da conta do usuário logado — se quem chama tem papel
   * 'cliente', filtra automaticamente só as sessões dele (mesmo padrão
   * de ManutencaoService.listarChamados: nunca deixa um cliente listar
   * sessões de outro cliente da mesma conta).
   */
  async listarSessoes(userId: string, filtros: { status?: string } = {}): Promise<SessaoFoto[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)

    let query = this.client.from('sessoes_foto').select('*').eq('conta_id', usuario.contaId)
    if (usuario.papel === 'cliente') {
      if (!usuario.clienteId) return []
      query = query.eq('cliente_id', usuario.clienteId)
    }
    if (filtros.status) query = query.eq('status', filtros.status)

    const { data, error } = await query.order('data_sessao', { ascending: false })
    if (error) throw new ErroValidacao(`Falha ao listar sessões: ${error.message}`)
    return data.map((linha) => this.linhaParaSessao(linha))
  }

  async uploadFotosOriginal(sessaoId: string, fotos: string[]): Promise<number> {
    if (fotos.length === 0) throw new ErroValidacao('Envie ao menos uma foto.')
    await this.buscarSessaoOuFalhar(sessaoId)

    const { data, error } = await this.client
      .from('fotos_sessao')
      .insert(fotos.map((url, ordem) => ({ sessao_id: sessaoId, tipo: 'original', url, ordem })))
      .select('id')
    if (error) throw new ErroValidacao(`Falha ao registrar fotos: ${error.message}`)

    logger.info({ sessaoId, quantidade: data.length }, 'Fotos originais registradas.')
    return data.length
  }

  /** Atualiza o percentual de edição concluída. Some para 'em_edicao' automaticamente quando 0 < percentual < 100 — nunca retrocede um status mais avançado que isso (ex: 'entregue'). */
  async atualizarStatusEdicao(sessaoId: string, percentual: number): Promise<SessaoFoto> {
    if (percentual < 0 || percentual > 100) throw new ErroValidacao('Percentual precisa estar entre 0 e 100.')
    const sessao = await this.buscarSessaoOuFalhar(sessaoId)

    const indiceAtual = ORDEM_STATUS_SESSAO.indexOf(sessao.status as (typeof ORDEM_STATUS_SESSAO)[number])
    const indiceEmEdicao = ORDEM_STATUS_SESSAO.indexOf('em_edicao')
    const novoStatus = percentual > 0 && indiceAtual >= 0 && indiceAtual < indiceEmEdicao ? 'em_edicao' : sessao.status

    const linha = await executarOuFalhar<LinhaSessao>(
      'sessoes_foto',
      'atualizar',
      this.client
        .from('sessoes_foto')
        .update({ percentual_edicao_concluida: percentual, status: novoStatus })
        .eq('id', sessaoId)
        .select()
        .single()
    )
    logger.info({ sessaoId, percentual }, 'Progresso de edição atualizado.')
    return this.linhaParaSessao(linha)
  }

  /** Marca as fotos escolhidas pelo cliente como selecionadas — só dentro da própria sessão (evita um id de outra sessão vazar por engano). */
  async marcarFotosClienteMelhorEs(sessaoId: string, fotosIds: string[]): Promise<number> {
    if (fotosIds.length === 0) throw new ErroValidacao('Selecione ao menos uma foto.')
    await this.buscarSessaoOuFalhar(sessaoId)

    const { data, error } = await this.client
      .from('fotos_sessao')
      .update({ selecionada_cliente: true })
      .eq('sessao_id', sessaoId)
      .in('id', fotosIds)
      .select('id')
    if (error) throw new ErroValidacao(`Falha ao marcar fotos: ${error.message}`)

    logger.info({ sessaoId, marcadas: data.length }, 'Fotos favoritas do cliente marcadas.')
    return data.length
  }

  /** Gera um link de galeria privada com token opaco e expiração — e marca a sessão como entregue. */
  async entregarGaleriaPrivada(sessaoId: string, diasValidade: number): Promise<{ tokenAcesso: string; expiraEm: string }> {
    if (diasValidade <= 0) throw new ErroValidacao('diasValidade precisa ser maior que zero.')
    await this.buscarSessaoOuFalhar(sessaoId)

    const tokenAcesso = randomBytes(24).toString('base64url')
    const expiraEm = new Date(Date.now() + diasValidade * 86_400_000)

    const galeria = await executarOuFalhar<LinhaGaleria>(
      'galeria_cliente',
      'criar',
      this.client
        .from('galeria_cliente')
        .insert({ sessao_id: sessaoId, token_acesso: tokenAcesso, expira_em: expiraEm.toISOString() })
        .select()
        .single()
    )

    await this.client.from('sessoes_foto').update({ status: 'entregue' }).eq('id', sessaoId)

    logger.info({ sessaoId, expiraEm: galeria.expira_em }, 'Galeria privada entregue.')
    return { tokenAcesso: galeria.token_acesso, expiraEm: galeria.expira_em }
  }

  /** Adiciona as fotos que o cliente marcou como favoritas ao portfólio. Sem permissão do cliente, não é possível tornar público (mesma regra do banco: chk_portfolio_publico_requer_permissao). */
  async adicionarAoPortfolio(sessaoId: string, permissaoCliente: boolean): Promise<number> {
    const sessao = await this.buscarSessaoOuFalhar(sessaoId)
    if (!permissaoCliente) {
      throw new ErroProibido('Sem permissão do cliente, as fotos não podem ir para o portfólio público.')
    }

    const favoritas = await executarOuFalhar(
      'fotos_sessao',
      'buscarFavoritas',
      this.client.from('fotos_sessao').select('id').eq('sessao_id', sessaoId).eq('selecionada_cliente', true)
    )
    if (favoritas.length === 0) throw new ErroValidacao('Nenhuma foto foi marcada como favorita pelo cliente ainda.')

    await executarOuFalhar(
      'portfolio_fotografo',
      'criar',
      this.client
        .from('portfolio_fotografo')
        .insert(
          favoritas.map((f) => ({
            conta_id: sessao.conta_id,
            fotografo_id: sessao.fotografo_id,
            sessao_id: sessaoId,
            foto_id: f.id,
            permissao_cliente: true,
            permissao_concedida_em: new Date().toISOString(),
            publico: true,
          }))
        )
        .select()
    )

    logger.info({ sessaoId, quantidade: favoritas.length }, 'Fotos adicionadas ao portfólio.')
    return favoritas.length
  }

  async criarProducaoVideo(userId: string, dados: unknown): Promise<LinhaProducaoVideo> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarProducaoVideo.parse(dados)

    const linha = await executarOuFalhar<LinhaProducaoVideo>(
      'producoes_video',
      'criar',
      this.client
        .from('producoes_video')
        .insert({
          conta_id: usuario.contaId,
          cliente_id: validado.clienteId,
          sessao_id: validado.sessaoId ?? null,
          titulo: validado.titulo,
          duracao_estimada_segundos: validado.duracaoEstimadaSegundos ?? null,
          editor_id: validado.editorId ?? null,
          status: 'captacao', // explícito, não deixado pro default da coluna
        })
        .select()
        .single()
    )
    logger.info({ producaoId: linha.id, titulo: validado.titulo }, 'Produção de vídeo criada.')
    return linha
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarSessaoOuFalhar(sessaoId: string): Promise<LinhaSessao> {
    const { data, error } = await this.client.from('sessoes_foto').select('*').eq('id', sessaoId).maybeSingle()
    if (error || !data) throw new ErroNaoEncontrado('Sessão de fotografia', sessaoId)
    return data
  }

  private linhaParaSessao(linha: LinhaSessao): SessaoFoto {
    return {
      id: linha.id,
      contaId: linha.conta_id,
      clienteId: linha.cliente_id,
      tipoSessao: linha.tipo_sessao,
      dataSessao: linha.data_sessao,
      status: linha.status,
      percentualEdicaoConcluida: linha.percentual_edicao_concluida,
    }
  }
}
