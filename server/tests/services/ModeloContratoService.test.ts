import { describe, expect, it } from 'vitest'
import { ModeloContratoService, analisarCampos, preencherModelo } from '../../src/services/ModeloContratoService.js'
import { ArquivoService } from '../../src/services/ArquivoService.js'
import type { Conta } from '../../src/models/User.js'
import { ErroNaoEncontrado } from '../../src/errors/AppError.js'
import { ArmazenamentoMemoria } from '../helpers/armazenamentoMemoria.js'
import { criarClienteFake, paraTipado } from '../helpers/fakeSupabase.js'

function cenario() {
  const fake = criarClienteFake()
  const [a, b] = fake.semear('contas', [
    { nome_empresa: 'Festa Mágica', tipo_negocio: 'salao_festas', plano: 'startup', status: 'ativo', configuracoes_gerais: { moeda: 'BRL' } },
    { nome_empresa: 'Outra', tipo_negocio: 'salao_festas', plano: 'startup', status: 'ativo', configuracoes_gerais: {} },
  ])
  const armazenamento = new ArmazenamentoMemoria()
  const cliente = paraTipado(fake)
  const conta = (linha: Record<string, unknown>) =>
    ({ id: linha['id'], plano: 'startup', configuracoesGerais: linha['configuracoes_gerais'] }) as unknown as Conta
  return {
    armazenamento,
    servico: new ModeloContratoService(cliente, armazenamento),
    arquivos: new ArquivoService(cliente, armazenamento),
    conta: conta(a!),
    outra: conta(b!),
  }
}

async function enviarModelo(c: ReturnType<typeof cenario>, conta: Conta, tipoMime = 'application/pdf') {
  const { caminho, bucket } = await c.arquivos.prepararUpload(conta, { nome: 'contrato.pdf', tipoMime, tamanhoBytes: 5000, categoria: 'contrato' })
  c.armazenamento.enviar(bucket, caminho, 5000, tipoMime)
  return c.arquivos.confirmarUpload(conta, 'u', { caminho, nome: 'contrato.pdf', categoria: 'contrato', entidadeTipo: 'modelo_contrato' })
}

describe('analisarCampos / preencherModelo', () => {
  it('separa campos conhecidos de marcações com erro de digitação', () => {
    const r = analisarCampos('Contratante: {{cliente_nome}}, CPF {{ cliente_cpf_cnpj }}, festa em {{evento_dta}} — {{cliente_nome}}')
    expect(r.usados).toEqual(['cliente_nome', 'cliente_cpf_cnpj'])
    expect(r.desconhecidos).toEqual(['evento_dta'])
  })

  it('troca só as marcações e deixa lacuna no que não tem valor', () => {
    const texto = 'Eu, {{cliente_nome}}, contrato o {{pacote_nome}} por {{valor_total}}. Sinal: {{valor_sinal}}.'
    expect(preencherModelo(texto, { cliente_nome: 'Ana Souza', pacote_nome: 'Kit Unicórnio', valor_total: 'R$ 890,00' })).toBe(
      'Eu, Ana Souza, contrato o Kit Unicórnio por R$ 890,00. Sinal: ________.',
    )
  })
})

describe('ModeloContratoService', () => {
  it('sem nada configurado devolve vazio com a lista de campos disponíveis', async () => {
    const c = cenario()
    const modelo = await c.servico.obter(c.conta)
    expect(modelo).toMatchObject({ arquivo: null, texto: '', camposUsados: [] })
    expect(modelo.camposDisponiveis.length).toBeGreaterThan(10)
  })

  it('salva o texto sem apagar as outras configurações da conta', async () => {
    const c = cenario()
    const modelo = await c.servico.salvarTexto({ ...c.conta } as Conta, { texto: 'Contratante: {{cliente_nome}} em {{evento_data}}' })
    expect(modelo.camposUsados).toEqual(['cliente_nome', 'evento_data'])
    expect(modelo.atualizadoEm).not.toBeNull()
  })

  it('o arquivo do modelo é privado (link temporário)', async () => {
    const c = cenario()
    const arquivo = await enviarModelo(c, c.conta)
    const modelo = await c.servico.definirArquivo(c.conta, { arquivoId: arquivo.id })
    expect(modelo.arquivo).toMatchObject({ id: arquivo.id, bucket: 'privado', urlTemporaria: true })
  })

  it('enviar outro arquivo substitui: o antigo some do storage', async () => {
    const c = cenario()
    const antigo = await enviarModelo(c, c.conta)
    await c.servico.definirArquivo(c.conta, { arquivoId: antigo.id })
    const novo = await enviarModelo(c, c.conta, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    const modelo = await c.servico.definirArquivo(c.conta, { arquivoId: novo.id })

    expect(modelo.arquivo?.id).toBe(novo.id)
    expect(await c.armazenamento.metadados('privado', antigo.caminho)).toBeNull()
    expect(c.armazenamento.objetos.size).toBe(1)
  })

  it('não aceita arquivo de outra conta como modelo; remover apaga o arquivo', async () => {
    const c = cenario()
    const daOutra = await enviarModelo(c, c.outra)
    await expect(c.servico.definirArquivo(c.conta, { arquivoId: daOutra.id })).rejects.toBeInstanceOf(ErroNaoEncontrado)

    const meu = await enviarModelo(c, c.conta)
    await c.servico.definirArquivo(c.conta, { arquivoId: meu.id })
    const depois = await c.servico.removerArquivo(c.conta)
    expect(depois.arquivo).toBeNull()
    expect(await c.armazenamento.metadados('privado', meu.caminho)).toBeNull()
  })
})
