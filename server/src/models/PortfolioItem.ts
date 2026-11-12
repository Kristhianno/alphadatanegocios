import type { ArquivoComUrl } from './Arquivo.js'

export const TIPOS_PORTFOLIO = ['pacote', 'kit', 'adicional'] as const
export type TipoPortfolio = (typeof TIPOS_PORTFOLIO)[number]

/** Item do portfólio da conta (tabela `portfolio_itens`). */
export interface PortfolioItem {
  id: string
  contaId: string
  tipo: TipoPortfolio
  nome: string
  descricao: string | null
  preco: number | null
  /** Convidados atendidos (faz sentido em pacotes). */
  capacidade: number | null
  itensInclusos: string[]
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

/** Item + mídia (fotos e PDF, de `arquivos` com entidade 'portfolio_item'). A primeira foto é a principal. */
export interface PortfolioItemComMidia extends PortfolioItem {
  fotos: ArquivoComUrl[]
  pdfs: ArquivoComUrl[]
}

/** entidade_tipo dos arquivos de um item e dos "materiais prontos" de cada aba. */
export const ENTIDADE_ITEM_PORTFOLIO = 'portfolio_item'
export function entidadeMateriais(tipo: TipoPortfolio): string {
  return `portfolio_${tipo}`
}
