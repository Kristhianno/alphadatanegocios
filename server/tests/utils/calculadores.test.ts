import { describe, expect, it } from 'vitest'
import { arredondarMoeda, calcularPercentual, somarArredondado } from '../../src/utils/calculadores.js'

describe('arredondarMoeda', () => {
  it('arredonda pra 2 casas decimais', () => {
    expect(arredondarMoeda(10.005)).toBeCloseTo(10.01, 2)
    expect(arredondarMoeda(19.999)).toBeCloseTo(20.0, 2)
  })

  it('corrige o erro clássico de ponto flutuante', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(arredondarMoeda(0.1 + 0.2)).toBe(0.3)
  })
})

describe('somarArredondado', () => {
  it('soma uma lista e arredonda o total', () => {
    expect(somarArredondado([10.1, 20.2, 5.005])).toBeCloseTo(35.31, 2)
  })

  it('soma vazia é zero', () => {
    expect(somarArredondado([])).toBe(0)
  })
})

describe('calcularPercentual', () => {
  it('calcula o percentual de uma parte sobre o total', () => {
    expect(calcularPercentual(25, 200)).toBe(12.5)
  })

  it('não divide por zero — retorna 0 quando total é 0', () => {
    expect(calcularPercentual(10, 0)).toBe(0)
  })
})
