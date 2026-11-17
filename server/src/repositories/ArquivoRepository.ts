import type { Cliente } from '../config/database.config.js'
import type { Arquivo } from '../models/Arquivo.js'
import { Repository, type LinhaBanco } from './Repository.js'
import { ErroPersistencia } from '../errors/AppError.js'

const CAMPOS: Record<string, string> = {
  contaId: 'conta_id',
  bucket: 'bucket',
  caminho: 'caminho',
  nomeOriginal: 'nome_original',
  tipoMime: 'tipo_mime',
  tipo: 'tipo',
  tamanhoBytes: 'tamanho_bytes',
  categoria: 'categoria',
  entidadeTipo: 'entidade_tipo',
  entidadeId: 'entidade_id',
  tema: 'tema',
  criadoPor: 'criado_por',
}

export class ArquivoRepository extends Repository<Arquivo> {
  constructor(private readonly clienteTipado: Cliente) {
    super(clienteTipado, 'arquivos')
  }

  /** Bytes já usados pela conta (base da cota). */
  async somarTamanho(contaId: string): Promise<number> {
    const { data, error } = await this.client.from('arquivos').select('tamanho_bytes').eq('conta_id', contaId)
    if (error) throw new ErroPersistencia('arquivos', 'somarTamanho', error)
    return (data ?? []).reduce((soma, linha) => soma + Number((linha as LinhaBanco)['tamanho_bytes'] ?? 0), 0)
  }

  async caminhosDaConta(contaId: string): Promise<Set<string>> {
    const { data, error } = await this.client.from('arquivos').select('caminho').eq('conta_id', contaId)
    if (error) throw new ErroPersistencia('arquivos', 'caminhosDaConta', error)
    return new Set((data ?? []).map((linha) => (linha as LinhaBanco)['caminho'] as string))
  }

  /** Troca o tema de todos os arquivos de uma entidade que estão em `de` (null = sem tema). Devolve quantos mudaram. */
  async renomearTema(contaId: string, entidadeTipo: string, de: string | null, para: string | null): Promise<number> {
    let query = this.client.from('arquivos').update({ tema: para }).eq('conta_id', contaId).eq('entidade_tipo', entidadeTipo)
    query = de === null ? query.is('tema', null) : query.eq('tema', de)
    const { data, error } = await query.select('id')
    if (error) throw new ErroPersistencia('arquivos', 'renomearTema', error)
    return (data ?? []).length
  }

  protected paraDominio(linha: LinhaBanco): Arquivo {
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      bucket: linha['bucket'] as Arquivo['bucket'],
      caminho: linha['caminho'] as string,
      nomeOriginal: linha['nome_original'] as string,
      tipoMime: linha['tipo_mime'] as string,
      tipo: linha['tipo'] as Arquivo['tipo'],
      tamanhoBytes: Number(linha['tamanho_bytes'] ?? 0),
      categoria: linha['categoria'] as Arquivo['categoria'],
      entidadeTipo: (linha['entidade_tipo'] as string) ?? null,
      entidadeId: (linha['entidade_id'] as string) ?? null,
      tema: (linha['tema'] as string) ?? null,
      criadoPor: (linha['criado_por'] as string) ?? null,
      criadoEm: new Date(linha['criado_em'] as string),
    }
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    for (const [campo, coluna] of Object.entries(CAMPOS)) {
      if (dados[campo] !== undefined) linha[coluna] = dados[campo]
    }
    return linha
  }
}
