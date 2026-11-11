import { describe, expect, it } from 'vitest'
import { CrmService, estaParadoNoFollowUp } from '../../src/services/CrmService.js'
import { ErroNaoEncontrado } from '../../src/errors/AppError.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

const DIA_MS = 24 * 60 * 60 * 1000

function cenario() {
  const fake = criarClienteFake()
  const [contaA, contaB] = fake.semear('contas', [
    { nome_empresa: 'Festa Mágica', tipo_negocio: 'salao_festas', plano: 'profissional', status: 'ativo', configuracoes_gerais: {} },
    { nome_empresa: 'Outra Conta', tipo_negocio: 'salao_festas', plano: 'profissional', status: 'ativo', configuracoes_gerais: {} },
  ])
  return { fake, service: new CrmService(paraTipado(fake)), contaA: contaA!['id'] as string, contaB: contaB!['id'] as string }
}

describe('CrmService.criar', () => {
  it('cria em "novo", sem contato registrado, e o mais novo fica no topo da coluna', async () => {
    const { service, contaA } = cenario()
    const primeiro = await service.criar(contaA, { nome: 'Ana Souza', telefone: '11987654321', tipoEvento: 'Aniversário infantil' })
    const segundo = await service.criar(contaA, { nome: 'Bruno Lima' })

    expect(primeiro.etapa).toBe('novo')
    expect(primeiro.ultimoContatoEm).toBeNull()
    expect(primeiro.origem).toBe('whatsapp')
    expect(segundo.posicao).toBeLessThan(primeiro.posicao)
    expect((await service.listar(contaA)).map((l) => l.nome)).toEqual(['Bruno Lima', 'Ana Souza'])
  })

  it('valida nome, telefone e e-mail; campos vazios viram null', async () => {
    const { service, contaA } = cenario()
    await expect(service.criar(contaA, { nome: 'A' })).rejects.toThrow()
    await expect(service.criar(contaA, { nome: 'Ana', telefone: '123' })).rejects.toThrow()
    await expect(service.criar(contaA, { nome: 'Ana', email: 'nao-e-email' })).rejects.toThrow()
    const lead = await service.criar(contaA, { nome: 'Ana', telefone: '', email: '', dataEvento: '', observacoes: '' })
    expect(lead).toMatchObject({ telefone: null, email: null, dataEvento: null, observacoes: null })
  })
})

describe('CrmService.mover', () => {
  it('entrar em primeiro contato / follow-up registra contato; sair de concluído limpa o resultado', async () => {
    const { service, contaA } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })

    const emContato = await service.mover(contaA, lead.id, { etapa: 'primeiro_contato', posicao: 0 })
    expect(emContato.etapa).toBe('primeiro_contato')
    expect(emContato.ultimoContatoEm).toBeInstanceOf(Date)

    const concluido = await service.mover(contaA, lead.id, { etapa: 'concluido', posicao: 0 })
    const ganho = await service.atualizar(contaA, concluido.id, { resultado: 'ganho' })
    expect(ganho.resultado).toBe('ganho')

    const reaberto = await service.mover(contaA, lead.id, { etapa: 'follow_up', posicao: 0 })
    expect(reaberto.resultado).toBeNull()
  })

  it('rejeita etapa inválida', async () => {
    const { service, contaA } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })
    await expect(service.mover(contaA, lead.id, { etapa: 'perdido', posicao: 0 })).rejects.toThrow()
  })

  it('resultado só vale em concluído', async () => {
    const { service, contaA } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })
    const atualizado = await service.atualizar(contaA, lead.id, { resultado: 'ganho' })
    expect(atualizado.resultado).toBeNull()
  })
})

describe('CrmService — isolamento entre contas', () => {
  it('lead de outra conta responde "não encontrado" em todas as operações', async () => {
    const { service, contaA, contaB } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })

    expect(await service.listar(contaB)).toEqual([])
    await expect(service.atualizar(contaB, lead.id, { nome: 'Invasor' })).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(service.mover(contaB, lead.id, { etapa: 'concluido', posicao: 0 })).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(service.registrarContato(contaB, lead.id)).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(service.excluir(contaB, lead.id)).rejects.toBeInstanceOf(ErroNaoEncontrado)
    expect(await service.listar(contaA)).toHaveLength(1)
  })
})

describe('CrmService.resumo e alerta de follow-up', () => {
  it('conta por etapa, ganhos/perdidos e leads parados há mais de 3 dias no follow-up', async () => {
    const { fake, service, contaA } = cenario()
    const antigo = new Date(Date.now() - 5 * DIA_MS).toISOString()
    fake.semear('crm_leads', [
      { conta_id: contaA, nome: 'Novo', etapa: 'novo', origem: 'whatsapp', posicao: 0 },
      { conta_id: contaA, nome: 'Parado', etapa: 'follow_up', origem: 'whatsapp', posicao: 0, ultimo_contato_em: antigo },
      { conta_id: contaA, nome: 'Em dia', etapa: 'follow_up', origem: 'whatsapp', posicao: 1, ultimo_contato_em: new Date().toISOString() },
      { conta_id: contaA, nome: 'Fechou', etapa: 'concluido', resultado: 'ganho', origem: 'instagram', posicao: 0 },
      { conta_id: contaA, nome: 'Não fechou', etapa: 'concluido', resultado: 'perdido', origem: 'site', posicao: 1 },
    ])

    const resumo = await service.resumo(contaA)
    expect(resumo).toEqual({
      total: 5,
      porEtapa: { novo: 1, primeiro_contato: 0, follow_up: 2, concluido: 2 },
      paradosNoFollowUp: 1,
      ganhos: 1,
      perdidos: 1,
    })
  })

  it('registrar contato tira o lead do alerta', async () => {
    const { fake, service, contaA } = cenario()
    const [linha] = fake.semear('crm_leads', [
      { conta_id: contaA, nome: 'Parado', etapa: 'follow_up', origem: 'whatsapp', posicao: 0, ultimo_contato_em: new Date(Date.now() - 4 * DIA_MS).toISOString() },
    ])
    const lead = await service.registrarContato(contaA, linha!['id'] as string)
    expect(estaParadoNoFollowUp(lead)).toBe(false)
  })

  it('follow-up sem nenhum contato usa a data de criação como referência', () => {
    const criadoEm = new Date(Date.now() - 4 * DIA_MS)
    expect(estaParadoNoFollowUp({ etapa: 'follow_up', ultimoContatoEm: null, criadoEm })).toBe(true)
    expect(estaParadoNoFollowUp({ etapa: 'novo', ultimoContatoEm: null, criadoEm })).toBe(false)
  })
})
