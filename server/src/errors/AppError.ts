/**
 * Hierarquia de erros da aplicação. Toda falha esperada (validação,
 * não encontrado, conflito, etc.) deve lançar uma subclasse de
 * AppError — nunca um Error genérico — para que o middleware de erro
 * (Tarefa 5) saiba montar a resposta HTTP certa a partir de
 * `statusCode`/`codigo`, sem precisar inspecionar a mensagem.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number
  abstract readonly codigo: string

  constructor(message: string, public readonly causa?: unknown) {
    super(message)
    this.name = new.target.name
  }
}

export class ErroValidacao extends AppError {
  readonly statusCode = 400
  readonly codigo = 'VALIDACAO'

  constructor(message: string, public readonly detalhes?: readonly { campo: string; mensagem: string }[]) {
    super(message)
  }
}

export class ErroNaoEncontrado extends AppError {
  readonly statusCode = 404
  readonly codigo = 'NAO_ENCONTRADO'

  constructor(entidade: string, id: string) {
    super(`${entidade} "${id}" não encontrado(a).`)
  }
}

export class ErroConflito extends AppError {
  readonly statusCode = 409
  readonly codigo = 'CONFLITO'
}

export class ErroNaoAutorizado extends AppError {
  readonly statusCode = 401
  readonly codigo = 'NAO_AUTORIZADO'
}

export class ErroProibido extends AppError {
  readonly statusCode = 403
  readonly codigo = 'PROIBIDO'
}

/** Falha na camada de persistência (Supabase/Postgres) — sempre embrulha o erro original em `causa`. */
export class ErroPersistencia extends AppError {
  readonly statusCode = 500
  readonly codigo = 'PERSISTENCIA'

  constructor(tabela: string, operacao: string, causa: unknown) {
    super(`Falha ao executar "${operacao}" em "${tabela}".`, causa)
  }
}
