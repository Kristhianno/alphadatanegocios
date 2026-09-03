import type { Cliente } from '../config/database.config.js'
import type { Agendamento } from '../models/Agendamento.js'
import { fimEfetivoParaComparacao } from '../models/Agendamento.js'
import { ErroPersistencia } from '../errors/AppError.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class AgendamentoRepository extends Repository<Agendamento> {
  constructor(client: Cliente) {
    super(client, 'agendamentos')
  }

  /**
   * Agendamentos não cancelados da conta cujo intervalo [dataHoraInicio,
   * fim-efetivo) cruza com [inicio, fim) — base tanto da checagem de
   * conflito na criação quanto do endpoint de disponibilidade do
   * calendário. Filtra em memória (não via `.lt`/`.gt`/`.neq` do
   * Postgrest) de propósito: o fake de Supabase usado nos testes
   * (tests/helpers/fakeSupabase.ts) só implementa eq/in/order/limit, e
   * uma faixa de data não justifica fazer esse fake crescer.
   */
  async buscarConflitantes(
    contaId: string,
    inicio: Date,
    fim: Date,
    opcoes: { responsavelId?: string; excluirId?: string } = {}
  ): Promise<Agendamento[]> {
    const { data, error } = await this.client.from(this.tabela).select('*').eq('conta_id', contaId)
    if (error) throw new ErroPersistencia(this.tabela, 'buscarConflitantes', error)
    return (data ?? [])
      .map((linha) => this.paraDominio(linha))
      .filter((ag) => ag.status !== 'cancelado')
      .filter((ag) => !opcoes.excluirId || ag.id !== opcoes.excluirId)
      .filter((ag) => !opcoes.responsavelId || ag.responsavelId === opcoes.responsavelId)
      .filter((ag) => ag.dataHoraInicio < fim && fimEfetivoParaComparacao(ag) > inicio)
  }

  protected paraDominio(linha: LinhaBanco): Agendamento {
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      tipoNegocio: linha['tipo_negocio'] as Agendamento['tipoNegocio'],
      clienteId: linha['cliente_id'] as string,
      servicoId: (linha['servico_id'] as string) ?? null,
      responsavelId: (linha['responsavel_id'] as string) ?? null,
      dataHoraInicio: new Date(linha['data_hora_inicio'] as string),
      dataHoraFim: linha['data_hora_fim'] ? new Date(linha['data_hora_fim'] as string) : null,
      status: linha['status'] as Agendamento['status'],
      endereco: (linha['endereco'] as string) ?? null,
      valorEstimado: (linha['valor_estimado'] as number) ?? null,
      observacoes: (linha['observacoes'] as string) ?? null,
      motivoCancelamento: (linha['motivo_cancelamento'] as string) ?? null,
      metadados: (linha['metadados'] as Record<string, unknown>) ?? {},
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados['contaId'] !== undefined) linha['conta_id'] = dados['contaId']
    if (dados['tipoNegocio'] !== undefined) linha['tipo_negocio'] = dados['tipoNegocio']
    if (dados['clienteId'] !== undefined) linha['cliente_id'] = dados['clienteId']
    if (dados['servicoId'] !== undefined) linha['servico_id'] = dados['servicoId']
    if (dados['responsavelId'] !== undefined) linha['responsavel_id'] = dados['responsavelId']
    if (dados['dataHoraInicio'] !== undefined) linha['data_hora_inicio'] = (dados['dataHoraInicio'] as Date).toISOString()
    if (dados['dataHoraFim'] !== undefined) linha['data_hora_fim'] = (dados['dataHoraFim'] as Date).toISOString()
    if (dados['status'] !== undefined) linha['status'] = dados['status']
    if (dados['endereco'] !== undefined) linha['endereco'] = dados['endereco']
    if (dados['valorEstimado'] !== undefined) linha['valor_estimado'] = dados['valorEstimado']
    if (dados['observacoes'] !== undefined) linha['observacoes'] = dados['observacoes']
    if (dados['motivoCancelamento'] !== undefined) linha['motivo_cancelamento'] = dados['motivoCancelamento']
    if (dados['metadados'] !== undefined) linha['metadados'] = dados['metadados']
    return linha
  }
}
