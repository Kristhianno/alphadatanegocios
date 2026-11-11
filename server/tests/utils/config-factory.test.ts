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

  it('pivô Festas & Eventos: oferece todos os nichos do segmento e nenhum de manutenção', () => {
    const lista = listarSegmentosOnboarding()
    const nomes = lista.map((s) => s.nome)
    for (const nicho of [
      'Salão de Festas',
      'Decoração',
      'Fotografia e Filmagem',
      'Personagens Vivos',
      'Recreação',
      'Aluguel de Brinquedos',
      'Barracas e Food Truck',
      'Doces Personalizados',
      'Salgados',
      'Bolos e Doces',
    ]) {
      expect(nomes).toContain(nicho)
    }
    expect(lista.some((s) => s.tipoNegocio === 'manutencao')).toBe(false)
    expect(new Set(lista.map((s) => s.id)).size).toBe(lista.length)
  })

  it('cada card traz a prévia do menu do seu template (sem Dashboard) e um grupo, exceto "outro"', () => {
    const lista = listarSegmentosOnboarding()
    const salao = lista.find((s) => s.id === 'salao-de-festas')!
    expect(salao.modulos).toEqual(getConfigTipoNegocio('salao_festas').menuItems.filter((i) => i.id !== 'dashboard').map((i) => i.label))
    expect(salao.modulos).not.toContain('Dashboard')
    for (const s of lista) {
      expect(s.modulos.length).toBeGreaterThan(0)
      if (s.tipoNegocio === 'outro') expect(s.grupo).toBeUndefined()
      else expect(s.grupo).toBeTruthy()
    }
  })
})
