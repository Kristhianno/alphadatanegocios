/**
 * Carrega a `Conta` ao vivo do banco e a anexa em `c.set('conta', ...)`.
 * tipoNegocio e status NÃO viajam no JWT: tipoNegocio pode ser definido
 * bem depois do login (POST /auth/selecionar-tipo-negocio), e uma conta
 * pode ser suspensa a qualquer momento — confiar nesses dois campos
 * "congelados" no token (válido por 7 dias) deixaria a suspensão de
 * uma conta sem efeito prático até o token expirar.
 */
import type { Context, Next } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import type { TipoNegocio } from '../models/User.js'
import { ErroNaoAutorizado, ErroNaoEncontrado, ErroProibido } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

function contas() { return new ContaRepository(getSupabase()) }

export async function carregarContexto(c: Context<AppEnv>, next: Next): Promise<void> {
  const usuarioAutenticado = c.get('usuarioAutenticado')
  if (!usuarioAutenticado) throw new ErroNaoAutorizado('Autenticação necessária.')

  const conta = await contas().buscarPorId(usuarioAutenticado.contaId)
  if (!conta) throw new ErroNaoEncontrado('Conta', usuarioAutenticado.contaId)
  if (conta.status !== 'ativo') throw new ErroProibido('Esta conta está suspensa ou cancelada.')

  c.set('conta', conta)
  await next()
}

/** Restringe a rota a contas de um(ns) vertical(is) específico(s) — sempre depois de {@link carregarContexto}. */
export function exigirTipoNegocio(...tipos: readonly TipoNegocio[]) {
  return async (c: Context<AppEnv>, next: Next): Promise<void> => {
    const conta = c.get('conta')
    if (!conta) throw new ErroNaoAutorizado('Contexto de negócio não carregado.')
    if (!conta.tipoNegocio) {
      throw new ErroProibido('Esta conta ainda não escolheu um tipo de negócio (POST /auth/selecionar-tipo-negocio).')
    }
    if (!tipos.includes(conta.tipoNegocio)) {
      throw new ErroProibido(`Este recurso está disponível apenas para contas do tipo: ${tipos.join(', ')}.`)
    }
    await next()
  }
}
