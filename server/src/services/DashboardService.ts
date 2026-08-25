/**
 * Resumo agregado pro dashboard inicial. Não fazia parte da lista de
 * services da Tarefa 3 — puxado pra cá agora porque dashboard.routes.ts
 * (Tarefa 4) não tem pra onde ir sem ele, e uma rota falar direto com o
 * Supabase quebraria a camada rota → service → repository que todo o
 * resto do backend segue.
 */
import type { Cliente } from '../config/database.config.js'
import type { Conta } from '../models/User.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { ErroNaoEncontrado, ErroPersistencia } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

export interface ContagemPorStatus {
  total: number
  porStatus: Record<string, number>
}

export interface ResumoDashboard {
  conta: Conta
  agendamentos: ContagemPorStatus
  ordensServico: ContagemPorStatus
}

export class DashboardService {
  private readonly usuarios: UsuarioRepository
  private readonly contas: ContaRepository

  constructor(private readonly client: Cliente) {
    this.usuarios = new UsuarioRepository(client)
    this.contas = new ContaRepository(client)
  }

  async obterResumo(userId: string): Promise<ResumoDashboard> {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    const conta = await this.contas.buscarPorId(usuario.contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', usuario.contaId)

    const [agendamentos, ordensServico] = await Promise.all([
      this.contarPorStatus('agendamentos', usuario.contaId),
      this.contarPorStatus('ordens_servico', usuario.contaId),
    ])

    logger.debug({ contaId: usuario.contaId }, 'Resumo de dashboard calculado.')
    return { conta, agendamentos, ordensServico }
  }

  /**
   * Lê só a coluna `status` (sem GROUP BY/RPC) e agrega em JS. Adequado
   * pro volume de uma única conta; se o volume crescer muito, isso
   * deveria virar uma view materializada ou função Postgres — mesma
   * ressalva de escala já registrada em ConfeitariaService/ManutencaoService
   * pras atualizações de estoque não-atômicas.
   */
  private async contarPorStatus(tabela: 'agendamentos' | 'ordens_servico', contaId: string): Promise<ContagemPorStatus> {
    const { data, error } = await this.client.from(tabela).select('status').eq('conta_id', contaId)
    if (error) throw new ErroPersistencia(tabela, 'contarPorStatus', error)

    const porStatus: Record<string, number> = {}
    for (const linha of data) {
      porStatus[linha.status] = (porStatus[linha.status] ?? 0) + 1
    }
    return { total: data.length, porStatus }
  }
}
