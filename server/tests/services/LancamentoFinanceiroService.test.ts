import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { LancamentoFinanceiroService } from '../../src/services/LancamentoFinanceiroService.js'
import { ErroNaoEncontrado, ErroValidacao } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

function prepararUsuario(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Manutenção X', tipo_negocio: 'manutencao', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const admin = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return { contaId: conta['id'] as string, userId: admin['id'] as string }
}

describe('LancamentoFinanceiroService.criar', () => {
  it('cria um lançamento com status "pendente"', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const service = new LancamentoFinanceiroService(paraTipado(cliente))

    const lancamento = await service.criar(userId, { tipo: 'receita', descricao: 'Sinal do evento', valor: 500 })
    expect(lancamento.status).toBe('pendente')
    expect(lancamento.valor).toBe(500)
  })

  it('rejeita valor não positivo', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const service = new LancamentoFinanceiroService(paraTipado(cliente))

    await expect(service.criar(userId, { tipo: 'despesa', descricao: 'Material', valor: -10 })).rejects.toThrow()
  })
})

describe('LancamentoFinanceiroService.listar', () => {
  it('só lista lançamentos da própria conta', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const { userId: outroUserId } = prepararUsuario(cliente)
    const service = new LancamentoFinanceiroService(paraTipado(cliente))

    await service.criar(userId, { tipo: 'receita', descricao: 'Da minha conta', valor: 100 })
    await service.criar(outroUserId, { tipo: 'receita', descricao: 'De outra conta', valor: 200 })

    expect(await service.listar(userId)).toHaveLength(1)
  })

  it('filtra por tipo e status', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const service = new LancamentoFinanceiroService(paraTipado(cliente))

    const receita = await service.criar(userId, { tipo: 'receita', descricao: 'Receita', valor: 100 })
    await service.criar(userId, { tipo: 'despesa', descricao: 'Despesa', valor: 50 })
    await service.marcarPago(receita.id)

    expect(await service.listar(userId, { tipo: 'despesa' })).toHaveLength(1)
    expect(await service.listar(userId, { status: 'pago' })).toHaveLength(1)
  })
})

describe('LancamentoFinanceiroService.resumo', () => {
  it('soma só os lançamentos pagos, receita menos despesa vira o saldo', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const service = new LancamentoFinanceiroService(paraTipado(cliente))

    const receita = await service.criar(userId, { tipo: 'receita', descricao: 'Receita paga', valor: 1000 })
    const despesa = await service.criar(userId, { tipo: 'despesa', descricao: 'Despesa paga', valor: 400 })
    await service.criar(userId, { tipo: 'receita', descricao: 'Receita pendente', valor: 5000 })
    await service.marcarPago(receita.id)
    await service.marcarPago(despesa.id)

    const resumo = await service.resumo(userId)
    expect(resumo.totalReceitas).toBe(1000)
    expect(resumo.totalDespesas).toBe(400)
    expect(resumo.saldo).toBe(600)
  })
})

describe('LancamentoFinanceiroService.marcarPago', () => {
  it('rejeita marcar como pago um lançamento que não está "pendente"', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const service = new LancamentoFinanceiroService(paraTipado(cliente))
    const lancamento = await service.criar(userId, { tipo: 'receita', descricao: 'Receita', valor: 100 })
    await service.marcarPago(lancamento.id)

    await expect(service.marcarPago(lancamento.id)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('lança ErroNaoEncontrado pra um lançamento que não existe', async () => {
    const service = new LancamentoFinanceiroService(paraTipado(criarClienteFake()))
    await expect(service.marcarPago(randomUUID())).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })
})

describe('LancamentoFinanceiroService.cancelar', () => {
  it('rejeita cancelar um lançamento já cancelado', async () => {
    const cliente = criarClienteFake()
    const { userId } = prepararUsuario(cliente)
    const service = new LancamentoFinanceiroService(paraTipado(cliente))
    const lancamento = await service.criar(userId, { tipo: 'despesa', descricao: 'Despesa', valor: 100 })
    await service.cancelar(lancamento.id)

    await expect(service.cancelar(lancamento.id)).rejects.toBeInstanceOf(ErroValidacao)
  })
})
