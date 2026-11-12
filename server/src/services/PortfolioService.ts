/**
 * Portfólio da conta: Pacotes, Kits e Adicionais — o que a empresa vende
 * e o que a IA do WhatsApp vai oferecer. Os dados ficam em
 * `portfolio_itens`; fotos e PDFs ficam em `arquivos` (Storage), ligados ao
 * item (entidade 'portfolio_item') ou aos "materiais prontos" de cada aba
 * (entidade 'portfolio_<tipo>', ex: um PDF com todos os kits já pronto).
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import {
  ENTIDADE_ITEM_PORTFOLIO,
  TIPOS_PORTFOLIO,
  entidadeMateriais,
  type PortfolioItem,
  type PortfolioItemComMidia,
  type TipoPortfolio,
} from '../models/PortfolioItem.js'
import type { ArquivoComUrl } from '../models/Arquivo.js'
import { PortfolioRepository } from '../repositories/PortfolioRepository.js'
import { ArquivoService } from './ArquivoService.js'
import type { ArmazenamentoObjetos } from '../utils/armazenamento-objetos.js'
import { ErroNaoEncontrado } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()

const schemaDados = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.').max(120),
  descricao: textoOpcional(2000),
  preco: z.number().min(0).max(100_000_000).nullable().optional(),
  capacidade: z.number().int().min(0).max(100_000).nullable().optional(),
  itensInclusos: z
    .array(z.string().trim().max(200))
    .max(100)
    .transform((itens) => itens.filter(Boolean))
    .optional(),
  ativo: z.boolean().optional(),
})

const schemaCriar = schemaDados.extend({ tipo: z.enum(TIPOS_PORTFOLIO) })
const schemaTipo = z.enum(TIPOS_PORTFOLIO)

export class PortfolioService {
  private readonly itens: PortfolioRepository
  private readonly arquivos: ArquivoService

  constructor(client: Cliente, armazenamento?: ArmazenamentoObjetos) {
    this.itens = new PortfolioRepository(client)
    this.arquivos = new ArquivoService(client, armazenamento)
  }

  /** Itens (de um tipo, ou todos) com fotos e PDFs. Ordem: ativos primeiro, depois por nome. */
  async listar(contaId: string, tipo?: unknown): Promise<PortfolioItemComMidia[]> {
    const filtro: Record<string, unknown> = { conta_id: contaId }
    if (tipo !== undefined && tipo !== '') filtro['tipo'] = schemaTipo.parse(tipo)
    const [lista, midia] = await Promise.all([
      this.itens.listar(filtro, { ordenarPor: 'nome' }),
      this.arquivos.listar(contaId, { entidadeTipo: ENTIDADE_ITEM_PORTFOLIO }),
    ])

    // Mídia mais antiga primeiro: a primeira foto enviada é a principal.
    const porItem = new Map<string, ArquivoComUrl[]>()
    for (const arquivo of [...midia].reverse()) {
      if (!arquivo.entidadeId) continue
      porItem.set(arquivo.entidadeId, [...(porItem.get(arquivo.entidadeId) ?? []), arquivo])
    }
    return lista
      .sort((a, b) => Number(b.ativo) - Number(a.ativo))
      .map((item) => {
        const doItem = porItem.get(item.id) ?? []
        return { ...item, fotos: doItem.filter((a) => a.tipo === 'imagem'), pdfs: doItem.filter((a) => a.tipo === 'documento') }
      })
  }

  async criar(contaId: string, dados: unknown): Promise<PortfolioItemComMidia> {
    const validado = schemaCriar.parse(dados)
    const item = await this.itens.criar({ ...validado, contaId, itensInclusos: validado.itensInclusos ?? [], ativo: validado.ativo ?? true })
    logger.info({ contaId, itemId: item.id, tipo: item.tipo }, 'Item do portfólio criado.')
    return { ...item, fotos: [], pdfs: [] }
  }

  async atualizar(contaId: string, itemId: string, dados: unknown): Promise<PortfolioItemComMidia> {
    await this.buscarDaConta(contaId, itemId)
    const validado = schemaDados.partial().parse(dados)
    await this.itens.atualizar(itemId, validado)
    return this.buscarComMidia(contaId, itemId)
  }

  /** Apaga o item e as fotos/PDFs dele (do Storage também). */
  async excluir(contaId: string, itemId: string): Promise<void> {
    await this.buscarDaConta(contaId, itemId)
    const removidos = await this.arquivos.excluirDaEntidade(contaId, ENTIDADE_ITEM_PORTFOLIO, itemId)
    await this.itens.deletar(itemId)
    logger.info({ contaId, itemId, arquivosRemovidos: removidos }, 'Item do portfólio excluído.')
  }

  /** "Materiais prontos" de uma aba: imagens e PDFs que a empresa já tinha (artes, catálogos). */
  async materiais(contaId: string, tipo: unknown): Promise<ArquivoComUrl[]> {
    return this.arquivos.listar(contaId, { entidadeTipo: entidadeMateriais(schemaTipo.parse(tipo) as TipoPortfolio) })
  }

  async buscarComMidia(contaId: string, itemId: string): Promise<PortfolioItemComMidia> {
    const item = await this.buscarDaConta(contaId, itemId)
    const midia = (await this.arquivos.listar(contaId, { entidadeTipo: ENTIDADE_ITEM_PORTFOLIO, entidadeId: itemId })).reverse()
    return { ...item, fotos: midia.filter((a) => a.tipo === 'imagem'), pdfs: midia.filter((a) => a.tipo === 'documento') }
  }

  private async buscarDaConta(contaId: string, itemId: string): Promise<PortfolioItem> {
    const item = await this.itens.buscarPorId(itemId)
    if (!item || item.contaId !== contaId) throw new ErroNaoEncontrado('Item do portfólio', itemId)
    return item
  }
}
