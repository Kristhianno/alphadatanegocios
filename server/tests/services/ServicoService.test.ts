import { describe, expect, it } from 'vitest'
import { ServicoService } from '../../src/services/ServicoService.js'
import { ErroNaoEncontrado } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

function prepararUsuario(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Salão X', tipo_negocio: 'salao_festas', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
}

describe('ServicoService.criarServico', () => {
  it('usa a ServicoFactory por baixo — aplica a duração padrão do vertical quando não informada', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new ServicoService(paraTipado(cliente))

    const servico = await service.criarServico(userId, 'salao_festas', { nome: 'Pacote Bronze' })
    expect(servico.duracaoEstimadaMinutos).toBe(300)
    expect(servico.ativo).toBe(true)
    expect(servico.tipoNegocio).toBe('salao_festas')
  })
})

describe('ServicoService.ativarServico / desativarServico', () => {
  it('alterna o campo ativo', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new ServicoService(paraTipado(cliente))
    const servico = await service.criarServico(userId, 'salao_festas', { nome: 'Pacote Prata' })

    const desativado = await service.desativarServico(servico.id)
    expect(desativado.ativo).toBe(false)

    const reativado = await service.ativarServico(servico.id)
    expect(reativado.ativo).toBe(true)
  })

  it('lança ErroNaoEncontrado pra um id que não existe', async () => {
    const service = new ServicoService(paraTipado(criarClienteFake()))
    await expect(service.ativarServico('00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })
})

describe('ServicoService.listarServicos', () => {
  it('filtra por ativo dentro da conta do usuário', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new ServicoService(paraTipado(cliente))

    const s1 = await service.criarServico(userId, 'salao_festas', { nome: 'Pacote Ouro' })
    await service.criarServico(userId, 'salao_festas', { nome: 'Pacote Prata' })
    await service.desativarServico(s1.id)

    const ativos = await service.listarServicos(userId, { ativo: true })
    expect(ativos).toHaveLength(1)
    expect(ativos[0]?.nome).toBe('Pacote Prata')
  })
})
