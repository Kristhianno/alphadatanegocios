import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { ConfeitariaService } from '../../../src/services/tipo-especifico/ConfeitariaService.js'
import { ErroNaoEncontrado, ErroValidacao } from '../../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../../helpers/fakeSupabase.js'

function prepararUsuario(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Confeitaria X', tipo_negocio: 'confeitaria', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return { contaId: conta['id'] as string, userId: usuario['id'] as string }
}

function prepararUsuarioCliente(cliente: ReturnType<typeof criarClienteFake>, contaId: string, clienteId: string) {
  const usuario = cliente.semear('usuarios', [
    { conta_id: contaId, email: `${clienteId}@x.com`, senha_hash: 'h', nome: 'Cliente', papel: 'cliente', cliente_id: clienteId, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
}

describe('ConfeitariaService.atualizarMovimentacaoEstoque', () => {
  it('rejeita quantidade zero', async () => {
    const cliente = criarClienteFake()
    const service = new ConfeitariaService(paraTipado(cliente))
    await expect(service.atualizarMovimentacaoEstoque(randomUUID(), 0)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('lança ErroNaoEncontrado pra um ingrediente que não existe', async () => {
    const cliente = criarClienteFake()
    const service = new ConfeitariaService(paraTipado(cliente))
    await expect(service.atualizarMovimentacaoEstoque(randomUUID(), 10)).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })

  it('rejeita saída maior que o estoque disponível', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararUsuario(cliente)
    const ingrediente = cliente.semear('ingredientes_estoque', [{ conta_id: contaId, nome: 'Farinha', quantidade_atual: 5, custo_unitario: 2 }])[0]!

    const service = new ConfeitariaService(paraTipado(cliente))
    await expect(service.atualizarMovimentacaoEstoque(ingrediente['id'] as string, -10)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('entrada soma ao estoque e registra a movimentação como "entrada"', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararUsuario(cliente)
    const ingrediente = cliente.semear('ingredientes_estoque', [{ conta_id: contaId, nome: 'Farinha', quantidade_atual: 5, custo_unitario: 2 }])[0]!

    const service = new ConfeitariaService(paraTipado(cliente))
    const resultado = await service.atualizarMovimentacaoEstoque(ingrediente['id'] as string, 3)

    expect(resultado.quantidadeAtual).toBe(8)
    const movimentacoes = cliente.linhasDe('movimentacoes_estoque')
    expect(movimentacoes).toHaveLength(1)
    expect(movimentacoes[0]?.['tipo']).toBe('entrada')
    expect(movimentacoes[0]?.['quantidade']).toBe(3)
  })

  it('saída válida subtrai do estoque e registra a movimentação como "saida" com quantidade em valor absoluto', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararUsuario(cliente)
    const ingrediente = cliente.semear('ingredientes_estoque', [{ conta_id: contaId, nome: 'Farinha', quantidade_atual: 5, custo_unitario: 2 }])[0]!

    const service = new ConfeitariaService(paraTipado(cliente))
    const resultado = await service.atualizarMovimentacaoEstoque(ingrediente['id'] as string, -2)

    expect(resultado.quantidadeAtual).toBe(3)
    const movimentacoes = cliente.linhasDe('movimentacoes_estoque')
    expect(movimentacoes[0]?.['tipo']).toBe('saida')
    expect(movimentacoes[0]?.['quantidade']).toBe(2)
  })
})

describe('ConfeitariaService.calcularCustoProducao', () => {
  it('soma quantidade_necessaria × custo_unitario de cada ingrediente da receita', async () => {
    const cliente = criarClienteFake()
    const receitaId = randomUUID()
    const ing1 = cliente.semear('ingredientes_estoque', [{ nome: 'Farinha', quantidade_atual: 100, custo_unitario: 0.5 }])[0]!
    const ing2 = cliente.semear('ingredientes_estoque', [{ nome: 'Açúcar', quantidade_atual: 100, custo_unitario: 1.2 }])[0]!
    cliente.semear('receita_ingredientes', [
      { receita_id: receitaId, ingrediente_id: ing1['id'], quantidade_necessaria: 4 },
      { receita_id: receitaId, ingrediente_id: ing2['id'], quantidade_necessaria: 2 },
    ])

    const service = new ConfeitariaService(paraTipado(cliente))
    const custo = await service.calcularCustoProducao(receitaId)
    // 4 × 0.5 + 2 × 1.2 = 2 + 2.4 = 4.4
    expect(custo).toBeCloseTo(4.4, 2)
  })

  it('lança ErroNaoEncontrado quando a receita não tem composição cadastrada', async () => {
    const cliente = criarClienteFake()
    const service = new ConfeitariaService(paraTipado(cliente))
    await expect(service.calcularCustoProducao(randomUUID())).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })
})

describe('ConfeitariaService.criarPedidoConfeitaria', () => {
  it('rejeita um produtoId que não existe no catálogo', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const service = new ConfeitariaService(paraTipado(cliente))

    await expect(
      service.criarPedidoConfeitaria(userId, { clienteId: randomUUID(), itens: [{ produtoId: randomUUID(), quantidade: 1 }] })
    ).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('calcula valorTotal a partir do preço real do catálogo e numera o pedido sequencialmente', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const produto = cliente.semear('catalogo_produtos', [{ nome: 'Bolo', preco_venda: 50 }])[0]!
    const service = new ConfeitariaService(paraTipado(cliente))

    const pedido1 = await service.criarPedidoConfeitaria(userId, {
      clienteId: randomUUID(),
      itens: [{ produtoId: produto['id'], quantidade: 2 }],
    })
    expect(pedido1.valorTotal).toBe(100)
    expect(pedido1.numero).toBe('PED-0001')

    const pedido2 = await service.criarPedidoConfeitaria(userId, {
      clienteId: randomUUID(),
      itens: [{ produtoId: produto['id'], quantidade: 1 }],
    })
    expect(pedido2.numero).toBe('PED-0002')
  })
})

describe('ConfeitariaService.listarPedidos', () => {
  it('um usuário papel "cliente" só vê os próprios pedidos, mesmo pedindo todos', async () => {
    const cliente = criarClienteFake()
    const { userId: userIdAdmin, contaId } = prepararUsuario(cliente)
    const produto = cliente.semear('catalogo_produtos', [{ nome: 'Bolo', preco_venda: 50 }])[0]!
    const service = new ConfeitariaService(paraTipado(cliente))

    const clienteId1 = randomUUID()
    const meuPedido = await service.criarPedidoConfeitaria(userIdAdmin, { clienteId: clienteId1, itens: [{ produtoId: produto['id'], quantidade: 1 }] })
    await service.criarPedidoConfeitaria(userIdAdmin, { clienteId: randomUUID(), itens: [{ produtoId: produto['id'], quantidade: 1 }] })

    const userIdCliente = prepararUsuarioCliente(cliente, contaId, clienteId1)
    const meusPedidos = await service.listarPedidos(userIdCliente)
    expect(meusPedidos).toHaveLength(1)
    expect(meusPedidos[0]?.id).toBe(meuPedido.id)
  })

  it('equipe interna vê todos os pedidos da conta', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const produto = cliente.semear('catalogo_produtos', [{ nome: 'Bolo', preco_venda: 50 }])[0]!
    const service = new ConfeitariaService(paraTipado(cliente))

    await service.criarPedidoConfeitaria(userId, { clienteId: randomUUID(), itens: [{ produtoId: produto['id'], quantidade: 1 }] })
    await service.criarPedidoConfeitaria(userId, { clienteId: randomUUID(), itens: [{ produtoId: produto['id'], quantidade: 1 }] })

    expect(await service.listarPedidos(userId)).toHaveLength(2)
  })
})
