import { describe, expect, it } from 'vitest'
import { ArquivoService } from '../../src/services/ArquivoService.js'
import type { ArmazenamentoObjetos, ItemListado } from '../../src/utils/armazenamento-objetos.js'
import type { Bucket } from '../../src/config/armazenamento.config.js'
import { ErroNaoEncontrado, ErroValidacao } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

const MB = 1024 * 1024
const DIA_MS = 24 * 60 * 60 * 1000

/** Storage em memória: chave `bucket:caminho` → metadados do objeto. */
class ArmazenamentoMemoria implements ArmazenamentoObjetos {
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

function cenario(plano: 'startup' | 'profissional' = 'startup') {
  const fake = criarClienteFake()
  const [contaA, contaB] = fake.semear('contas', [
    { nome_empresa: 'Festa Mágica', tipo_negocio: 'salao_festas', plano, status: 'ativo', configuracoes_gerais: {} },
    { nome_empresa: 'Outra', tipo_negocio: 'salao_festas', plano, status: 'ativo', configuracoes_gerais: {} },
  ])
  const armazenamento = new ArmazenamentoMemoria()
  const service = new ArquivoService(paraTipado(fake), armazenamento)
  const conta = { id: contaA!['id'] as string, plano }
  const outra = { id: contaB!['id'] as string, plano }
  return { fake, service, armazenamento, conta, outra }
}

async function enviarCompleto(c: ReturnType<typeof cenario>, dados: { tipoMime: string; tamanhoBytes: number; categoria: string; nome?: string }) {
  const { caminho, bucket } = await c.service.prepararUpload(c.conta, { nome: dados.nome ?? 'arquivo', ...dados })
  c.armazenamento.enviar(bucket, caminho, dados.tamanhoBytes, dados.tipoMime)
  return c.service.confirmarUpload(c.conta, 'usuario-1', { caminho, nome: dados.nome ?? 'arquivo', categoria: dados.categoria })
}

describe('ArquivoService.prepararUpload', () => {
  it('foto de catálogo vai pro bucket público, na pasta da conta e da categoria', async () => {
    const c = cenario()
    const r = await c.service.prepararUpload(c.conta, { nome: 'kit.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 300_000, categoria: 'catalogo' })
    expect(r.bucket).toBe('publico')
    expect(r.caminho).toMatch(new RegExp(`^${c.conta.id}/catalogo/[0-9a-f-]{36}\\.jpg$`))
    expect(r.urlUpload).toContain('token=')
  })

  it('contrato e qualquer PDF vão pro privado, mesmo marcado como catálogo', async () => {
    const c = cenario()
    expect((await c.service.prepararUpload(c.conta, { nome: 'c.pdf', tipoMime: 'application/pdf', tamanhoBytes: 1000, categoria: 'contrato' })).bucket).toBe('privado')
    expect((await c.service.prepararUpload(c.conta, { nome: 'c.pdf', tipoMime: 'application/pdf', tamanhoBytes: 1000, categoria: 'catalogo' })).bucket).toBe('privado')
  })

  it('recusa tipo não aceito e arquivo acima do limite do tipo', async () => {
    const c = cenario()
    await expect(c.service.prepararUpload(c.conta, { nome: 'x.exe', tipoMime: 'application/x-msdownload', tamanhoBytes: 10, categoria: 'outro' })).rejects.toBeInstanceOf(ErroValidacao)
    await expect(c.service.prepararUpload(c.conta, { nome: 'f.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 11 * MB, categoria: 'catalogo' })).rejects.toThrow(/Fotos podem ter no máximo/)
    await expect(c.service.prepararUpload(c.conta, { nome: 'v.mp4', tipoMime: 'video/mp4', tamanhoBytes: 51 * MB, categoria: 'portfolio' })).rejects.toThrow(/Vídeos/)
  })

  it('recusa quando passa da cota do plano (Essencial = 1GB)', async () => {
    const c = cenario('startup')
    c.fake.semear('arquivos', [
      { conta_id: c.conta.id, bucket: 'privado', caminho: `${c.conta.id}/evento/a.mp4`, nome_original: 'a', tipo_mime: 'video/mp4', tipo: 'video', tamanho_bytes: 1024 * MB - 1000, categoria: 'evento' },
    ])
    await expect(c.service.prepararUpload(c.conta, { nome: 'f.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 5000, categoria: 'catalogo' })).rejects.toThrow(/Espaço de arquivos cheio/)
  })
})

describe('ArquivoService.confirmarUpload', () => {
  it('registra com o tamanho REAL do storage e devolve link permanente pro catálogo', async () => {
    const c = cenario()
    const { caminho, bucket } = await c.service.prepararUpload(c.conta, { nome: 'kit.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 100, categoria: 'catalogo' })
    c.armazenamento.enviar(bucket, caminho, 250_000, 'image/jpeg')
    const arquivo = await c.service.confirmarUpload(c.conta, 'usuario-1', { caminho, nome: 'kit.jpg', categoria: 'catalogo' })

    expect(arquivo).toMatchObject({ tamanhoBytes: 250_000, tipo: 'imagem', bucket: 'publico', urlTemporaria: false, nomeOriginal: 'kit.jpg' })
    expect(arquivo.url).toContain('/public/publico/')
    expect((await c.service.uso(c.conta)).usadoBytes).toBe(250_000)
  })

  it('arquivo privado volta com link temporário', async () => {
    const c = cenario()
    const contrato = await enviarCompleto(c, { tipoMime: 'application/pdf', tamanhoBytes: 2000, categoria: 'contrato' })
    expect(contrato.urlTemporaria).toBe(true)
    expect(contrato.url).toContain('/sign/privado/')
  })

  it('não aceita caminho de outra conta (upload forjado)', async () => {
    const c = cenario()
    const daOutra = await c.service.prepararUpload(c.outra, { nome: 'f.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 100, categoria: 'catalogo' })
    c.armazenamento.enviar(daOutra.bucket, daOutra.caminho, 100, 'image/jpeg')
    await expect(c.service.confirmarUpload(c.conta, 'u', { caminho: daOutra.caminho, nome: 'f.jpg', categoria: 'catalogo' })).rejects.toThrow(/Caminho de upload inválido/)
  })

  it('falha se o arquivo não chegou ao storage', async () => {
    const c = cenario()
    const { caminho } = await c.service.prepararUpload(c.conta, { nome: 'f.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 100, categoria: 'catalogo' })
    await expect(c.service.confirmarUpload(c.conta, 'u', { caminho, nome: 'f.jpg', categoria: 'catalogo' })).rejects.toThrow(/não foi concluído/)
  })

  it('se o tamanho real estoura o limite, apaga o objeto e não registra', async () => {
    const c = cenario()
    const { caminho, bucket } = await c.service.prepararUpload(c.conta, { nome: 'f.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 100, categoria: 'catalogo' })
    c.armazenamento.enviar(bucket, caminho, 15 * MB, 'image/jpeg')
    await expect(c.service.confirmarUpload(c.conta, 'u', { caminho, nome: 'f.jpg', categoria: 'catalogo' })).rejects.toBeInstanceOf(ErroValidacao)
    expect(c.armazenamento.objetos.size).toBe(0)
    expect(await c.service.listar(c.conta.id)).toHaveLength(0)
  })

  it('não registra o mesmo caminho duas vezes', async () => {
    const c = cenario()
    const { caminho, bucket } = await c.service.prepararUpload(c.conta, { nome: 'f.jpg', tipoMime: 'image/jpeg', tamanhoBytes: 100, categoria: 'catalogo' })
    c.armazenamento.enviar(bucket, caminho, 100, 'image/jpeg')
    await c.service.confirmarUpload(c.conta, 'u', { caminho, nome: 'f.jpg', categoria: 'catalogo' })
    await expect(c.service.confirmarUpload(c.conta, 'u', { caminho, nome: 'f.jpg', categoria: 'catalogo' })).rejects.toThrow(/já foi registrado/)
  })
})

describe('ArquivoService.listar / excluir', () => {
  it('filtra por tipo e isola por conta; excluir apaga do storage e do banco', async () => {
    const c = cenario()
    const foto = await enviarCompleto(c, { tipoMime: 'image/png', tamanhoBytes: 1000, categoria: 'catalogo' })
    await enviarCompleto(c, { tipoMime: 'application/pdf', tamanhoBytes: 1000, categoria: 'documento' })

    expect(await c.service.listar(c.conta.id, { tipo: 'imagem' })).toHaveLength(1)
    expect(await c.service.listar(c.outra.id)).toHaveLength(0)
    await expect(c.service.excluir(c.outra.id, foto.id)).rejects.toBeInstanceOf(ErroNaoEncontrado)

    await c.service.excluir(c.conta.id, foto.id)
    expect(await c.service.listar(c.conta.id)).toHaveLength(1)
    expect(await c.armazenamento.metadados('publico', foto.caminho)).toBeNull()
  })
})

describe('ArquivoService.limparOrfaos', () => {
  it('apaga pasta de conta excluída e upload pendente antigo; mantém registrados e recentes', async () => {
    const c = cenario()
    const registrado = await enviarCompleto(c, { tipoMime: 'image/jpeg', tamanhoBytes: 100, categoria: 'catalogo' })
    const antigo = new Date(Date.now() - 2 * DIA_MS)
    c.armazenamento.enviar('publico', `${c.conta.id}/catalogo/11111111-1111-1111-1111-111111111111.jpg`, 100, 'image/jpeg', antigo)
    c.armazenamento.enviar('publico', `${c.conta.id}/catalogo/22222222-2222-2222-2222-222222222222.jpg`, 100, 'image/jpeg')
    c.armazenamento.enviar('privado', 'conta-que-nao-existe/contrato/33333333-3333-3333-3333-333333333333.pdf', 100, 'application/pdf')

    const { removidos } = await c.service.limparOrfaos()

    expect(removidos).toBe(2)
    expect(await c.armazenamento.metadados('publico', registrado.caminho)).not.toBeNull()
    expect(await c.armazenamento.metadados('publico', `${c.conta.id}/catalogo/22222222-2222-2222-2222-222222222222.jpg`)).not.toBeNull()
    expect(await c.armazenamento.metadados('publico', `${c.conta.id}/catalogo/11111111-1111-1111-1111-111111111111.jpg`)).toBeNull()
  })
})
