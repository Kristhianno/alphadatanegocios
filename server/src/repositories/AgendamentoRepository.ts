import type { Cliente } from '../config/database.config.js'
import type { Agendamento } from '../models/Agendamento.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class AgendamentoRepository extends Repository<Agendamento> {
  constructor(client: Cliente) {
    super(client, 'agendamentos')
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
