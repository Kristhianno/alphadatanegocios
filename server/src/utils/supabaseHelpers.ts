import { ErroPersistencia } from '../errors/AppError.js'

/**
 * Açúcar sintático para o padrão `const { data, error } = await ...; if
 * (error) throw ...`. Usado pelos services de vertical para tabelas que
 * não justificam uma classe Repository própria (só um service as
 * consome) — o Repository genérico continua sendo o caminho para as
 * entidades compartilhadas (contas, usuarios, servicos, agendamentos).
 *
 * T é inferido diretamente da query passada (agora tipada via
 * `Database`, gerado do schema real) — sem precisar redeclarar a forma
 * da linha aqui.
 */
export async function executarOuFalhar<T>(
  tabela: string,
  operacao: string,
  promessa: PromiseLike<{ data: T | null; error: unknown }>
): Promise<T> {
  const { data, error } = await promessa
  if (error) throw new ErroPersistencia(tabela, operacao, error)
  if (data === null) throw new ErroPersistencia(tabela, operacao, new Error('Resposta vazia do banco.'))
  return data
}
