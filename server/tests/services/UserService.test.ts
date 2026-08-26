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

describe('UserService.autenticarViaSupabase', () => {
  it('cria conta+usuario novos quando a identidade do Supabase não existe localmente', async () => {
    const cliente = criarClienteFake()
    const { token } = cliente.auth.criarIdentidade('novo@google.com', { full_name: 'Fulano da Silva' })

    const service = new UserService(paraTipado(cliente))
    const { usuario, conta } = await service.autenticarViaSupabase(token)

    expect(usuario.email).toBe('novo@google.com')
    expect(usuario.authUserId).toBe(token)
    expect(usuario.papel).toBe('admin')
    expect(conta.nomeEmpresa).toBe('Fulano da Silva')
    expect(conta.tipoNegocio).toBeNull()
  })

  it('linka uma conta existente (só com senha local) por email, no primeiro login via Google/reset', async () => {
    const cliente = criarClienteFake()
    const senhaHash = await hashSenha('senha12345')
    const conta = cliente.semear('contas', [{ nome_empresa: 'Confeitaria da Ana', tipo_negocio: null, plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
    const usuarioLocal = cliente.semear('usuarios', [
      { conta_id: conta['id'], email: 'dono@confeitaria.com', senha_hash: senhaHash, auth_user_id: null, nome: 'Ana', papel: 'admin', cliente_id: null, status: 'ativo' },
    ])[0]!

    const { token } = cliente.auth.criarIdentidade('dono@confeitaria.com')
    const service = new UserService(paraTipado(cliente))
    const { usuario } = await service.autenticarViaSupabase(token)

    expect(usuario.id).toBe(usuarioLocal['id'])
    expect(usuario.authUserId).toBe(token)
  })

  it('reconhece a mesma identidade em logins seguintes, sem duplicar usuario', async () => {
    const cliente = criarClienteFake()
    const { token } = cliente.auth.criarIdentidade('repete@google.com')
    const service = new UserService(paraTipado(cliente))

    const primeiro = await service.autenticarViaSupabase(token)
    const segundo = await service.autenticarViaSupabase(token)

    expect(segundo.usuario.id).toBe(primeiro.usuario.id)
    expect(cliente.linhasDe('usuarios')).toHaveLength(1)
  })

  it('sincroniza o hash local quando vem novaSenha (conclusão de "esqueci minha senha")', async () => {
    const service = new UserService(criarClienteFakeTipado())
    await service.criarUsuario('dono@confeitaria.com', 'senhaAntiga1', 'Confeitaria da Ana')

    const cliente = criarClienteFake()
    // Recria o mesmo cenário num client que expõe `.auth` de teste — o service usa o client injetado, então a identidade precisa existir nesse mesmo fake.
    const senhaHash = await hashSenha('senhaAntiga1')
    const conta = cliente.semear('contas', [{ nome_empresa: 'Confeitaria da Ana', tipo_negocio: null, plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
    cliente.semear('usuarios', [
      { conta_id: conta['id'], email: 'dono@confeitaria.com', senha_hash: senhaHash, auth_user_id: null, nome: 'Ana', papel: 'admin', cliente_id: null, status: 'ativo' },
    ])
    const { token } = cliente.auth.criarIdentidade('dono@confeitaria.com')
    const serviceComAuth = new UserService(paraTipado(cliente))

    await serviceComAuth.autenticarViaSupabase(token, 'senhaNova123')

    const { usuario } = await serviceComAuth.autenticar('dono@confeitaria.com', 'senhaNova123')
    expect(usuario.email).toBe('dono@confeitaria.com')
  })

  it('rejeita um token do Supabase inválido/expirado', async () => {
    const service = new UserService(criarClienteFakeTipado())
    await expect(service.autenticarViaSupabase('token-que-nao-existe')).rejects.toBeInstanceOf(ErroNaoAutorizado)
  })

  it('rejeita usuário inativo mesmo com identidade do Supabase válida', async () => {
    const cliente = criarClienteFake()
    const conta = cliente.semear('contas', [{ nome_empresa: 'X', tipo_negocio: null, plano: 'startup', status: 'ativo', configuracoes_gerais: {} }])[0]!
    const { id: authUserId, token } = cliente.auth.criarIdentidade('inativo@x.com')
    cliente.semear('usuarios', [
      { conta_id: conta['id'], email: 'inativo@x.com', senha_hash: null, auth_user_id: authUserId, nome: 'X', papel: 'admin', cliente_id: null, status: 'inativo' },
    ])

    const service = new UserService(paraTipado(cliente))
    await expect(service.autenticarViaSupabase(token)).rejects.toBeInstanceOf(ErroProibido)
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
