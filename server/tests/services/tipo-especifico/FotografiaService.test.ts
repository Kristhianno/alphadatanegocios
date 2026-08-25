import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { FotografiaService } from '../../../src/services/tipo-especifico/FotografiaService.js'
import { ErroNaoEncontrado, ErroProibido, ErroValidacao } from '../../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../../helpers/fakeSupabase.js'

function prepararUsuario(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Fotografia X', tipo_negocio: 'fotografia_video', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
}

async function criarSessaoDeTeste(cliente: ReturnType<typeof criarClienteFake>) {
  const userId = prepararUsuario(cliente)
  const service = new FotografiaService(paraTipado(cliente))
  const sessao = await service.criarSessaoFoto(userId, { clienteId: randomUUID(), tipoSessao: 'ensaio', dataSessao: new Date(Date.now() + 86_400_000).toISOString() })
  return { service, sessao }
}

describe('FotografiaService.atualizarStatusEdicao', () => {
  it('rejeita percentual fora de 0–100', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    await expect(service.atualizarStatusEdicao(sessao.id, -1)).rejects.toBeInstanceOf(ErroValidacao)
    await expect(service.atualizarStatusEdicao(sessao.id, 101)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('avança o status pra "em_edicao" automaticamente quando percentual > 0', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    expect(sessao.status).toBe('agendada')

    const atualizada = await service.atualizarStatusEdicao(sessao.id, 30)
    expect(atualizada.status).toBe('em_edicao')
    expect(atualizada.percentualEdicaoConcluida).toBe(30)
  })

  it('nunca retrocede um status mais avançado (ex: "entregue")', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    await service.entregarGaleriaPrivada(sessao.id, 30)

    const atualizada = await service.atualizarStatusEdicao(sessao.id, 50)
    expect(atualizada.status).toBe('entregue')
  })
})

describe('FotografiaService.adicionarAoPortfolio', () => {
  it('rejeita sem permissão do cliente, mesmo que existam fotos favoritas', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    await expect(service.adicionarAoPortfolio(sessao.id, false)).rejects.toBeInstanceOf(ErroProibido)
  })

  it('rejeita quando não há nenhuma foto marcada como favorita, mesmo com permissão', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    await expect(service.adicionarAoPortfolio(sessao.id, true)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('com permissão e fotos favoritas, adiciona todas ao portfólio', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    await service.uploadFotosOriginal(sessao.id, ['foto1.jpg', 'foto2.jpg'])
    const fotos = cliente.linhasDe('fotos_sessao').filter((f) => f['sessao_id'] === sessao.id)
    await service.marcarFotosClienteMelhorEs(
      sessao.id,
      fotos.map((f) => f['id'] as string)
    )

    const quantidade = await service.adicionarAoPortfolio(sessao.id, true)
    expect(quantidade).toBe(2)
  })
})

describe('FotografiaService.entregarGaleriaPrivada', () => {
  it('rejeita diasValidade <= 0', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    await expect(service.entregarGaleriaPrivada(sessao.id, 0)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('gera um token opaco e marca a sessão como entregue', async () => {
    const cliente = criarClienteFake()
    const { service, sessao } = await criarSessaoDeTeste(cliente)
    const galeria = await service.entregarGaleriaPrivada(sessao.id, 15)

    expect(galeria.tokenAcesso.length).toBeGreaterThan(10)
    const sessaoAtualizada = cliente.linhasDe('sessoes_foto').find((s) => s['id'] === sessao.id)
    expect(sessaoAtualizada?.['status']).toBe('entregue')
  })

  it('lança ErroNaoEncontrado pra uma sessão inexistente', async () => {
    const service = new FotografiaService(paraTipado(criarClienteFake()))
    await expect(service.entregarGaleriaPrivada(randomUUID(), 15)).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })
})
