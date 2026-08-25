import { describe, expect, it } from 'vitest'
import { formatarDataBr, formatarMoedaBr, paraDataSql } from '../../src/utils/conversores.js'

describe('formatarMoedaBr', () => {
  it('formata em Real com o separador decimal pt-BR', () => {
    expect(formatarMoedaBr(1234.5)).toBe('R$ 1.234,50')
  })

  it('formata zero corretamente', () => {
    expect(formatarMoedaBr(0)).toBe('R$ 0,00')
  })
})

describe('formatarDataBr', () => {
  it('formata no padrão dd/mm/aaaa', () => {
    expect(formatarDataBr(new Date('2026-03-05T12:00:00Z'))).toBe('05/03/2026')
  })
})

describe('paraDataSql', () => {
  it('formata em YYYY-MM-DD', () => {
    expect(paraDataSql(new Date('2026-03-05T23:59:00Z'))).toBe('2026-03-05')
  })
})
