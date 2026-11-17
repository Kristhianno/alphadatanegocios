import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LeadService, normalizarWhatsapp, textoAvisoWhatsapp } from '../../src/services/LeadService.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

const VARIAVEIS = ['GOOGLE_SHEETS_WEBHOOK_URL', 'EVOLUTION_API_URL', 'EVOLUTION_API_KEY', 'EVOLUTION_INSTANCIA', 'AVISO_WHATSAPP_NUMERO'] as const

describe('LeadService', () => {
  let anteriores: Record<string, string | undefined>
  const chamadas: { url: string; corpo: Record<string, unknown>; headers: Record<string, string> }[] = []

  beforeEach(() => {
    anteriores = Object.fromEntries(VARIAVEIS.map((v) => [v, process.env[v]]))
    for (const v of VARIAVEIS) delete process.env[v]
    chamadas.length = 0
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      chamadas.push({ url, corpo: JSON.parse(String(init.body)), headers: init.headers as Record<string, string> })
      return new Response('{}', { status: 200 })
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    for (const [v, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[v]
      else process.env[v] = valor
    }
  })

  it('salva nome, e-mail, WhatsApp e mensagem', async () => {
    const fake = criarClienteFake()
    const lead = await new LeadService(paraTipado(fake)).criar({
      nome: 'Ana Souza', email: 'ana@email.com', telefone: '(11) 98765-4321', mensagem: 'Quero conhecer os planos', origem: 'conhecer-planos',
    })
    expect(lead).toMatchObject({ nome: 'Ana Souza', telefone: '(11) 98765-4321', mensagem: 'Quero conhecer os planos', origem: 'conhecer-planos' })
    expect(fake.linhasDe('leads')).toHaveLength(1)
  })

  it('valida e-mail e WhatsApp; WhatsApp é opcional', async () => {
    const service = new LeadService(paraTipado(criarClienteFake()))
    await expect(service.criar({ nome: 'Ana', email: 'nao-e-email' })).rejects.toThrow()
    await expect(service.criar({ nome: 'Ana', email: 'ana@email.com', telefone: '123' })).rejects.toThrow()
    await expect(service.criar({ nome: 'Ana', email: 'ana@email.com', telefone: '' })).resolves.toMatchObject({ telefone: null })
  })

  it('robô que preenche o campo-armadilha é descartado sem salvar nem avisar', async () => {
    process.env['GOOGLE_SHEETS_WEBHOOK_URL'] = 'https://planilha.teste/exec'
    const fake = criarClienteFake()
    const lead = await new LeadService(paraTipado(fake)).criar({ nome: 'Spam', email: 'spam@x.com', site: 'http://spam' })
    expect(lead).toBeNull()
    expect(fake.linhasDe('leads')).toHaveLength(0)
    expect(chamadas).toHaveLength(0)
  })

  it('envia pra planilha com WhatsApp e mensagem, e avisa no WhatsApp do dono pela Evolution', async () => {
    process.env['GOOGLE_SHEETS_WEBHOOK_URL'] = 'https://planilha.teste/exec'
    process.env['EVOLUTION_API_URL'] = 'https://evolution.teste/'
    process.env['EVOLUTION_API_KEY'] = 'chave-teste'
    process.env['EVOLUTION_INSTANCIA'] = 'alphadata'
    process.env['AVISO_WHATSAPP_NUMERO'] = '(11) 91234-5678'

    await new LeadService(paraTipado(criarClienteFake())).criar({ nome: 'Ana Souza', email: 'ana@email.com', mensagem: 'Quero os planos', origem: 'conhecer-planos' })

    const planilha = chamadas.find((c) => c.url.startsWith('https://planilha.teste'))!
    expect(planilha.corpo).toMatchObject({ nome: 'Ana Souza', email: 'ana@email.com', mensagem: 'Quero os planos', origem: 'conhecer-planos' })
    const whatsapp = chamadas.find((c) => c.url.startsWith('https://evolution.teste'))!
    expect(whatsapp.url).toBe('https://evolution.teste/message/sendText/alphadata')
    expect(whatsapp.headers['apikey']).toBe('chave-teste')
    expect(whatsapp.corpo['number']).toBe('5511912345678')
    expect(String(whatsapp.corpo['text'])).toContain('Ana Souza')
  })

  it('sem Evolution configurada, não tenta avisar no WhatsApp', async () => {
    process.env['GOOGLE_SHEETS_WEBHOOK_URL'] = 'https://planilha.teste/exec'
    await new LeadService(paraTipado(criarClienteFake())).criar({ nome: 'Ana Souza', email: 'ana@email.com' })
    expect(chamadas.map((c) => c.url)).toEqual(['https://planilha.teste/exec'])
  })

  it('falha da planilha ou do WhatsApp não perde o lead', async () => {
    process.env['GOOGLE_SHEETS_WEBHOOK_URL'] = 'https://planilha.teste/exec'
    vi.stubGlobal('fetch', async () => {
      throw new Error('fora do ar')
    })
    const fake = criarClienteFake()
    await expect(new LeadService(paraTipado(fake)).criar({ nome: 'Ana Souza', email: 'ana@email.com' })).resolves.not.toBeNull()
    expect(fake.linhasDe('leads')).toHaveLength(1)
  })
})

describe('normalizarWhatsapp / textoAvisoWhatsapp', () => {
  it('coloca o DDI 55 quando vem só DDD + número', () => {
    expect(normalizarWhatsapp('(11) 98765-4321')).toBe('5511987654321')
    expect(normalizarWhatsapp('+55 11 98765-4321')).toBe('5511987654321')
  })
  it('monta o aviso só com o que foi preenchido', () => {
    const texto = textoAvisoWhatsapp({ nome: 'Ana', email: 'a@b.com', telefone: null, mensagem: null, origem: 'landing' })
    expect(texto).toContain('*Nome:* Ana')
    expect(texto).not.toContain('WhatsApp:')
    expect(texto).not.toContain('Mensagem')
  })
})
