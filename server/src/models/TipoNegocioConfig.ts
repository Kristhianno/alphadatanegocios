/**
 * Estrutura de configuração de um vertical de negócio. Os *valores*
 * (um TipoNegocioConfig por TipoNegocio) vivem em
 * config/tipos-negocio.config.ts (Tarefa 7.2) — este arquivo define
 * apenas o formato, para as duas pontas serem escritas/checadas contra
 * o mesmo contrato.
 */

import type { Papel, TipoNegocio } from './User.js'

export interface MenuItem {
  id: string
  /** Rótulo exibido na sidebar. */
  label: string
  /** Nome do ícone (Tabler) ou emoji. */
  icone: string
  /** Rota da SPA, ex: '/confeitaria/pedidos'. */
  rota: string
  /**
   * Quais papéis veem este item. Omitido = visível para todos os
   * papéis habilitados no módulo. Ex: 'estoque' normalmente some do
   * menu de quem loga como 'cliente'.
   */
  papeis?: Papel[]
}

export interface TipoNegocioConfig {
  tipo: TipoNegocio
  /** Nome amigável, ex: "Confeitaria e Salgados". */
  nome: string
  /** Emoji ou nome de ícone usado no seletor de tipo de negócio do login. */
  icone: string
  /** Módulos habilitados para este vertical, ex: ["catalogo", "receitas", "pedidos"]. */
  modulos: string[]
  menuItems: MenuItem[]
  /** Slugs de relatório disponíveis em Relatorios (Tarefa 4/services), ex: "lucro-por-receita". */
  relatorios: string[]
  /**
   * Descreve os campos esperados em Servico.metadados para este
   * vertical — usado para gerar formulários dinâmicos na UI e para
   * validação em utils/validadores.ts. As chaves aqui devem
   * corresponder aos campos de MetadadosServico* em models/Servico.ts.
   */
  metadadosServico: Record<string, CampoMetadado>
  /** Mesma ideia de metadadosServico, mas para o campo `metadados` de OrdemServico. */
  metadadosOrdem: Record<string, CampoMetadado>
}

/** Descreve um campo dinâmico de metadados — o suficiente para renderizar um input genérico. */
export interface CampoMetadado {
  tipo: 'texto' | 'numero' | 'data' | 'booleano' | 'selecao'
  label: string
  obrigatorio?: boolean
  /** Only relevant when tipo === 'selecao'. */
  opcoes?: string[]
}
