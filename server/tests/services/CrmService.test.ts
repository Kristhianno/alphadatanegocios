import { describe, expect, it } from 'vitest'
import { CrmService, estaParadoNoFollowUp } from '../../src/services/CrmService.js'
import { ErroConflito, ErroNaoEncontrado } from '../../src/errors/AppError.js'
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
  it('cria em "primeiro contato", com contato registrado, e o mais novo fica no topo da coluna', async () => {
    const { service, contaA } = cenario()
    const primeiro = await service.criar(contaA, { nome: 'Ana Souza', telefone: '11987654321', tipoEvento: 'Aniversário infantil' })
    const segundo = await service.criar(contaA, { nome: 'Bruno Lima' })

    expect(primeiro.etapa).toBe('primeiro_contato')
    expect(primeiro.ultimoContatoEm).toBeInstanceOf(Date)
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

describe('CrmService — etapas exigem os marcos do negócio', () => {
  it('"novo" de integração antiga vira primeiro contato; não cria direto adiante', async () => {
    const { service, contaA } = cenario()
    expect((await service.criar(contaA, { nome: 'Ana Souza', etapa: 'novo' })).etapa).toBe('primeiro_contato')
    await expect(service.criar(contaA, { nome: 'Ana Souza', etapa: 'follow_up' })).rejects.toBeInstanceOf(ErroConflito)
  })

  it('só vai pro follow-up com o orçamento enviado', async () => {
    const { service, contaA } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })
    await expect(service.mover(contaA, lead.id, { etapa: 'follow_up', posicao: 0 })).rejects.toThrow('orçamento enviado')

    await service.marcar(contaA, lead.id, { marco: 'orcamentoEnviado', feito: true })
    const movido = await service.mover(contaA, lead.id, { etapa: 'follow_up', posicao: 0 })
    expect(movido.etapa).toBe('follow_up')
  })

  it('só conclui com contrato enviado, assinado, sinal pago e data da festa — e aí a data fica fechada', async () => {
    const { service, contaA } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })
    await service.marcar(contaA, lead.id, { marco: 'orcamentoEnviado', feito: true })
    await service.mover(contaA, lead.id, { etapa: 'follow_up', posicao: 0 })

    await expect(service.mover(contaA, lead.id, { etapa: 'concluido', posicao: 0 })).rejects.toThrow(
      'contrato enviado, contrato assinado, sinal da reserva pago',
    )
    await service.marcar(contaA, lead.id, { marco: 'contratoAssinado', feito: true }) // assinar já marca o envio
    await expect(service.mover(contaA, lead.id, { etapa: 'concluido', posicao: 0 })).rejects.toThrow('sinal da reserva pago')
    await service.marcar(contaA, lead.id, { marco: 'sinalPago', feito: true })
    await expect(service.mover(contaA, lead.id, { etapa: 'concluido', posicao: 0 })).rejects.toThrow('data da festa')

    await service.atualizar(contaA, lead.id, { dataEvento: '2027-03-20' })
    const concluido = await service.mover(contaA, lead.id, { etapa: 'concluido', posicao: 0 })
    expect(concluido).toMatchObject({ etapa: 'concluido', resultado: 'ganho', dataEvento: '2027-03-20' })

    await expect(service.atualizar(contaA, lead.id, { dataEvento: '2027-04-01' })).rejects.toThrow('data desta festa está fechada')
    await expect(service.marcar(contaA, lead.id, { marco: 'sinalPago', feito: false })).rejects.toBeInstanceOf(ErroConflito)
    expect((await service.atualizar(contaA, lead.id, { nome: 'Ana S. Souza' })).nome).toBe('Ana S. Souza')
  })

  it('voltar de etapa é livre: reabrir libera a data e permite desmarcar', async () => {
    const { fake, service, contaA } = cenario()
    const agora = new Date().toISOString()
    const [linha] = fake.semear('crm_leads', [{
      conta_id: contaA, nome: 'Fechada', etapa: 'concluido', resultado: 'ganho', origem: 'whatsapp', posicao: 0, data_evento: '2027-03-20',
      orcamento_enviado_em: agora, contrato_enviado_em: agora, contrato_assinado_em: agora, sinal_pago_em: agora,
    }])
    const id = linha!['id'] as string
    const reaberto = await service.mover(contaA, id, { etapa: 'follow_up', posicao: 0 })
    expect(reaberto.resultado).toBeNull()
    expect((await service.atualizar(contaA, id, { dataEvento: '2027-04-01' })).dataEvento).toBe('2027-04-01')
    const semEnvio = await service.marcar(contaA, id, { marco: 'contratoEnviado', feito: false })
    expect(semEnvio.contratoEnviadoEm).toBeNull()
    expect(semEnvio.contratoAssinadoEm).toBeNull() // desfazer o envio desfaz a assinatura
    await expect(service.marcar(contaA, id, { marco: 'orcamentoEnviado', feito: false })).rejects.toBeInstanceOf(ErroConflito)
  })

  it('rejeita etapa inválida', async () => {
    const { service, contaA } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })
    await expect(service.mover(contaA, lead.id, { etapa: 'novo', posicao: 0 })).rejects.toThrow()
  })
})

describe('CrmService — isolamento entre contas', () => {
  it('lead de outra conta responde "não encontrado" em todas as operações', async () => {
    const { service, contaA, contaB } = cenario()
    const lead = await service.criar(contaA, { nome: 'Ana Souza' })

    expect(await service.listar(contaB)).toEqual([])
    await expect(service.atualizar(contaB, lead.id, { nome: 'Invasor' })).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(service.mover(contaB, lead.id, { etapa: 'concluido', posicao: 0 })).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(service.marcar(contaB, lead.id, { marco: 'sinalPago', feito: true })).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(service.registrarContato(contaB, lead.id)).rejects.toBeInstanceOf(ErroNaoEncontrado)
    await expect(service.excluir(contaB, lead.id)).rejects.toBeInstanceOf(ErroNaoEncontrado)
    expect(await service.listar(contaA)).toHaveLength(1)
  })
})

describe('CrmService.resumo e alerta de follow-up', () => {
  it('conta por etapa, festas fechadas e leads parados há mais de 3 dias no follow-up', async () => {
    const { fake, service, contaA } = cenario()
    const antigo = new Date(Date.now() - 5 * DIA_MS).toISOString()
    fake.semear('crm_leads', [
      { conta_id: contaA, nome: 'Contato', etapa: 'primeiro_contato', origem: 'whatsapp', posicao: 0 },
      { conta_id: contaA, nome: 'Parado', etapa: 'follow_up', origem: 'whatsapp', posicao: 0, ultimo_contato_em: antigo },
      { conta_id: contaA, nome: 'Em dia', etapa: 'follow_up', origem: 'whatsapp', posicao: 1, ultimo_contato_em: new Date().toISOString() },
      { conta_id: contaA, nome: 'Fechou', etapa: 'concluido', resultado: 'ganho', origem: 'instagram', posicao: 0 },
    ])

    const resumo = await service.resumo(contaA)
    expect(resumo).toEqual({
      total: 4,
      porEtapa: { primeiro_contato: 1, follow_up: 2, concluido: 1 },
      paradosNoFollowUp: 1,
      ganhos: 1,
      perdidos: 0,
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
    expect(estaParadoNoFollowUp({ etapa: 'primeiro_contato', ultimoContatoEm: null, criadoEm })).toBe(false)
  })
})
