/** Lead captado na landing page pública ("fale com a gente") — dado comercial da ALPHADATA, não de um tenant. */
export interface Lead {
  id: string
  nome: string
  email: string
  origem: string
  criadoEm: Date
}

export type NovoLeadInput = Pick<Lead, 'nome' | 'email'> & Partial<Pick<Lead, 'origem'>>
