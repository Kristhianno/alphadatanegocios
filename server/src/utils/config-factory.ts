/**
 * Único ponto de leitura de TIPOS_NEGOCIO_CONFIG — services e rotas
 * importam daqui, nunca de config/tipos-negocio.config.ts diretamente,
 * pra essa indireção poder virar validação/cache sem precisar tocar
 * quem consome.
 */
import type { TipoNegocio } from '../models/User.js'
import type { TipoNegocioConfig } from '../models/TipoNegocioConfig.js'
import type { SegmentoOnboarding } from '../models/SegmentoOnboarding.js'
import { TIPOS_NEGOCIO_CONFIG } from '../config/tipos-negocio.config.js'
import { SEGMENTOS_ONBOARDING } from '../config/segmentos-onboarding.config.js'

export function getConfigTipoNegocio(tipoNegocio: TipoNegocio): TipoNegocioConfig {
  return TIPOS_NEGOCIO_CONFIG[tipoNegocio]
}

/** Cards do seletor de segmento no cadastro/login — antes de a conta ter escolhido um vertical. */
export function listarSegmentosOnboarding(): SegmentoOnboarding[] {
  return SEGMENTOS_ONBOARDING
}
