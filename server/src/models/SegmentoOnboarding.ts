/**
 * Card do seletor de segmento no onboarding (Login.jsx, modo
 * 'escolher-negocio'). É uma camada de apresentação em cima de
 * {@link TipoNegocio} — mais de um card pode apontar pro mesmo
 * `tipoNegocio` (ex: "Decoração" e "Personagens Vivos" reaproveitam o
 * template técnico de `salao_festas`, por não terem módulo dedicado), então não
 * dá pra derivar isso de TIPOS_NEGOCIO_CONFIG (1 entrada por
 * TipoNegocio). Os valores vivem em config/segmentos-onboarding.config.ts.
 */
import type { TipoNegocio } from './User.js'

export interface SegmentoOnboarding {
  /** Slug único do card — usado só pra chave/estado na UI, nunca persistido. */
  id: string
  /** Nome do nicho, ex: "Personagens Vivos". */
  nome: string
  /** Descrição curta do nicho, exibida como subtítulo no card. Ausente em 'outro'. */
  subtitulo?: string
  /** Template técnico que esse card mapeia — é o que vai em POST /auth/selecionar-tipo-negocio. */
  tipoNegocio: TipoNegocio
}
