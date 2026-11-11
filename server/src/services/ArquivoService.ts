/**
 * Arquivos (fotos, vídeos, PDFs) de cada conta, guardados no Supabase
 * Storage numa pasta por conta: `<bucket>/<contaId>/<categoria>/<uuid>.<ext>`.
 *
 * Fluxo de upload em 2 passos, pra os bytes irem direto do navegador pro
 * Storage (sem passar pelo Worker):
 *   1. prepararUpload — valida tipo, tamanho e cota do plano e devolve uma
 *      URL de upload assinada pra um caminho DENTRO da pasta da conta;
 *   2. confirmarUpload — confere no Storage o tamanho/tipo REAIS do que foi
 *      enviado (não confia no que o navegador disse), revalida a cota e só
 *      então grava o registro. Se algo não bater, apaga o objeto.
 *
 * limparOrfaos (cron diário) remove do Storage as pastas de contas que não
 * existem mais e uploads preparados que nunca foram confirmados.
 */
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import {
  BUCKET_PRIVADO,
  BUCKET_PUBLICO,
  CATEGORIAS_ARQUIVO,
  LIMITE_POR_TIPO_BYTES,
  TIPOS_ACEITOS,
  TOLERANCIA_UPLOAD_PENDENTE_MS,
  VALIDADE_LINK_PRIVADO_SEGUNDOS,
  bucketDoArquivo,
  type Bucket,
  type TipoArquivo,
} from '../config/armazenamento.config.js'
import { getConfigPlano } from '../config/planos.config.js'
import type { Arquivo, ArquivoComUrl } from '../models/Arquivo.js'
import type { Conta } from '../models/User.js'
import { ArquivoRepository } from '../repositories/ArquivoRepository.js'
import { SupabaseArmazenamento, type ArmazenamentoObjetos } from '../utils/armazenamento-objetos.js'
import { ErroNaoEncontrado, ErroPersistencia, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const MB = 1024 * 1024

const schemaPreparar = z.object({
  nome: z.string().trim().min(1).max(200),
  tipoMime: z.string().trim().min(1),
  tamanhoBytes: z.number().int().positive(),
  categoria: z.enum(CATEGORIAS_ARQUIVO),
})

const schemaConfirmar = z.object({
  caminho: z.string().min(1),
  nome: z.string().trim().min(1).max(200),
  categoria: z.enum(CATEGORIAS_ARQUIVO),
  entidadeTipo: z.string().trim().min(1).max(40).optional(),
  entidadeId: z.string().uuid().optional(),
})

const schemaFiltros = z.object({
  tipo: z.enum(['imagem', 'video', 'documento']).optional(),
  categoria: z.enum(CATEGORIAS_ARQUIVO).optional(),
  entidadeTipo: z.string().optional(),
  entidadeId: z.string().uuid().optional(),
})

export interface UsoArmazenamento {
  usadoBytes: number
  limiteBytes: number
  totalArquivos: number
}

function formatarMb(bytes: number): string {
  return `${(bytes / MB).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}MB`
}

function tipoAceito(tipoMime: string): { tipo: TipoArquivo; extensao: string } {
  const aceito = TIPOS_ACEITOS[tipoMime.toLowerCase()]
  if (!aceito) {
    throw new ErroValidacao('Tipo de arquivo não aceito. Envie fotos (JPG, PNG, WEBP, GIF), vídeos (MP4, MOV, WEBM) ou documentos (PDF, Word, Excel).')
  }
  return aceito
}

export class ArquivoService {
  private readonly arquivos: ArquivoRepository
  private readonly armazenamento: ArmazenamentoObjetos

  constructor(
    private readonly client: Cliente,
    armazenamento?: ArmazenamentoObjetos,
  ) {
    this.arquivos = new ArquivoRepository(client)
    this.armazenamento = armazenamento ?? new SupabaseArmazenamento(client)
  }

  limiteBytes(conta: Pick<Conta, 'plano'>): number {
    return getConfigPlano(conta.plano).limiteArmazenamentoMb * MB
  }

  async uso(conta: Pick<Conta, 'id' | 'plano'>): Promise<UsoArmazenamento> {
    const lista = await this.arquivos.listar({ conta_id: conta.id })
    return {
      usadoBytes: lista.reduce((soma, a) => soma + a.tamanhoBytes, 0),
      limiteBytes: this.limiteBytes(conta),
      totalArquivos: lista.length,
    }
  }

  async prepararUpload(conta: Pick<Conta, 'id' | 'plano'>, dados: unknown): Promise<{ caminho: string; bucket: Bucket; urlUpload: string }> {
    const validado = schemaPreparar.parse(dados)
    const { tipo, extensao } = tipoAceito(validado.tipoMime)
    this.validarTamanho(tipo, validado.tamanhoBytes)
    await this.validarCota(conta, validado.tamanhoBytes)

    const bucket = bucketDoArquivo(validado.categoria, tipo)
    const caminho = `${conta.id}/${validado.categoria}/${randomUUID()}.${extensao}`
    const urlUpload = await this.armazenamento.criarUrlUpload(bucket, caminho)
    return { caminho, bucket, urlUpload }
  }

  async confirmarUpload(conta: Pick<Conta, 'id' | 'plano'>, usuarioId: string, dados: unknown): Promise<ArquivoComUrl> {
    const validado = schemaConfirmar.parse(dados)

    // O caminho veio do navegador: só aceita um que esteja na pasta desta conta e da categoria declarada.
    const partes = validado.caminho.split('/')
    if (partes.length !== 3 || partes[0] !== conta.id || partes[1] !== validado.categoria || !/^[0-9a-f-]{36}\.[a-z0-9]+$/.test(partes[2] ?? '')) {
      throw new ErroValidacao('Caminho de upload inválido.')
    }
    const extensao = (partes[2] ?? '').split('.')[1]
    const esperado = Object.entries(TIPOS_ACEITOS).find(([, info]) => info.extensao === extensao)
    if (!esperado) throw new ErroValidacao('Caminho de upload inválido.')
    const tipo = esperado[1].tipo
    const bucket = bucketDoArquivo(validado.categoria, tipo)

    const jaExiste = await this.arquivos.listar({ caminho: validado.caminho }, { limite: 1 })
    if (jaExiste.length > 0) throw new ErroValidacao('Este arquivo já foi registrado.')

    const real = await this.armazenamento.metadados(bucket, validado.caminho)
    if (!real) throw new ErroValidacao('O envio do arquivo não foi concluído. Tente de novo.')

    const tipoMime = (real.tipoMime ?? esperado[0]).toLowerCase()
    try {
      const aceito = tipoAceito(tipoMime)
      if (aceito.tipo !== tipo) throw new ErroValidacao('O arquivo enviado não corresponde ao tipo informado.')
      this.validarTamanho(tipo, real.tamanhoBytes)
      await this.validarCota(conta, real.tamanhoBytes)
    } catch (erro) {
      await this.armazenamento.remover(bucket, [validado.caminho]).catch(() => {})
      throw erro
    }

    const arquivo = await this.arquivos.criar({
      contaId: conta.id,
      bucket,
      caminho: validado.caminho,
      nomeOriginal: validado.nome,
      tipoMime,
      tipo,
      tamanhoBytes: real.tamanhoBytes,
      categoria: validado.categoria,
      entidadeTipo: validado.entidadeTipo ?? null,
      entidadeId: validado.entidadeId ?? null,
      criadoPor: usuarioId,
    })
    logger.info({ contaId: conta.id, arquivoId: arquivo.id, tipo, bytes: real.tamanhoBytes }, 'Arquivo enviado.')
    const [comUrl] = await this.comUrls([arquivo])
    return comUrl!
  }

  async listar(contaId: string, filtros: unknown = {}): Promise<ArquivoComUrl[]> {
    const validado = schemaFiltros.parse(filtros)
    const filtroBanco: Record<string, unknown> = { conta_id: contaId }
    if (validado.tipo) filtroBanco['tipo'] = validado.tipo
    if (validado.categoria) filtroBanco['categoria'] = validado.categoria
    if (validado.entidadeTipo) filtroBanco['entidade_tipo'] = validado.entidadeTipo
    if (validado.entidadeId) filtroBanco['entidade_id'] = validado.entidadeId
    const lista = await this.arquivos.listar(filtroBanco, { ordenarPor: 'criado_em', ascendente: false })
    return this.comUrls(lista)
  }

  async excluir(contaId: string, arquivoId: string): Promise<void> {
    const arquivo = await this.arquivos.buscarPorId(arquivoId)
    if (!arquivo || arquivo.contaId !== contaId) throw new ErroNaoEncontrado('Arquivo', arquivoId)
    await this.armazenamento.remover(arquivo.bucket, [arquivo.caminho])
    await this.arquivos.deletar(arquivoId)
    logger.info({ contaId, arquivoId }, 'Arquivo excluído.')
  }

  /**
   * Faxina do Storage (cron diário): apaga a pasta inteira de contas que
   * não existem mais (o banco apaga os registros em cascata, mas os bytes
   * ficavam) e uploads preparados há mais de 24h que nunca viraram registro.
   */
  async limparOrfaos(agora = Date.now()): Promise<{ removidos: number }> {
    const { data, error } = await this.client.from('contas').select('id')
    if (error) throw new ErroPersistencia('contas', 'limparOrfaos', error)
    const contasExistentes = new Set((data ?? []).map((c) => (c as { id: string }).id))

    let removidos = 0
    for (const bucket of [BUCKET_PUBLICO, BUCKET_PRIVADO] as Bucket[]) {
      for (const pastaConta of await this.armazenamento.listar(bucket, '')) {
        if (!pastaConta.ehPasta) continue
        const contaId = pastaConta.nome
        const contaExiste = contasExistentes.has(contaId)
        const registrados = contaExiste ? await this.arquivos.caminhosDaConta(contaId) : new Set<string>()

        const paraRemover: string[] = []
        for (const pastaCategoria of await this.armazenamento.listar(bucket, contaId)) {
          if (!pastaCategoria.ehPasta) continue
          const prefixo = `${contaId}/${pastaCategoria.nome}`
          for (const item of await this.armazenamento.listar(bucket, prefixo)) {
            if (item.ehPasta) continue
            const caminho = `${prefixo}/${item.nome}`
            const antigo = !item.criadoEm || agora - item.criadoEm.getTime() > TOLERANCIA_UPLOAD_PENDENTE_MS
            if (!contaExiste || (!registrados.has(caminho) && antigo)) paraRemover.push(caminho)
          }
        }
        if (paraRemover.length > 0) {
          await this.armazenamento.remover(bucket, paraRemover)
          removidos += paraRemover.length
        }
      }
    }
    if (removidos > 0) logger.info({ removidos }, 'Limpeza do storage concluída.')
    return { removidos }
  }

  private validarTamanho(tipo: TipoArquivo, tamanhoBytes: number): void {
    const limite = LIMITE_POR_TIPO_BYTES[tipo]
    if (tamanhoBytes > limite) {
      const nome = { imagem: 'Fotos', video: 'Vídeos', documento: 'Documentos' }[tipo]
      throw new ErroValidacao(`${nome} podem ter no máximo ${formatarMb(limite)}. Este arquivo tem ${formatarMb(tamanhoBytes)}.`)
    }
  }

  private async validarCota(conta: Pick<Conta, 'id' | 'plano'>, novosBytes: number): Promise<void> {
    const usado = await this.arquivos.somarTamanho(conta.id)
    const limite = this.limiteBytes(conta)
    if (usado + novosBytes > limite) {
      throw new ErroValidacao(
        `Espaço de arquivos cheio: ${formatarMb(usado)} de ${formatarMb(limite)} usados. Exclua arquivos que não usa mais ou mude de plano.`,
      )
    }
  }

  private async comUrls(lista: Arquivo[]): Promise<ArquivoComUrl[]> {
    const privados = lista.filter((a) => a.bucket === BUCKET_PRIVADO).map((a) => a.caminho)
    const assinadas = await this.armazenamento.urlsAssinadas(BUCKET_PRIVADO, privados, VALIDADE_LINK_PRIVADO_SEGUNDOS)
    return lista.map((a) =>
      a.bucket === BUCKET_PUBLICO
        ? { ...a, url: this.armazenamento.urlPublica(a.bucket, a.caminho), urlTemporaria: false }
        : { ...a, url: assinadas.get(a.caminho) ?? '', urlTemporaria: true },
    )
  }
}
