/** Lead captado na landing page pública ("Conhecer planos", "fale com a gente") — dado comercial da ALPHADATA, não de um tenant. */
export interface Lead {
  id: string
  nome: string
  email: string
  /** WhatsApp informado no formulário (opcional). */
  telefone: string | null
  /** Mensagem/observações do formulário. */
  mensagem: string | null
  origem: string
  criadoEm: Date
}

export type NovoLeadInput = Pick<Lead, 'nome' | 'email'> & Partial<Pick<Lead, 'origem' | 'telefone' | 'mensagem'>>
