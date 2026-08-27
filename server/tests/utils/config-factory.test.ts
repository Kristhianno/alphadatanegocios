import { describe, expect, it } from 'vitest'
import { getConfigTipoNegocio, listarSegmentosOnboarding } from '../../src/utils/config-factory.js'

const TODOS_OS_TIPOS = ['confeitaria', 'salao_festas', 'fotografia_video', 'manutencao', 'outro'] as const

describe('getConfigTipoNegocio', () => {
  it('devolve a config certa pra cada vertical', () => {
    for (const tipo of TODOS_OS_TIPOS) {
      const config = getConfigTipoNegocio(tipo)
      expect(config.tipo).toBe(tipo)
    }
  })

  it('toda config tem nome, ícone e ao menos um item de menu', () => {
    for (const tipo of TODOS_OS_TIPOS) {
      const config = getConfigTipoNegocio(tipo)
      expect(config.nome.length).toBeGreaterThan(0)
      expect(config.icone.length).toBeGreaterThan(0)
      expect(config.menuItems.length).toBeGreaterThan(0)
    }
  })

  it('toda rota de menuItem começa com "/" (é um path de API de verdade, não um placeholder)', () => {
    for (const tipo of TODOS_OS_TIPOS) {
      for (const item of getConfigTipoNegocio(tipo).menuItems) {
        expect(item.rota.startsWith('/')).toBe(true)
      }
    }
  })
})

describe('listarSegmentosOnboarding', () => {
  it('lista os cards do seletor, cada um mapeando pra um tipoNegocio válido', () => {
    const lista = listarSegmentosOnboarding()
    expect(lista.length).toBeGreaterThan(0)
    for (const segmento of lista) {
      expect(segmento.nome.length).toBeGreaterThan(0)
      expect(TODOS_OS_TIPOS).toContain(segmento.tipoNegocio)
    }
  })

  it('inclui o card de fallback "outro"', () => {
    const lista = listarSegmentosOnboarding()
    expect(lista.some((s) => s.tipoNegocio === 'outro')).toBe(true)
  })
})
