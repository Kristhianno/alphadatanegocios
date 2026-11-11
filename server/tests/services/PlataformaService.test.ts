import { describe, expect, it } from 'vitest'
import { PlataformaService, situacaoAssinatura } from '../../src/services/PlataformaService.js'
import { ErroNaoEncontrado } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

const DIA_MS = 24 * 60 * 60 * 1000

function cenario() {
  const fake = criarClienteFake()
  const [interna, festa, doces] = fake.semear('contas', [
    { nome_empresa: 'ALPHADATA Plataforma', tipo_negocio: null, plano: 'startup', status: 'ativo', configuracoes_gerais: { interna: true } },
    {
      nome_empresa: 'Festa Mágica',
      tipo_negocio: 'salao_festas',
      plano: 'profissional',
      status: 'ativo',
      configuracoes_gerais: { segmentoEscolhido: 'Personagens Vivos' },
      stripe_subscription_id: 'sub_123',
      trial_termina_em: new Date(Date.now() - 10 * DIA_MS).toISOString(),
    },
    {
      nome_empresa: 'Doce Sonho',
      tipo_negocio: 'confeitaria',
      plano: 'startup',
      status: 'ativo',
      configuracoes_gerais: { segmentoEscolhido: 'Bolos e Doces' },
      trial_termina_em: new Date(Date.now() + 3 * DIA_MS).toISOString(),
    },
  ])
  fake.semear('usuarios', [
    { conta_id: interna!['id'], email: 'super@x.com', nome: 'Super', papel: 'superadmin', status: 'ativo', deve_trocar_senha: false },
    { conta_id: festa!['id'], email: 'dono@festa.com', nome: 'Dono', papel: 'admin', status: 'ativo', deve_trocar_senha: false, ultimo_login_em: new Date().toISOString() },
    { conta_id: festa!['id'], email: 'equipe@festa.com', nome: 'Equipe', papel: 'gestor', status: 'ativo', deve_trocar_senha: false },
    { conta_id: doces!['id'], email: 'dona@doces.com', nome: 'Dona', papel: 'admin', status: 'ativo', deve_trocar_senha: false },
  ])
  fake.semear('leads', [{ nome: 'Lead', email: 'lead@x.com', origem: 'landing' }])
  return { service: new PlataformaService(paraTipado(fake)), interna: interna!, festa: festa!, doces: doces! }
}

describe('PlataformaService.listarContas', () => {
  it('lista as contas de clientes com admin, nicho e situação — e esconde a conta interna', async () => {
    const { service, festa } = cenario()
    const contas = await service.listarContas()

    expect(contas).toHaveLength(2)
    expect(contas.some((c) => c.nomeEmpresa === 'ALPHADATA Plataforma')).toBe(false)

    const contaFesta = contas.find((c) => c.id === festa['id'])!
    expect(contaFesta.nicho).toBe('Personagens Vivos')
    expect(contaFesta.emailAdmin).toBe('dono@festa.com')
    expect(contaFesta.totalUsuarios).toBe(2)
    expect(contaFesta.situacaoAssinatura).toBe('pagante')
    expect(contaFesta.ultimoLoginEm).toBeInstanceOf(Date)
  })
})

describe('PlataformaService.resumo', () => {
  it('conta contas por situação e nicho, sem incluir a interna nem o superadmin', async () => {
    const { service } = cenario()
    const resumo = await service.resumo()

    expect(resumo.totalContas).toBe(2)
    expect(resumo.porSituacao).toEqual({ pagante: 1, em_teste: 1, pendente: 0, sem_plano: 0 })
    expect(resumo.porNicho).toEqual(expect.arrayContaining([{ nicho: 'Personagens Vivos', total: 1 }, { nicho: 'Bolos e Doces', total: 1 }]))
    expect(resumo.totalUsuarios).toBe(3)
    expect(resumo.totalLeads).toBe(1)
  })
})

describe('PlataformaService.alterarStatusConta', () => {
  it('suspende uma conta de cliente', async () => {
    const { service, doces } = cenario()
    const conta = await service.alterarStatusConta(doces['id'] as string, 'suspenso')
    expect(conta.status).toBe('suspenso')
  })

  it('não deixa mexer na conta interna da plataforma', async () => {
    const { service, interna } = cenario()
    await expect(service.alterarStatusConta(interna['id'] as string, 'suspenso')).rejects.toBeInstanceOf(ErroNaoEncontrado)
  })

  it('rejeita status inválido', async () => {
    const { service, doces } = cenario()
    await expect(service.alterarStatusConta(doces['id'] as string, 'apagado')).rejects.toThrow()
  })
})

describe('situacaoAssinatura', () => {
  it('trial vencido sem assinatura vira pendente', () => {
    expect(
      situacaoAssinatura({ stripeSubscriptionId: null, status: 'ativo', trialTerminaEm: new Date(Date.now() - DIA_MS), assinaturaPendente: true }),
    ).toBe('pendente')
  })
})
