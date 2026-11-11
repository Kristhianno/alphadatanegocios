/**
 * Acesso aos bytes no Supabase Storage atrás de uma interface pequena —
 * ArquivoService só depende disto, o que deixa os testes rodarem com uma
 * implementação em memória (sem rede, sem bucket de verdade).
 */
import type { Cliente } from '../config/database.config.js'
import type { Bucket } from '../config/armazenamento.config.js'

export interface ItemListado {
  nome: string
  /** Pasta (prefixo) em vez de arquivo — o Storage lista "pastas" sem id. */
  ehPasta: boolean
  criadoEm: Date | null
}

export interface ArmazenamentoObjetos {
  /** URL (com token) pra o navegador enviar o arquivo direto pro Storage, sem passar pelo backend. */
  criarUrlUpload(bucket: Bucket, caminho: string): Promise<string>
  /** Tamanho e tipo reais do objeto já enviado; null se não existe. */
  metadados(bucket: Bucket, caminho: string): Promise<{ tamanhoBytes: number; tipoMime: string | null } | null>
  urlPublica(bucket: Bucket, caminho: string): string
  urlsAssinadas(bucket: Bucket, caminhos: string[], validadeSegundos: number): Promise<Map<string, string>>
  remover(bucket: Bucket, caminhos: string[]): Promise<void>
  /** Conteúdo imediato de um prefixo (um nível só). */
  listar(bucket: Bucket, prefixo: string): Promise<ItemListado[]>
}

export class SupabaseArmazenamento implements ArmazenamentoObjetos {
  constructor(private readonly client: Cliente) {}

  async criarUrlUpload(bucket: Bucket, caminho: string): Promise<string> {
    const { data, error } = await this.client.storage.from(bucket).createSignedUploadUrl(caminho)
    if (error || !data) throw new Error(`Não foi possível preparar o upload: ${error?.message ?? 'sem resposta'}`)
    return data.signedUrl
  }

  async metadados(bucket: Bucket, caminho: string) {
    const barra = caminho.lastIndexOf('/')
    const pasta = caminho.slice(0, barra)
    const nome = caminho.slice(barra + 1)
    const { data, error } = await this.client.storage.from(bucket).list(pasta, { search: nome, limit: 10 })
    if (error) throw new Error(`Não foi possível ler o arquivo no storage: ${error.message}`)
    const item = (data ?? []).find((i) => i.name === nome)
    if (!item) return null
    const meta = (item.metadata ?? {}) as { size?: number; mimetype?: string }
    return { tamanhoBytes: Number(meta.size ?? 0), tipoMime: meta.mimetype ?? null }
  }

  urlPublica(bucket: Bucket, caminho: string): string {
    return this.client.storage.from(bucket).getPublicUrl(caminho).data.publicUrl
  }

  async urlsAssinadas(bucket: Bucket, caminhos: string[], validadeSegundos: number): Promise<Map<string, string>> {
    const mapa = new Map<string, string>()
    if (caminhos.length === 0) return mapa
    const { data, error } = await this.client.storage.from(bucket).createSignedUrls(caminhos, validadeSegundos)
    if (error) throw new Error(`Não foi possível gerar os links: ${error.message}`)
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) mapa.set(item.path, item.signedUrl)
    }
    return mapa
  }

  async remover(bucket: Bucket, caminhos: string[]): Promise<void> {
    for (let i = 0; i < caminhos.length; i += 500) {
      const { error } = await this.client.storage.from(bucket).remove(caminhos.slice(i, i + 500))
      if (error) throw new Error(`Não foi possível remover arquivos: ${error.message}`)
    }
  }

  async listar(bucket: Bucket, prefixo: string): Promise<ItemListado[]> {
    const itens: ItemListado[] = []
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await this.client.storage.from(bucket).list(prefixo, { limit: 1000, offset })
      if (error) throw new Error(`Não foi possível listar o storage: ${error.message}`)
      for (const item of data ?? []) {
        itens.push({ nome: item.name, ehPasta: !item.id, criadoEm: item.created_at ? new Date(item.created_at) : null })
      }
      if (!data || data.length < 1000) break
    }
    return itens
  }
}
