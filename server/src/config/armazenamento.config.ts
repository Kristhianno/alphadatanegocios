/**
 * Regras do armazenamento de arquivos por conta (ver ArquivoService e a
 * migration 20261111000004_arquivos_storage.sql, que cria os buckets).
 */
export const BUCKET_PUBLICO = 'publico'
export const BUCKET_PRIVADO = 'privado'
export type Bucket = typeof BUCKET_PUBLICO | typeof BUCKET_PRIVADO

export const CATEGORIAS_ARQUIVO = ['catalogo', 'portfolio', 'evento', 'contrato', 'documento', 'outro'] as const
export type CategoriaArquivo = (typeof CATEGORIAS_ARQUIVO)[number]

/** Catálogo e portfólio têm link permanente (vão pro WhatsApp/vitrine); o resto só com link temporário. */
const CATEGORIAS_PUBLICAS: readonly CategoriaArquivo[] = ['catalogo', 'portfolio']

export function bucketDaCategoria(categoria: CategoriaArquivo): Bucket {
  return CATEGORIAS_PUBLICAS.includes(categoria) ? BUCKET_PUBLICO : BUCKET_PRIVADO
}

export type TipoArquivo = 'imagem' | 'video' | 'documento'

const MB = 1024 * 1024

/** Tipos aceitos, extensão gravada no storage e limite por arquivo (o teto do Supabase grátis é 50MB). */
export const TIPOS_ACEITOS: Record<string, { tipo: TipoArquivo; extensao: string }> = {
  'image/jpeg': { tipo: 'imagem', extensao: 'jpg' },
  'image/png': { tipo: 'imagem', extensao: 'png' },
  'image/webp': { tipo: 'imagem', extensao: 'webp' },
  'image/gif': { tipo: 'imagem', extensao: 'gif' },
  'video/mp4': { tipo: 'video', extensao: 'mp4' },
  'video/quicktime': { tipo: 'video', extensao: 'mov' },
  'video/webm': { tipo: 'video', extensao: 'webm' },
  'application/pdf': { tipo: 'documento', extensao: 'pdf' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { tipo: 'documento', extensao: 'docx' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { tipo: 'documento', extensao: 'xlsx' },
  'application/msword': { tipo: 'documento', extensao: 'doc' },
  'application/vnd.ms-excel': { tipo: 'documento', extensao: 'xls' },
}

export const LIMITE_POR_TIPO_BYTES: Record<TipoArquivo, number> = {
  imagem: 10 * MB,
  video: 50 * MB,
  documento: 20 * MB,
}

/**
 * Bucket de um arquivo: fotos/vídeos seguem a categoria; documentos são
 * privados, exceto o PDF de catálogo/portfólio (a IA envia no WhatsApp).
 * Word/Excel nunca vão pro público.
 */
export function bucketDoArquivo(categoria: CategoriaArquivo, tipo: TipoArquivo, tipoMime?: string): Bucket {
  if (tipo !== 'documento') return bucketDaCategoria(categoria)
  return tipoMime === 'application/pdf' ? bucketDaCategoria(categoria) : BUCKET_PRIVADO
}

/** Validade dos links temporários do bucket privado. */
export const VALIDADE_LINK_PRIVADO_SEGUNDOS = 60 * 60

/** Upload preparado e nunca confirmado vira lixo depois disso (ver limparOrfaos). */
export const TOLERANCIA_UPLOAD_PENDENTE_MS = 24 * 60 * 60 * 1000
