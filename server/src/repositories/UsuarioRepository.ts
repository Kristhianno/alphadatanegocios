import type { Cliente } from '../config/database.config.js'
import type { Usuario, UsuarioComCredenciais } from '../models/User.js'
import { Repository, type LinhaBanco } from './Repository.js'
import { ErroPersistencia } from '../errors/AppError.js'

export class UsuarioRepository extends Repository<Usuario> {
  constructor(private readonly clienteTipado: Cliente) {
    super(clienteTipado, 'usuarios')
  }

  /** Único ponto do sistema que lê senha_hash — usado apenas pelo fluxo de login. Tabela literal, então o client tipado por Database funciona bem aqui. */
  async buscarComCredenciaisPorEmail(email: string): Promise<UsuarioComCredenciais | null> {
    const { data, error } = await this.clienteTipado.from('usuarios').select('*').eq('email', email).maybeSingle()
    if (error) throw new ErroPersistencia('usuarios', 'buscarComCredenciaisPorEmail', error)
    if (!data) return null
    return { ...this.paraDominio(data), senhaHash: data.senha_hash }
  }

  protected paraDominio(linha: LinhaBanco): Usuario {
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      authUserId: (linha['auth_user_id'] as string) ?? null,
      email: linha['email'] as string,
      nome: linha['nome'] as string,
      papel: linha['papel'] as Usuario['papel'],
      clienteId: (linha['cliente_id'] as string) ?? null,
      status: linha['status'] as Usuario['status'],
      ultimoLoginEm: linha['ultimo_login_em'] ? new Date(linha['ultimo_login_em'] as string) : null,
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados['contaId'] !== undefined) linha['conta_id'] = dados['contaId']
    if (dados['email'] !== undefined) linha['email'] = dados['email']
    if (dados['nome'] !== undefined) linha['nome'] = dados['nome']
    if (dados['papel'] !== undefined) linha['papel'] = dados['papel']
    if (dados['clienteId'] !== undefined) linha['cliente_id'] = dados['clienteId']
    if (dados['status'] !== undefined) linha['status'] = dados['status']
    if (dados['senhaHash'] !== undefined) linha['senha_hash'] = dados['senhaHash']
    if (dados['ultimoLoginEm'] !== undefined) linha['ultimo_login_em'] = dados['ultimoLoginEm']
    return linha
  }
}
