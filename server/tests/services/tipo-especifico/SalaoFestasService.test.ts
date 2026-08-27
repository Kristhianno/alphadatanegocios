import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { SalaoFestasService } from '../../../src/services/tipo-especifico/SalaoFestasService.js'
import { ErroNaoEncontrado, ErroValidacao } from '../../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../../helpers/fakeSupabase.js'

function prepararUsuario(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Salão X', tipo_negocio: 'salao_festas', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
}

function prepararContaComAdminEId(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Salão X', tipo_negocio: 'salao_festas', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const admin = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin2@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return { contaId: conta['id'] as string, userIdAdmin: admin['id'] as string }
}

function prepararUsuarioCliente(cliente: ReturnType<typeof criarClienteFake>, contaId: string, clienteId: string) {
  const usuario = cliente.semear('usuarios', [
    { conta_id: contaId, email: `${clienteId}@x.com`, senha_hash: 'h', nome: 'Cliente', papel: 'cliente', cliente_id: clienteId, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
}

describe('SalaoFestasService.criarEvento', () => {
  it('sem pacote, valorTotal começa em 0', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new SalaoFestasService(paraTipado(cliente))

    const evento = await service.criarEvento(userId, {
      clienteId: randomUUID(),
      nomeEvento: 'Aniversário da Ana',
      tipoEvento: 'aniversario',
      dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    expect(evento.valorTotal).toBe(0)
  })

  it('com pacote, valorTotal vem do preco_base do pacote', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const pacote = cliente.semear('pacotes_salao', [{ nome: 'Bronze', preco_base: 3500 }])[0]!
    const service = new SalaoFestasService(paraTipado(cliente))

    const evento = await service.criarEvento(userId, {
      clienteId: randomUUID(),
      pacoteId: pacote['id'],
      nomeEvento: 'Casamento',
      tipoEvento: 'casamento',
      dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    expect(evento.valorTotal).toBe(3500)
  })

  it('rejeita um pacoteId que não existe', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new SalaoFestasService(paraTipado(cliente))

    await expect(
      service.criarEvento(userId, {
        clienteId: randomUUID(),
        pacoteId: randomUUID(),
        nomeEvento: 'Casamento',
        tipoEvento: 'casamento',
        dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      })
    ).rejects.toBeInstanceOf(ErroValidacao)
  })
})

describe('SalaoFestasService.adicionarEquipeEvento', () => {
  it('rejeita quantidade <= 0', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new SalaoFestasService(paraTipado(cliente))
    const evento = await service.criarEvento(userId, {
      clienteId: randomUUID(),
      nomeEvento: 'Festa',
      tipoEvento: 'outro',
      dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })

    await expect(service.adicionarEquipeEvento(evento.id, 'Garçom', 0)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('lança ErroNaoEncontrado pra um evento que não existe', async () => {
    const service = new SalaoFestasService(paraTipado(criarClienteFake()))
    await expect(service.adicionarEquipeEvento(randomUUID(), 'Garçom', 3)).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })
})

describe('SalaoFestasService.calcularLucroEvento', () => {
  it('soma receita menos despesa lançados em financeiro_evento', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new SalaoFestasService(paraTipado(cliente))
    const evento = await service.criarEvento(userId, {
      clienteId: randomUUID(),
      nomeEvento: 'Festa',
      tipoEvento: 'outro',
      dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    cliente.semear('financeiro_evento', [
      { evento_id: evento.id, tipo: 'receita', valor: 5000 },
      { evento_id: evento.id, tipo: 'despesa', valor: 1200 },
    ])

    const lucro = await service.calcularLucroEvento(evento.id)
    expect(lucro).toBe(3800)
  })

  it('sem lançamentos, o lucro é 0 (não usa valor_total do evento como receita implícita)', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new SalaoFestasService(paraTipado(cliente))
    const pacote = cliente.semear('pacotes_salao', [{ nome: 'Bronze', preco_base: 3500 }])[0]!
    const evento = await service.criarEvento(userId, {
      clienteId: randomUUID(),
      pacoteId: pacote['id'],
      nomeEvento: 'Festa',
      tipoEvento: 'outro',
      dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })

    expect(await service.calcularLucroEvento(evento.id)).toBe(0)
  })
})

describe('SalaoFestasService.listarEventos', () => {
  it('um usuário papel "cliente" só vê os próprios eventos, mesmo pedindo todos', async () => {
    const cliente = criarClienteFake()
    const { contaId, userIdAdmin } = prepararContaComAdminEId(cliente)
    const service = new SalaoFestasService(paraTipado(cliente))

    const clienteId1 = randomUUID()
    const meuEvento = await service.criarEvento(userIdAdmin, {
      clienteId: clienteId1,
      nomeEvento: 'Aniversário da Ana',
      tipoEvento: 'aniversario',
      dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })
    await service.criarEvento(userIdAdmin, {
      clienteId: randomUUID(),
      nomeEvento: 'Casamento',
      tipoEvento: 'casamento',
      dataEvento: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    })

    const userIdCliente = prepararUsuarioCliente(cliente, contaId, clienteId1)
    const meusEventos = await service.listarEventos(userIdCliente)
    expect(meusEventos).toHaveLength(1)
    expect(meusEventos[0]?.id).toBe(meuEvento.id)
  })

  it('equipe interna vê todos os eventos da conta', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new SalaoFestasService(paraTipado(cliente))

    await service.criarEvento(userId, { clienteId: randomUUID(), nomeEvento: 'Festa A', tipoEvento: 'outro', dataEvento: new Date(Date.now() + 86_400_000).toISOString() })
    await service.criarEvento(userId, { clienteId: randomUUID(), nomeEvento: 'Festa B', tipoEvento: 'outro', dataEvento: new Date(Date.now() + 86_400_000).toISOString() })

    expect(await service.listarEventos(userId)).toHaveLength(2)
  })
})
