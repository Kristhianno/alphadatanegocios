/**
 * Cliente final de uma conta (o comprador/contratante) — não confundir
 * com `Conta` (o tenant) nem com `Usuario` (o login). Um cliente pode
 * ou não ter um login próprio: a ligação é opcional e fica em
 * `Usuario.clienteId` (ver models/User.ts), no sentido Usuario → Cliente.
 *
 * Nomeado `ClienteFinal`, não `Cliente`, porque `Cliente` já é o alias
 * do client Supabase tipado (config/database.config.ts) — e os dois
 * tipos aparecem juntos na mesma assinatura em todo repository/service
 * (`constructor(client: Cliente)`), então precisam de nomes distintos.
 */
export interface ClienteFinal {
  id: string
  contaId: string
  nome: string
  email: string | null
  telefone: string | null
  documento: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  ativo: boolean
  /** Dados livres específicos do vertical (ex: preferências alimentares, endereços salvos). */
  metadados: Record<string, unknown>
  criadoEm: Date
  atualizadoEm: Date
}

export type NovoClienteInput = Pick<ClienteFinal, 'nome'> &
  Partial<Pick<ClienteFinal, 'email' | 'telefone' | 'documento' | 'endereco' | 'cidade' | 'estado' | 'metadados'>>
