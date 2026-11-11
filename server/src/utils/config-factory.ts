/**
 * Único ponto de leitura de TIPOS_NEGOCIO_CONFIG — services e rotas
 * importam daqui, nunca de config/tipos-negocio.config.ts diretamente,
 * pra essa indireção poder virar validação/cache sem precisar tocar
 * quem consome.
 */
import type { TipoNegocio } from '../models/User.js'
import type { TipoNegocioConfig } from '../models/TipoNegocioConfig.js'
import type { SegmentoOnboardingComModulos } from '../models/SegmentoOnboarding.js'
import { TIPOS_NEGOCIO_CONFIG } from '../config/tipos-negocio.config.js'
import { SEGMENTOS_ONBOARDING } from '../config/segmentos-onboarding.config.js'

export function getConfigTipoNegocio(tipoNegocio: TipoNegocio): TipoNegocioConfig {
  return TIPOS_NEGOCIO_CONFIG[tipoNegocio]
}

/**
 * Cards do seletor de nicho no cadastro/login — antes de a conta ter
 * escolhido um vertical. `modulos` sai do próprio menu do template, pra
 * prévia do seletor nunca divergir do menu que a conta vai ganhar.
 */
export function listarSegmentosOnboarding(): SegmentoOnboardingComModulos[] {
  return SEGMENTOS_ONBOARDING.map((segmento) => ({
    ...segmento,
    modulos: [
      ...new Set(
        TIPOS_NEGOCIO_CONFIG[segmento.tipoNegocio].menuItems.filter((item) => item.id !== 'dashboard').map((item) => item.label),
      ),
    ],
  }))
}
