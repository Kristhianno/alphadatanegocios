/**
 * Carrega a `Conta` ao vivo do banco e a anexa em `req.conta`.
 * tipoNegocio e status NÃO viajam no JWT: tipoNegocio pode ser definido
 * bem depois do login (POST /auth/selecionar-tipo-negocio), e uma conta
 * pode ser suspensa a qualquer momento — confiar nesses dois campos
 * "congelados" no token (válido por 7 dias) deixaria a suspensão de
 * uma conta sem efeito prático até o token expirar.
 */
import type { NextFunction, Request, Response } from 'express'
import { supabase } from '../config/database.config.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import type { TipoNegocio } from '../models/User.js'
import { ErroNaoAutorizado, ErroNaoEncontrado, ErroProibido } from '../errors/AppError.js'

const contas = new ContaRepository(supabase)

export async function carregarContexto(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.usuarioAutenticado) throw new ErroNaoAutorizado('Autenticação necessária.')

  const conta = await contas.buscarPorId(req.usuarioAutenticado.contaId)
  if (!conta) throw new ErroNaoEncontrado('Conta', req.usuarioAutenticado.contaId)
  if (conta.status !== 'ativo') throw new ErroProibido('Esta conta está suspensa ou cancelada.')

  req.conta = conta
  next()
}

/** Restringe a rota a contas de um(ns) vertical(is) específico(s) — sempre depois de {@link carregarContexto}. */
export function exigirTipoNegocio(...tipos: readonly TipoNegocio[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.conta) throw new ErroNaoAutorizado('Contexto de negócio não carregado.')
    if (!req.conta.tipoNegocio) {
      throw new ErroProibido('Esta conta ainda não escolheu um tipo de negócio (POST /auth/selecionar-tipo-negocio).')
    }
    if (!tipos.includes(req.conta.tipoNegocio)) {
      throw new ErroProibido(`Este recurso está disponível apenas para contas do tipo: ${tipos.join(', ')}.`)
    }
    next()
  }
}
