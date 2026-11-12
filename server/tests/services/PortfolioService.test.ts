import { describe, expect, it } from 'vitest'
import { PortfolioService } from '../../src/services/PortfolioService.js'
import { ArquivoService } from '../../src/services/ArquivoService.js'
import { ErroNaoEncontrado } from '../../src/errors/AppError.js'
import { ArmazenamentoMemoria } from '../helpers/armazenamentoMemoria.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

function cenario() {
  const fake = criarClienteFake()
  const [a, b] = fake.semear('contas', [
    { nome_empresa: 'Festa Mágica', tipo_negocio: 'salao_festas', plano: 'profissional', status: 'ativo', configuracoes_gerais: {} },
    { nome_empresa: 'Outra', tipo_negocio: 'salao_festas', plano: 'profissional', status: 'ativo', configuracoes_gerais: {} },
  ])
  const armazenamento = new ArmazenamentoMemoria()
  const cliente = paraTipado(fake)
  return {
    fake,
    armazenamento,
    portfolio: new PortfolioService(cliente, armazenamento),
    arquivos: new ArquivoService(cliente, armazenamento),
    conta: { id: a!['id'] as string, plano: 'profissional' as const },
    outra: { id: b!['id'] as string, plano: 'profissional' as const },
  }
}

async function anexar(c: ReturnType<typeof cenario>, tipoMime: string, entidadeTipo: string, entidadeId?: string) {
  const { caminho, bucket } = await c.arquivos.prepararUpload(c.conta, { nome: 'f', tipoMime, tamanhoBytes: 1000, categoria: 'catalogo' })
  c.armazenamento.enviar(bucket, caminho, 1000, tipoMime)
  return c.arquivos.confirmarUpload(c.conta, 'u', { caminho, nome: 'f', categoria: 'catalogo', entidadeTipo, entidadeId })
}

describe('PortfolioService', () => {
  it('cria pacote, kit e adicional e lista por aba', async () => {
    const c = cenario()
    await c.portfolio.criar(c.conta.id, { tipo: 'pacote', nome: 'Pacote Ouro', preco: 12000, capacidade: 200, itensInclusos: ['Buffet', '', 'Decoração'] })
    await c.portfolio.criar(c.conta.id, { tipo: 'kit', nome: 'Kit Unicórnio', preco: 890 })
    await c.portfolio.criar(c.conta.id, { tipo: 'adicional', nome: 'Pula-pula extra', preco: 250 })

    const pacotes = await c.portfolio.listar(c.conta.id, 'pacote')
    expect(pacotes).toHaveLength(1)
    expect(pacotes[0]).toMatchObject({ nome: 'Pacote Ouro', preco: 12000, capacidade: 200, itensInclusos: ['Buffet', 'Decoração'], ativo: true, fotos: [], pdfs: [] })
    expect(await c.portfolio.listar(c.conta.id)).toHaveLength(3)
  })

  it('valida tipo e nome', async () => {
    const c = cenario()
    await expect(c.portfolio.criar(c.conta.id, { tipo: 'servico', nome: 'X' })).rejects.toThrow()
    await expect(c.portfolio.criar(c.conta.id, { tipo: 'kit', nome: 'A' })).rejects.toThrow()
    await expect(c.portfolio.listar(c.conta.id, 'combo')).rejects.toThrow()
  })

  it('item volta com fotos (a primeira enviada é a principal) e PDFs, com links públicos', async () => {
    const c = cenario()
    const kit = await c.portfolio.criar(c.conta.id, { tipo: 'kit', nome: 'Kit Unicórnio' })
    const primeira = await anexar(c, 'image/jpeg', 'portfolio_item', kit.id)
    await anexar(c, 'image/png', 'portfolio_item', kit.id)
    await anexar(c, 'application/pdf', 'portfolio_item', kit.id)

    const [comMidia] = await c.portfolio.listar(c.conta.id, 'kit')
    expect(comMidia!.fotos).toHaveLength(2)
    expect(comMidia!.fotos[0]!.id).toBe(primeira.id)
    expect(comMidia!.pdfs).toHaveLength(1)
    expect(comMidia!.pdfs[0]!.urlTemporaria).toBe(false)
  })

  it('materiais prontos de cada aba ficam separados dos itens', async () => {
    const c = cenario()
    await anexar(c, 'application/pdf', 'portfolio_kit')
    await anexar(c, 'image/jpeg', 'portfolio_pacote')
    expect(await c.portfolio.materiais(c.conta.id, 'kit')).toHaveLength(1)
    expect(await c.portfolio.materiais(c.conta.id, 'pacote')).toHaveLength(1)
    expect(await c.portfolio.materiais(c.conta.id, 'adicional')).toHaveLength(0)
  })

  it('excluir o item apaga também as fotos e PDFs dele do storage', async () => {
    const c = cenario()
    const kit = await c.portfolio.criar(c.conta.id, { tipo: 'kit', nome: 'Kit Unicórnio' })
    await anexar(c, 'image/jpeg', 'portfolio_item', kit.id)
    await anexar(c, 'application/pdf', 'portfolio_item', kit.id)
    await anexar(c, 'image/jpeg', 'portfolio_kit') // material da aba: não pode sumir

    await c.portfolio.excluir(c.conta.id, kit.id)
    expect(await c.portfolio.listar(c.conta.id)).toHaveLength(0)
    expect(c.armazenamento.objetos.size).toBe(1)
  })

  it('isola por conta', async () => {
    const c = cenario()
    const kit = await c.portfolio.criar(c.conta.id, { tipo: 'kit', nome: 'Kit Unicórnio' })
    expect(await c.portfolio.listar(c.outra.id)).toHaveLength(0)
    await expect(c.portfolio.atualizar(c.outra.id, kit.id, { nome: 'Invasor' })).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(c.portfolio.excluir(c.outra.id, kit.id)).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })

  it('atualiza e pode desativar (inativo vai pro fim da lista)', async () => {
    const c = cenario()
    const a = await c.portfolio.criar(c.conta.id, { tipo: 'kit', nome: 'Kit A' })
    await c.portfolio.criar(c.conta.id, { tipo: 'kit', nome: 'Kit B' })
    const desativado = await c.portfolio.atualizar(c.conta.id, a.id, { ativo: false, preco: 500 })
    expect(desativado).toMatchObject({ ativo: false, preco: 500 })
    expect((await c.portfolio.listar(c.conta.id, 'kit')).map((i) => i.nome)).toEqual(['Kit B', 'Kit A'])
  })
})
