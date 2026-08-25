import { describe, expect, it } from 'vitest'
import { rotuloPapel } from '../../src/models/User.js'

describe('rotuloPapel', () => {
  it('mapeia cada papel pro rótulo de UI correto', () => {
    expect(rotuloPapel('admin')).toBe('Administrador')
    expect(rotuloPapel('gestor')).toBe('Operacional')
    expect(rotuloPapel('tecnico')).toBe('Operacional')
    expect(rotuloPapel('cliente')).toBe('Cliente')
  })
})
