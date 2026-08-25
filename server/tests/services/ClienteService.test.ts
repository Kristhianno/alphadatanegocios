import { describe, expect, it } from 'vitest'
import { ClienteService } from '../../src/services/ClienteService.js'
import { ErroNaoEncontrado } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

function prepararUsuario(cliente: ReturnType<typeof criarClienteFake>) {
  const conta = cliente.semear('contas', [{ nome_empresa: 'Manutenção X', tipo_negocio: 'manutencao', plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
  const usuario = cliente.semear('usuarios', [
    { conta_id: conta['id'], email: 'admin@x.com', senha_hash: 'h', nome: 'Admin', papel: 'admin', cliente_id: null, status: 'ativo' },
  ])[0]!
  return usuario['id'] as string
}

describe('ClienteService.criarCliente', () => {
  it('rejeita documento inválido (CPF com dígito verificador errado)', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new ClienteService(paraTipado(cliente))
    await expect(service.criarCliente(userId, { nome: 'João', documento: '111.111.111-11' })).rejects.toThrow()
  })

  it('aceita e persiste um cadastro válido', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new ClienteService(paraTipado(cliente))

    const clienteFinal = await service.criarCliente(userId, { nome: 'Maria', telefone: '11987654321' })
    expect(clienteFinal.nome).toBe('Maria')
    expect(clienteFinal.ativo).toBe(true)
  })
})

describe('ClienteService.desativarCliente', () => {
  it('faz soft-delete (ativo: false), nunca um DELETE físico', async () => {
    const cliente = criarClienteFake()
    const userId = prepararUsuario(cliente)
    const service = new ClienteService(paraTipado(cliente))
    const clienteFinal = await service.criarCliente(userId, { nome: 'Maria' })

    const desativado = await service.desativarCliente(clienteFinal.id)
    expect(desativado.ativo).toBe(false)
    expect(cliente.linhasDe('clientes')).toHaveLength(1)
  })

  it('lança ErroNaoEncontrado pra um id inexistente', async () => {
    const service = new ClienteService(paraTipado(criarClienteFake()))
    await expect(service.desativarCliente('00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })
})
