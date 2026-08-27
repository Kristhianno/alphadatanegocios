/**
 * Contratos — hoje só lê (isolado por cliente) e permite o próprio
 * cliente assinar um contrato que já foi enviado. Não existe ainda
 * nenhum jeito de gerar um contrato (isso nasceria vinculado a um
 * agendamento/evento/sessão/pedido/chamado real, ver referenciaTipo em
 * models/Contrato.ts) — fica pra quando essa necessidade aparecer.
 */
import type { Cliente } from '../config/database.config.js'
import type { Contrato } from '../models/Contrato.js'
import { ContratoRepository } from '../repositories/ContratoRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { ErroNaoEncontrado, ErroProibido, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

export interface FiltrosContrato {
  status?: Contrato['status']
}

export class ContratoService {
  private readonly contratos: ContratoRepository
  private readonly usuarios: UsuarioRepository

  constructor(client: Cliente) {
    this.contratos = new ContratoRepository(client)
    this.usuarios = new UsuarioRepository(client)
  }

  /**
   * Lista contratos da conta do usuário logado — se quem chama tem
   * papel 'cliente', filtra automaticamente só os contratos dele (mesmo
   * padrão de ManutencaoService.listarChamados: nunca deixa um cliente
   * listar contratos de outro cliente da mesma conta).
   */
  async listarContratos(userId: string, filtros: FiltrosContrato = {}): Promise<Contrato[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const filtroBanco: Record<string, unknown> = { conta_id: usuario.contaId }
    if (filtros.status) filtroBanco['status'] = filtros.status

    if (usuario.papel === 'cliente') {
      if (!usuario.clienteId) return []
      filtroBanco['cliente_id'] = usuario.clienteId
    }

    return this.contratos.listar(filtroBanco, { ordenarPor: 'criado_em', ascendente: false })
  }

  /** O próprio cliente assina — clienteId sempre vem do JWT, nunca do body, pro mesmo motivo documentado em manutencao.routes.ts. */
  async assinarContrato(contratoId: string, clienteId: string): Promise<Contrato> {
    const contrato = await this.buscarContratoOuFalhar(contratoId)
    if (contrato.clienteId !== clienteId) {
      throw new ErroProibido('Este contrato não pertence a este cliente.')
    }
    if (contrato.status !== 'enviado') {
      throw new ErroValidacao(`Só é possível assinar um contrato com status "enviado" (atual: "${contrato.status}").`)
    }

    const assinado = await this.contratos.atualizar(contratoId, { status: 'assinado', assinadoEm: new Date() })
    logger.info({ contratoId, clienteId }, 'Contrato assinado pelo cliente.')
    return assinado
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarContratoOuFalhar(contratoId: string): Promise<Contrato> {
    const contrato = await this.contratos.buscarPorId(contratoId)
    if (!contrato) throw new ErroNaoEncontrado('Contrato', contratoId)
    return contrato
  }
}
