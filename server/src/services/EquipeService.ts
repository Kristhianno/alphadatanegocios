/**
 * Gestão da equipe interna com login (papel gestor/tecnico) de uma
 * conta. A criação em si acontece via convite (ver ConvitesService,
 * mesmo padrão do convite de cliente) — este service cobre o que vem
 * depois: listar quem já está na equipe e desativar um acesso.
 */
import type { Cliente } from '../config/database.config.js'
import type { Usuario } from '../models/User.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { ErroNaoEncontrado, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

export class EquipeService {
  private readonly usuarios: UsuarioRepository

  constructor(client: Cliente) {
    this.usuarios = new UsuarioRepository(client)
  }

  async listarEquipe(userId: string): Promise<Usuario[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    return this.usuarios.listarEquipePorConta(usuario.contaId)
  }

  /** Soft-delete — mesma regra do resto do sistema (ver ClienteService.desativarCliente). Não deixa desativar quem não é gestor/tecnico, pra essa rota não virar uma forma indireta de suspender um admin ou cliente. */
  async desativarMembro(userId: string, membroId: string): Promise<Usuario> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const membro = await this.usuarios.buscarPorId(membroId)
    if (!membro || membro.contaId !== usuario.contaId) throw new ErroNaoEncontrado('Membro da equipe', membroId)
    if (membro.papel !== 'gestor' && membro.papel !== 'tecnico') {
      throw new ErroValidacao('Este login não é um membro de equipe (gestor/técnico).')
    }
    const atualizado = await this.usuarios.atualizar(membroId, { status: 'inativo' })
    logger.info({ contaId: usuario.contaId, membroId }, 'Membro de equipe desativado.')
    return atualizado
  }

  private async buscarUsuarioOuFalhar(userId: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }
}
