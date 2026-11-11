import type { Cliente } from '../config/database.config.js'
import type { LeadCrm } from '../models/LeadCrm.js'
import { Repository, type LinhaBanco } from './Repository.js'

const CAMPOS: Record<string, string> = {
  contaId: 'conta_id',
  nome: 'nome',
  telefone: 'telefone',
  email: 'email',
  tipoEvento: 'tipo_evento',
  dataEvento: 'data_evento',
  convidados: 'convidados',
  valorEstimado: 'valor_estimado',
  origem: 'origem',
  etapa: 'etapa',
  resultado: 'resultado',
  observacoes: 'observacoes',
  posicao: 'posicao',
  ultimoContatoEm: 'ultimo_contato_em',
}

export class LeadCrmRepository extends Repository<LeadCrm> {
  constructor(client: Cliente) {
    super(client, 'crm_leads')
  }

  protected paraDominio(linha: LinhaBanco): LeadCrm {
    const numero = (v: unknown) => (v === null || v === undefined ? null : Number(v))
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      nome: linha['nome'] as string,
      telefone: (linha['telefone'] as string) ?? null,
      email: (linha['email'] as string) ?? null,
      tipoEvento: (linha['tipo_evento'] as string) ?? null,
      dataEvento: (linha['data_evento'] as string) ?? null,
      convidados: numero(linha['convidados']),
      valorEstimado: numero(linha['valor_estimado']),
      origem: linha['origem'] as LeadCrm['origem'],
      etapa: linha['etapa'] as LeadCrm['etapa'],
      resultado: (linha['resultado'] as LeadCrm['resultado']) ?? null,
      observacoes: (linha['observacoes'] as string) ?? null,
      posicao: Number(linha['posicao'] ?? 0),
      ultimoContatoEm: linha['ultimo_contato_em'] ? new Date(linha['ultimo_contato_em'] as string) : null,
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
  }

  protected paraLinha(dados: Record<string, unknown>): LinhaBanco {
    const linha: LinhaBanco = {}
    for (const [campo, coluna] of Object.entries(CAMPOS)) {
      if (dados[campo] !== undefined) linha[coluna] = dados[campo]
    }
    return linha
  }
}
