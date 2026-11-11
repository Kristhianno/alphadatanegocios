import type { Bucket, CategoriaArquivo, TipoArquivo } from '../config/armazenamento.config.js'

/** Registro de um arquivo guardado no Supabase Storage (tabela `arquivos`). */
export interface Arquivo {
  id: string
  contaId: string
  bucket: Bucket
  /** Caminho do objeto dentro do bucket: `<contaId>/<categoria>/<uuid>.<ext>`. */
  caminho: string
  nomeOriginal: string
  tipoMime: string
  tipo: TipoArquivo
  tamanhoBytes: number
  categoria: CategoriaArquivo
  entidadeTipo: string | null
  entidadeId: string | null
  criadoPor: string | null
  criadoEm: Date
}

/** Arquivo pronto pra exibir: link permanente (bucket público) ou temporário (privado). */
export interface ArquivoComUrl extends Arquivo {
  url: string
  /** true quando `url` expira (bucket privado). */
  urlTemporaria: boolean
}
