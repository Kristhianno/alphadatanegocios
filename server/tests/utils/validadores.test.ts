import { describe, expect, it } from 'vitest'
import { validarCnpj, validarCpf, validarDocumento, validarTelefoneBr, validarUuid } from '../../src/utils/validadores.js'

describe('validarCpf', () => {
  it('aceita um CPF válido, com ou sem máscara', () => {
    expect(validarCpf('529.982.247-25')).toBe(true)
    expect(validarCpf('52998224725')).toBe(true)
  })

  it('rejeita dígitos repetidos', () => {
    expect(validarCpf('111.111.111-11')).toBe(false)
  })

  it('rejeita dígito verificador incorreto', () => {
    expect(validarCpf('529.982.247-24')).toBe(false)
  })

  it('rejeita tamanho incorreto', () => {
    expect(validarCpf('123')).toBe(false)
  })
})

describe('validarCnpj', () => {
  it('aceita um CNPJ válido, com ou sem máscara', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true)
    expect(validarCnpj('11222333000181')).toBe(true)
  })

  it('rejeita dígitos repetidos', () => {
    expect(validarCnpj('11.111.111/1111-11')).toBe(false)
  })

  it('rejeita dígito verificador incorreto', () => {
    expect(validarCnpj('11.222.333/0001-80')).toBe(false)
  })
})

describe('validarDocumento', () => {
  it('despacha pra CPF (11 dígitos) ou CNPJ (14 dígitos)', () => {
    expect(validarDocumento('52998224725')).toBe(true)
    expect(validarDocumento('11222333000181')).toBe(true)
  })

  it('rejeita qualquer outro tamanho', () => {
    expect(validarDocumento('123456')).toBe(false)
  })
})

describe('validarTelefoneBr', () => {
  it('aceita fixo (10) e celular (11 dígitos)', () => {
    expect(validarTelefoneBr('1133334444')).toBe(true)
    expect(validarTelefoneBr('11987654321')).toBe(true)
  })

  it('aceita com máscara — só os dígitos importam', () => {
    expect(validarTelefoneBr('(11) 98765-4321')).toBe(true)
  })

  it('rejeita tamanho incorreto', () => {
    expect(validarTelefoneBr('123')).toBe(false)
  })
})

describe('validarUuid', () => {
  it('aceita um UUID v4 válido', () => {
    expect(validarUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })

  it('rejeita string qualquer, undefined e null', () => {
    expect(validarUuid('não-é-um-uuid')).toBe(false)
    expect(validarUuid(undefined)).toBe(false)
    expect(validarUuid(null)).toBe(false)
    expect(validarUuid(123)).toBe(false)
  })
})
