import type { ArmazenamentoObjetos, ItemListado } from '../../src/utils/armazenamento-objetos.js'
import type { Bucket } from '../../src/config/armazenamento.config.js'

/** Storage em memória: chave `bucket:caminho` → metadados do objeto. */
export class ArmazenamentoMemoria implements ArmazenamentoObjetos {
  objetos = new Map<string, { tamanhoBytes: number; tipoMime: string; criadoEm: Date }>()

  enviar(bucket: Bucket, caminho: string, tamanhoBytes: number, tipoMime: string, criadoEm = new Date()) {
    this.objetos.set(`${bucket}:${caminho}`, { tamanhoBytes, tipoMime, criadoEm })
  }
  async criarUrlUpload(bucket: Bucket, caminho: string) { return `https://storage.teste/upload/${bucket}/${caminho}?token=x` }
  async metadados(bucket: Bucket, caminho: string) {
    const o = this.objetos.get(`${bucket}:${caminho}`)
    return o ? { tamanhoBytes: o.tamanhoBytes, tipoMime: o.tipoMime } : null
  }
  urlPublica(bucket: Bucket, caminho: string) { return `https://storage.teste/public/${bucket}/${caminho}` }
  async urlsAssinadas(bucket: Bucket, caminhos: string[]) {
    return new Map(caminhos.map((c) => [c, `https://storage.teste/sign/${bucket}/${c}?exp=1h`]))
  }
  async remover(bucket: Bucket, caminhos: string[]) { for (const c of caminhos) this.objetos.delete(`${bucket}:${c}`) }
  async listar(bucket: Bucket, prefixo: string): Promise<ItemListado[]> {
    const nivel = prefixo ? prefixo.split('/').length : 0
    const vistos = new Map<string, ItemListado>()
    for (const [chave, o] of this.objetos) {
      const [b, caminho] = chave.split(/:(.+)/) as [string, string]
      if (b !== bucket || (prefixo && !caminho.startsWith(`${prefixo}/`))) continue
      const partes = caminho.split('/')
      const nome = partes[nivel]!
      const ehPasta = partes.length > nivel + 1
      vistos.set(nome, { nome, ehPasta, criadoEm: ehPasta ? null : o.criadoEm })
    }
    return [...vistos.values()]
  }
}
