import { describe, expect, it } from 'vitest'
import { ServicoFactory } from '../../src/models/Servico.js'

describe('ServicoFactory', () => {
  it('aplica a duração padrão de cada vertical quando não informada', () => {
    expect(ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'confeitaria', nome: 'Bolo' }).duracaoEstimadaMinutos).toBeNull()
    expect(ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'salao_festas', nome: 'Pacote' }).duracaoEstimadaMinutos).toBe(300)
    expect(ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'fotografia_video', nome: 'Ensaio' }).duracaoEstimadaMinutos).toBe(120)
    expect(ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'manutencao', nome: 'Reparo' }).duracaoEstimadaMinutos).toBe(60)
    expect(ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'outro', nome: 'X' }).duracaoEstimadaMinutos).toBeNull()
  })

  it('respeita uma duração explícita em vez do default do vertical', () => {
    const servico = ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'manutencao', nome: 'Reparo urgente', duracaoEstimadaMinutos: 15 })
    expect(servico.duracaoEstimadaMinutos).toBe(15)
  })

  it('metadados default pra objeto vazio, nunca undefined', () => {
    const servico = ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'confeitaria', nome: 'Bolo' })
    expect(servico.metadados).toEqual({})
  })

  it('preserva o tipoNegocio e os metadados tipados informados', () => {
    const servico = ServicoFactory.criar('id', {
      contaId: 'c',
      tipoNegocio: 'confeitaria',
      nome: 'Bolo de morango',
      metadados: { sabor: 'morango', tamanho: 'G' },
    })
    expect(servico.tipoNegocio).toBe('confeitaria')
    if (servico.tipoNegocio === 'confeitaria') {
      expect(servico.metadados.sabor).toBe('morango')
    }
  })

  it('marca o serviço como ativo por padrão', () => {
    expect(ServicoFactory.criar('id', { contaId: 'c', tipoNegocio: 'outro', nome: 'X' }).ativo).toBe(true)
  })
})
