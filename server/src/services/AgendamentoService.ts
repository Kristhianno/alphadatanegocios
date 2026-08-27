/**
 * Service genérico de agendamentos — usado por todos os verticais.
 * A validação específica por tipo de negócio já está em
 * models/Agendamento.ts (Strategy pattern); este service só orquestra
 * carregamento de dados + chamada da validação + persistência.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { Agendamento, NovoAgendamentoInput, StatusAgendamento } from '../models/Agendamento.js'
import { transicionarStatus, validarAgendamento } from '../models/Agendamento.js'
import type { TipoNegocio } from '../models/User.js'
import { AgendamentoRepository } from '../repositories/AgendamentoRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { ErroNaoEncontrado, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const schemaCriarAgendamento = z.object({
  clienteId: z.string().uuid(),
  servicoId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
  dataHoraInicio: z.coerce.date(),
  dataHoraFim: z.coerce.date().optional(),
  endereco: z.string().optional(),
  valorEstimado: z.number().nonnegative().optional(),
  observacoes: z.string().optional(),
  metadados: z.record(z.string(), z.unknown()).optional(),
})

export interface FiltrosAgendamento {
  status?: StatusAgendamento
  clienteId?: string
  responsavelId?: string
}

export class AgendamentoService {
  private readonly agendamentos: AgendamentoRepository
  private readonly usuarios: UsuarioRepository

  constructor(client: Cliente) {
    this.agendamentos = new AgendamentoRepository(client)
    this.usuarios = new UsuarioRepository(client)
  }

  async criarAgendamento(userId: string, tipoNegocio: TipoNegocio, dados: unknown): Promise<Agendamento> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarAgendamento.parse(dados)

    const input: NovoAgendamentoInput = {
      contaId: usuario.contaId,
      tipoNegocio,
      clienteId: validado.clienteId,
      dataHoraInicio: validado.dataHoraInicio,
      ...(validado.servicoId !== undefined && { servicoId: validado.servicoId }),
      ...(validado.responsavelId !== undefined && { responsavelId: validado.responsavelId }),
      ...(validado.dataHoraFim !== undefined && { dataHoraFim: validado.dataHoraFim }),
      ...(validado.endereco !== undefined && { endereco: validado.endereco }),
      ...(validado.valorEstimado !== undefined && { valorEstimado: validado.valorEstimado }),
      ...(validado.observacoes !== undefined && { observacoes: validado.observacoes }),
      ...(validado.metadados !== undefined && { metadados: validado.metadados }),
    }

    const erros = validarAgendamento(input)
    if (erros.length > 0) {
      throw new ErroValidacao('Agendamento inválido para o tipo de negócio informado.', erros)
    }

    const agendamento = await this.agendamentos.criar({ ...input, status: 'agendado' })
    logger.info({ agendamentoId: agendamento.id, tipoNegocio }, 'Agendamento criado.')
    return agendamento
  }

  /**
   * Lista agendamentos da conta do usuário logado — se quem chama tem
   * papel 'cliente', o filtro de cliente_id vem sempre do próprio
   * usuário (nunca do parâmetro `filtros.clienteId`), pro mesmo motivo
   * documentado em ManutencaoService.listarChamados: um cliente não
   * pode listar agendamentos de outro cliente da mesma conta.
   */
  async listarAgendamentos(userId: string, filtros: FiltrosAgendamento = {}): Promise<Agendamento[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const filtroBanco: Record<string, unknown> = { conta_id: usuario.contaId }
    if (filtros.status) filtroBanco['status'] = filtros.status
    if (filtros.responsavelId) filtroBanco['responsavel_id'] = filtros.responsavelId

    if (usuario.papel === 'cliente') {
      if (!usuario.clienteId) return []
      filtroBanco['cliente_id'] = usuario.clienteId
    } else if (filtros.clienteId) {
      filtroBanco['cliente_id'] = filtros.clienteId
    }

    return this.agendamentos.listar(filtroBanco, { ordenarPor: 'data_hora_inicio', ascendente: true })
  }

  async atualizarStatus(agendamentoId: string, novoStatus: StatusAgendamento): Promise<Agendamento> {
    const agendamento = await this.buscarAgendamentoOuFalhar(agendamentoId)
    const atualizado = transicionarStatus(agendamento, novoStatus)
    const salvo = await this.agendamentos.atualizar(agendamentoId, { status: atualizado.status })
    logger.info({ agendamentoId, de: agendamento.status, para: novoStatus }, 'Status do agendamento alterado.')
    return salvo
  }

  async confirmarAgendamento(agendamentoId: string): Promise<Agendamento> {
    return this.atualizarStatus(agendamentoId, 'confirmado')
  }

  async cancelarAgendamento(agendamentoId: string, motivo: string): Promise<Agendamento> {
    if (!motivo || motivo.trim().length === 0) {
      throw new ErroValidacao('Informe o motivo do cancelamento.')
    }
    const agendamento = await this.buscarAgendamentoOuFalhar(agendamentoId)
    transicionarStatus(agendamento, 'cancelado') // valida a transição antes de gravar
    const salvo = await this.agendamentos.atualizar(agendamentoId, { status: 'cancelado', motivoCancelamento: motivo })
    logger.info({ agendamentoId, motivo }, 'Agendamento cancelado.')
    return salvo
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarAgendamentoOuFalhar(agendamentoId: string): Promise<Agendamento> {
    const agendamento = await this.agendamentos.buscarPorId(agendamentoId)
    if (!agendamento) throw new ErroNaoEncontrado('Agendamento', agendamentoId)
    return agendamento
  }
}
