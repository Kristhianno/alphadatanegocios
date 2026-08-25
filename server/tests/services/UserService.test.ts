import { describe, expect, it } from 'vitest'
import { UserService } from '../../src/services/UserService.js'
import { hashSenha } from '../../src/utils/senha.js'
import { ErroConflito, ErroNaoAutorizado, ErroProibido } from '../../src/errors/AppError.js'
import { criarClienteFake, criarClienteFakeTipado, paraTipado } from '../helpers/fakeSupabase.js'

describe('UserService.criarUsuario', () => {
  it('cria a conta (sem vertical) e o login admin', async () => {
    const service = new UserService(criarClienteFakeTipado())
    const { conta, usuario } = await service.criarUsuario('dono@confeitaria.com', 'senha12345', 'Confeitaria da Ana')

    expect(conta.tipoNegocio).toBeNull()
    expect(conta.plano).toBe('startup')
    expect(usuario.papel).toBe('admin')
    expect(usuario.contaId).toBe(conta.id)
  })

  it('rejeita um segundo cadastro com o mesmo email', async () => {
    const service = new UserService(criarClienteFakeTipado())
    await service.criarUsuario('dono@confeitaria.com', 'senha12345', 'Confeitaria da Ana')
    await expect(service.criarUsuario('dono@confeitaria.com', 'outraSenha123', 'Outra Empresa')).rejects.toBeInstanceOf(ErroConflito)
  })

  it('rejeita email/senha/nomeEmpresa inválidos (schema Zod do service)', async () => {
    const service = new UserService(criarClienteFakeTipado())
    await expect(service.criarUsuario('não-é-email', 'senha12345', 'Empresa')).rejects.toThrow()
    await expect(service.criarUsuario('a@b.com', '123', 'Empresa')).rejects.toThrow()
  })
})

describe('UserService.autenticar', () => {
  it('autentica com email/senha corretos', async () => {
    const service = new UserService(criarClienteFakeTipado())
    await service.criarUsuario('dono@confeitaria.com', 'senha12345', 'Confeitaria da Ana')

    const { usuario } = await service.autenticar('dono@confeitaria.com', 'senha12345')
    expect(usuario.email).toBe('dono@confeitaria.com')
    expect('senhaHash' in usuario).toBe(false)
  })

  it('rejeita senha errada com a mesma mensagem genérica de "email não existe" (não vaza qual dos dois errou)', async () => {
    const service = new UserService(criarClienteFakeTipado())
    await service.criarUsuario('dono@confeitaria.com', 'senha12345', 'Confeitaria da Ana')

    const erroSenhaErrada = await service.autenticar('dono@confeitaria.com', 'errada').catch((e: unknown) => e)
    const erroEmailInexistente = await service.autenticar('ninguem@x.com', 'qualquer').catch((e: unknown) => e)

    expect(erroSenhaErrada).toBeInstanceOf(ErroNaoAutorizado)
    expect(erroEmailInexistente).toBeInstanceOf(ErroNaoAutorizado)
    expect((erroSenhaErrada as Error).message).toBe((erroEmailInexistente as Error).message)
  })

  it('rejeita usuário inativo mesmo com senha correta', async () => {
    const cliente = criarClienteFake()
    const senhaHash = await hashSenha('senha12345')
    const conta = cliente.semear('contas', [{ nome_empresa: 'X', tipo_negocio: null, plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
    cliente.semear('usuarios', [
      { conta_id: conta['id'], email: 'inativo@x.com', senha_hash: senhaHash, nome: 'X', papel: 'admin', cliente_id: null, status: 'inativo' },
    ])

    const service = new UserService(paraTipado(cliente))
    await expect(service.autenticar('inativo@x.com', 'senha12345')).rejects.toBeInstanceOf(ErroProibido)
  })
})

describe('UserService.selecionarTipoNegocio', () => {
  it('só o admin da conta pode escolher o vertical', async () => {
    const cliente = criarClienteFake()
    const conta = cliente.semear('contas', [{ nome_empresa: 'X', tipo_negocio: null, plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
    const usuarioGestor = cliente.semear('usuarios', [
      { conta_id: conta['id'], email: 'gestor@x.com', senha_hash: 'h', nome: 'Gestor', papel: 'gestor', cliente_id: null, status: 'ativo' },
    ])[0]!

    const service = new UserService(paraTipado(cliente))
    await expect(service.selecionarTipoNegocio(usuarioGestor['id'] as string, 'confeitaria')).rejects.toBeInstanceOf(ErroProibido)
  })

  it('aplica as configurações padrão do vertical escolhido', async () => {
    const service = new UserService(criarClienteFakeTipado())
    const { usuario } = await service.criarUsuario('dono@confeitaria.com', 'senha12345', 'Confeitaria da Ana')

    const conta = await service.selecionarTipoNegocio(usuario.id, 'confeitaria')
    expect(conta.tipoNegocio).toBe('confeitaria')
    expect(conta.configuracoesGerais['alertaEstoqueBaixo']).toBe(true)
  })

  it('rejeita escolher de novo um vertical já definido', async () => {
    const service = new UserService(criarClienteFakeTipado())
    const { usuario } = await service.criarUsuario('dono@confeitaria.com', 'senha12345', 'Confeitaria da Ana')
    await service.selecionarTipoNegocio(usuario.id, 'confeitaria')

    await expect(service.selecionarTipoNegocio(usuario.id, 'manutencao')).rejects.toBeInstanceOf(ErroConflito)
  })
})
