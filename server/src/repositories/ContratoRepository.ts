import type { Cliente } from '../config/database.config.js'
import type { Contrato } from '../models/Contrato.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class ContratoRepository extends Repository<Contrato> {
  constructor(client: Cliente) {
    super(client, 'contratos')
  }

  protected paraDominio(linha: LinhaBanco): Contrato {
    return {
      id: linha['id'] as string,
      contaId: linha['conta_id'] as string,
      tipoNegocio: linha['tipo_negocio'] as Contrato['tipoNegocio'],
      clienteId: linha['cliente_id'] as string,
      referenciaTipo: linha['referencia_tipo'] as Contrato['referenciaTipo'],
      referenciaId: linha['referencia_id'] as string,
      titulo: linha['titulo'] as string,
      conteudo: (linha['conteudo'] as string) ?? null,
      valorTotal: linha['valor_total'] !== null && linha['valor_total'] !== undefined ? Number(linha['valor_total']) : null,
      status: linha['status'] as Contrato['status'],
      assinadoEm: linha['assinado_em'] ? new Date(linha['assinado_em'] as string) : null,
      arquivoPdfUrl: (linha['arquivo_pdf_url'] as string) ?? null,
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
    if (dados['referenciaTipo'] !== undefined) linha['referencia_tipo'] = dados['referenciaTipo']
    if (dados['referenciaId'] !== undefined) linha['referencia_id'] = dados['referenciaId']
    if (dados['titulo'] !== undefined) linha['titulo'] = dados['titulo']
    if (dados['conteudo'] !== undefined) linha['conteudo'] = dados['conteudo']
    if (dados['valorTotal'] !== undefined) linha['valor_total'] = dados['valorTotal']
    if (dados['status'] !== undefined) linha['status'] = dados['status']
    if (dados['assinadoEm'] !== undefined) linha['assinado_em'] = (dados['assinadoEm'] as Date).toISOString()
    if (dados['arquivoPdfUrl'] !== undefined) linha['arquivo_pdf_url'] = dados['arquivoPdfUrl']
    if (dados['metadados'] !== undefined) linha['metadados'] = dados['metadados']
    return linha
  }
}
