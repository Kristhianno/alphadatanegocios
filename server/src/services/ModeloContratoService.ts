/**
 * Modelo de contrato da conta — o contrato que a empresa já usa, pra IA do
 * WhatsApp preencher com os dados do cliente.
 *
 * Duas partes:
 *  - o ARQUIVO original (PDF/Word), em `arquivos` (bucket privado, entidade
 *    'modelo_contrato'); só um vale por vez — enviar outro substitui;
 *  - o TEXTO do modelo com campos marcados como {{cliente_nome}} etc.
 *    (opcional, recomendado), em `contas.configuracoes_gerais.modeloContrato`.
 *    É o que deixa a IA trocar só os dados, sem reescrever cláusulas.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import { CAMPOS_CONTRATO, ENTIDADE_MODELO_CONTRATO, TAMANHO_MAXIMO_TEXTO } from '../config/modelo-contrato.config.js'
import type { ArquivoComUrl } from '../models/Arquivo.js'
import type { Conta } from '../models/User.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import { ArquivoService } from './ArquivoService.js'
import type { ArmazenamentoObjetos } from '../utils/armazenamento-objetos.js'
import { ErroNaoEncontrado, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

export interface ModeloContrato {
  arquivo: ArquivoComUrl | null
  texto: string
  /** Campos {{...}} usados no texto e que o sistema conhece. */
  camposUsados: string[]
  /** Marcações {{...}} no texto que não são campos conhecidos (provável erro de digitação). */
  camposDesconhecidos: string[]
  atualizadoEm: string | null
  camposDisponiveis: typeof CAMPOS_CONTRATO
}

const schemaTexto = z.object({ texto: z.string().max(TAMANHO_MAXIMO_TEXTO, 'Texto muito longo (máximo de 50 mil caracteres).') })

export function analisarCampos(texto: string): { usados: string[]; desconhecidos: string[] } {
  const conhecidos = new Set(CAMPOS_CONTRATO.map((c) => c.chave))
  const encontrados = [...new Set([...texto.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => m[1]!.trim()))]
  return { usados: encontrados.filter((c) => conhecidos.has(c)), desconhecidos: encontrados.filter((c) => !conhecidos.has(c)) }
}

/** Troca cada {{campo}} pelo valor; campos sem valor ficam como "________" pra completar à mão. */
export function preencherModelo(texto: string, dados: Record<string, string | number | null | undefined>): string {
  return texto.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (_, chave: string) => {
    const valor = dados[chave.trim()]
    return valor === null || valor === undefined || valor === '' ? '________' : String(valor)
  })
}

export class ModeloContratoService {
  private readonly contas: ContaRepository
  private readonly arquivos: ArquivoService

  constructor(client: Cliente, armazenamento?: ArmazenamentoObjetos) {
    this.contas = new ContaRepository(client)
    this.arquivos = new ArquivoService(client, armazenamento)
  }

  async obter(conta: Pick<Conta, 'id' | 'configuracoesGerais'>): Promise<ModeloContrato> {
    const [maisRecente] = await this.arquivos.listar(conta.id, { entidadeTipo: ENTIDADE_MODELO_CONTRATO })
    const salvo = (conta.configuracoesGerais['modeloContrato'] ?? {}) as { texto?: string; atualizadoEm?: string }
    const texto = salvo.texto ?? ''
    const { usados, desconhecidos } = analisarCampos(texto)
    return {
      arquivo: maisRecente ?? null,
      texto,
      camposUsados: usados,
      camposDesconhecidos: desconhecidos,
      atualizadoEm: salvo.atualizadoEm ?? null,
      camposDisponiveis: CAMPOS_CONTRATO,
    }
  }

  async salvarTexto(conta: Conta, dados: unknown): Promise<ModeloContrato> {
    const { texto } = schemaTexto.parse(dados)
    const atualizada = await this.contas.atualizar(conta.id, {
      configuracoesGerais: { ...conta.configuracoesGerais, modeloContrato: { texto, atualizadoEm: new Date().toISOString() } },
    })
    logger.info({ contaId: conta.id, caracteres: texto.length }, 'Texto do modelo de contrato salvo.')
    return this.obter(atualizada)
  }

  /** Torna `arquivoId` o modelo atual e apaga os anteriores (do Storage também). */
  async definirArquivo(conta: Pick<Conta, 'id' | 'configuracoesGerais'>, dados: unknown): Promise<ModeloContrato> {
    const { arquivoId } = z.object({ arquivoId: z.string().uuid() }).parse(dados)
    const todos = await this.arquivos.listar(conta.id, { entidadeTipo: ENTIDADE_MODELO_CONTRATO })
    if (!todos.some((a) => a.id === arquivoId)) throw new ErroNaoEncontrado('Arquivo do modelo', arquivoId)
    for (const antigo of todos.filter((a) => a.id !== arquivoId)) await this.arquivos.excluir(conta.id, antigo.id)
    return this.obter(conta)
  }

  async removerArquivo(conta: Pick<Conta, 'id' | 'configuracoesGerais'>): Promise<ModeloContrato> {
    const todos = await this.arquivos.listar(conta.id, { entidadeTipo: ENTIDADE_MODELO_CONTRATO })
    if (todos.length === 0) throw new ErroValidacao('Não há arquivo de modelo para remover.')
    for (const a of todos) await this.arquivos.excluir(conta.id, a.id)
    return this.obter(conta)
  }
}
