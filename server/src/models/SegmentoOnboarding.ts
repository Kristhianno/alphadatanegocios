/**
 * Card do seletor de segmento no onboarding (Login.jsx, modo
 * 'escolher-negocio'). É uma camada de apresentação em cima de
 * {@link TipoNegocio} — mais de um card pode apontar pro mesmo
 * `tipoNegocio` (ex: "Saúde & Bem-Estar" reaproveita o template técnico
 * de `salao_festas`, por não ter um módulo dedicado ainda), então não
 * dá pra derivar isso de TIPOS_NEGOCIO_CONFIG (1 entrada por
 * TipoNegocio). Os valores vivem em config/segmentos-onboarding.config.ts.
 */
import type { TipoNegocio } from './User.js'

export interface SegmentoOnboarding {
  /** Slug único do card — usado só pra chave/estado na UI, nunca persistido. */
  id: string
  /** Título da macro-categoria, ex: "Alimentação & Encomendas". */
  nome: string
  /** Exemplos de nichos atendidos, exibido como subtítulo no card. Ausente em 'outro'. */
  subtitulo?: string
  /** Template técnico que esse card mapeia — é o que vai em POST /auth/selecionar-tipo-negocio. */
  tipoNegocio: TipoNegocio
}
