import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { ContratoService } from '../../src/services/ContratoService.js'
import { ErroProibido, ErroValidacao } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

function prepararConta(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Confeitaria X', tipo_negocio: 'confeitaria', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const admin = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return { contaId: conta['id'] as string, userIdAdmin: admin['id'] as string }
}

function prepararUsuarioCliente(cliente: ReturnType<typeof criarClienteFake>, contaId: string, clienteId: string) {
  const usuario = cliente.semear('usuarios', [
    { conta_id: contaId, email: `${clienteId}@x.com`, senha_hash: 'h', nome: 'Cliente', papel: 'cliente', cliente_id: clienteId, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
}

function semearContrato(cliente: ReturnType<typeof criarClienteFake>, contaId: string, clienteId: string, status: string) {
  return cliente.semear('contratos', [
    {
      conta_id: contaId,
      tipo_negocio: 'confeitaria',
      cliente_id: clienteId,
      referencia_tipo: 'pedido_confeitaria',
      referencia_id: randomUUID(),
      titulo: 'Contrato de fornecimento',
      status,
      metadados: {},
    },
  ])[0]!
}

describe('ContratoService.listarContratos', () => {
  it('um usuário papel "cliente" só vê os próprios contratos, mesmo pedindo todos', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararConta(cliente)
    const clienteId1 = randomUUID()
    const meuContrato = semearContrato(cliente, contaId, clienteId1, 'enviado')
    semearContrato(cliente, contaId, randomUUID(), 'enviado')

    const service = new ContratoService(paraTipado(cliente))
    const userIdCliente = prepararUsuarioCliente(cliente, contaId, clienteId1)
    const meusContratos = await service.listarContratos(userIdCliente)

    expect(meusContratos).toHaveLength(1)
    expect(meusContratos[0]?.id).toBe(meuContrato['id'])
  })

  it('equipe interna vê todos os contratos da conta', async () => {
    const cliente = criarClienteFake()
    const { contaId, userIdAdmin } = prepararConta(cliente)
    semearContrato(cliente, contaId, randomUUID(), 'enviado')
    semearContrato(cliente, contaId, randomUUID(), 'rascunho')

    const service = new ContratoService(paraTipado(cliente))
    expect(await service.listarContratos(userIdAdmin)).toHaveLength(2)
  })

  it('um login "cliente" sem clienteId vinculado não vê nenhum contrato', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararConta(cliente)
    semearContrato(cliente, contaId, randomUUID(), 'enviado')

    const usuarioSemCliente = cliente.semear('usuarios', [
      { conta_id: contaId, email: 'sem-cliente@x.com', senha_hash: 'h', nome: 'Cliente', papel: 'cliente', cliente_id: null, status: 'ativo' },
    ])[0]!
    const service = new ContratoService(paraTipado(cliente))
    expect(await service.listarContratos(usuarioSemCliente['id'] as string)).toHaveLength(0)
  })
})

describe('ContratoService.assinarContrato', () => {
  it('rejeita quando o contrato não pertence ao clienteId informado', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararConta(cliente)
    const contrato = semearContrato(cliente, contaId, randomUUID(), 'enviado')

    const service = new ContratoService(paraTipado(cliente))
    await expect(service.assinarContrato(contrato['id'] as string, randomUUID())).rejects.toBeInstanceOf(ErroProibido)
  })

  it('rejeita assinar um contrato que não está "enviado"', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararConta(cliente)
    const clienteId = randomUUID()
    const contrato = semearContrato(cliente, contaId, clienteId, 'rascunho')

    const service = new ContratoService(paraTipado(cliente))
    await expect(service.assinarContrato(contrato['id'] as string, clienteId)).rejects.toBeInstanceOf(ErroValidacao)
  })

  it('assina com sucesso um contrato "enviado" do próprio cliente', async () => {
    const cliente = criarClienteFake()
    const { contaId } = prepararConta(cliente)
    const clienteId = randomUUID()
    const contrato = semearContrato(cliente, contaId, clienteId, 'enviado')

    const service = new ContratoService(paraTipado(cliente))
    const assinado = await service.assinarContrato(contrato['id'] as string, clienteId)
    expect(assinado.status).toBe('assinado')
    expect(assinado.assinadoEm).toBeInstanceOf(Date)
  })
})
