/**
 * Serviço/produto vendável genérico. Espelha a tabela `servicos`
 * (schema_shared.sql). O campo `metadados` é tipado por vertical via
 * union discriminada em `tipoNegocio` — isso é o que permite escrever
 * `if (servico.tipoNegocio === 'confeitaria') servico.metadados.sabor`
 * com checagem de tipo em tempo de compilação, sem precisar de `any`.
 */

import type { TipoNegocio } from './User.js'

interface ServicoBase {
  id: string
  contaId: string
  nome: string
  descricao: string | null
  precoBase: number | null
  duracaoEstimadaMinutos: number | null
  ativo: boolean
  criadoEm: Date
  atualizadoEm: Date
}

export interface MetadadosServicoConfeitaria {
  sabor?: string
  recheio?: string
  tamanho?: string
  tempoPreparacaoMinutos?: number
  custoProducaoEstimado?: number
}

export interface MetadadosServicoSalaoFestas {
  tipoEvento?: 'aniversario' | 'casamento' | 'corporativo' | 'formatura' | 'confraternizacao' | 'outro'
  capacidadeConvidados?: number
  itensInclusos?: string[]
}

export interface MetadadosServicoFotografia {
  tipoSessao?: 'ensaio' | 'casamento' | 'evento' | 'produto' | 'institucional' | 'outro'
  quantidadeFotosInclusas?: number
  horasInclusas?: number
}

export interface MetadadosServicoManutencao {
  categoriaManutencao?: 'preventiva' | 'corretiva' | 'emergencia'
  tempoEstimadoHoras?: number
}

export type MetadadosServicoOutro = Record<string, unknown>

export type ServicoConfeitaria = ServicoBase & { tipoNegocio: 'confeitaria'; metadados: MetadadosServicoConfeitaria }
export type ServicoSalaoFestas = ServicoBase & { tipoNegocio: 'salao_festas'; metadados: MetadadosServicoSalaoFestas }
export type ServicoFotografiaVideo = ServicoBase & { tipoNegocio: 'fotografia_video'; metadados: MetadadosServicoFotografia }
export type ServicoManutencao = ServicoBase & { tipoNegocio: 'manutencao'; metadados: MetadadosServicoManutencao }
export type ServicoOutro = ServicoBase & { tipoNegocio: 'outro'; metadados: MetadadosServicoOutro }

/** Union discriminada por `tipoNegocio` — estreite o tipo checando esse campo antes de acessar `metadados`. */
export type Servico =
  | ServicoConfeitaria
  | ServicoSalaoFestas
  | ServicoFotografiaVideo
  | ServicoManutencao
  | ServicoOutro

/** Mapa auxiliar: dado um TipoNegocio, resolve o tipo de metadados correspondente. */
export type MetadadosServicoPorTipo = {
  confeitaria: MetadadosServicoConfeitaria
  salao_festas: MetadadosServicoSalaoFestas
  fotografia_video: MetadadosServicoFotografia
  manutencao: MetadadosServicoManutencao
  outro: MetadadosServicoOutro
}

export type NovoServicoInput<T extends TipoNegocio = TipoNegocio> = {
  contaId: string
  tipoNegocio: T
  nome: string
  descricao?: string
  precoBase?: number
  duracaoEstimadaMinutos?: number
  metadados?: MetadadosServicoPorTipo[T]
}

/**
 * Factory: constrói um {@link Servico} corretamente tipado para o
 * vertical informado, preenchendo defaults específicos de cada tipo de
 * negócio quando o chamador não os informa explicitamente.
 *
 * Centralizar a criação aqui evita que cada service (ConfeitariaService,
 * SalaoFestasService, ...) reimplemente sua própria lógica de "monte um
 * Servico" com defaults divergentes.
 */
export class ServicoFactory {
  static criar<T extends TipoNegocio>(
    id: string,
    input: NovoServicoInput<T>,
    agora: Date = new Date()
  ): Extract<Servico, { tipoNegocio: T }> {
    const base = {
      id,
      contaId: input.contaId,
      nome: input.nome,
      descricao: input.descricao ?? null,
      precoBase: input.precoBase ?? null,
      duracaoEstimadaMinutos: input.duracaoEstimadaMinutos ?? this.duracaoPadrao(input.tipoNegocio),
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
    }

    const servico = {
      ...base,
      tipoNegocio: input.tipoNegocio,
      metadados: input.metadados ?? {},
    }

    return servico as Extract<Servico, { tipoNegocio: T }>
  }

  /** Duração padrão (minutos) quando o serviço não informa uma — usada só como fallback de UI, não é regra de negócio rígida. */
  private static duracaoPadrao(tipoNegocio: TipoNegocio): number | null {
    switch (tipoNegocio) {
      case 'confeitaria':
        return null // encomendas não têm "duração", têm data de entrega
      case 'salao_festas':
        return 300 // 5h de evento, ajustável por pacote
      case 'fotografia_video':
        return 120 // 2h de sessão
      case 'manutencao':
        return 60
      case 'outro':
        return null
    }
  }
}
