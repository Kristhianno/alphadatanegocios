/**
 * Service genérico de catálogo (servicos) — usado por todos os
 * verticais. Constrói o registro certo via {@link ServicoFactory}
 * antes de persistir, garantindo que `metadados` seja compatível com
 * `tipoNegocio` desde a criação.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { NovoServicoInput, Servico } from '../models/Servico.js'
import { ServicoFactory } from '../models/Servico.js'
import type { TipoNegocio } from '../models/User.js'
import { ServicoRepository } from '../repositories/ServicoRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { ErroNaoEncontrado } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const schemaCriarServico = z.object({
  nome: z.string().trim().min(2),
  descricao: z.string().optional(),
  precoBase: z.number().nonnegative().optional(),
  duracaoEstimadaMinutos: z.number().int().positive().optional(),
  metadados: z.record(z.string(), z.unknown()).optional(),
})

const schemaAtualizarServico = z.object({
  nome: z.string().trim().min(2).optional(),
  descricao: z.string().optional(),
  precoBase: z.number().nonnegative().optional(),
  duracaoEstimadaMinutos: z.number().int().positive().optional(),
  metadados: z.record(z.string(), z.unknown()).optional(),
})

export interface FiltrosServico {
  ativo?: boolean
}

export class ServicoService {
  private readonly servicos: ServicoRepository
  private readonly usuarios: UsuarioRepository

  constructor(client: Cliente) {
    this.servicos = new ServicoRepository(client)
    this.usuarios = new UsuarioRepository(client)
  }

  async criarServico(userId: string, tipoNegocio: TipoNegocio, dados: unknown): Promise<Servico> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarServico.parse(dados)

    const input: NovoServicoInput = {
      contaId: usuario.contaId,
      tipoNegocio,
      nome: validado.nome,
      ...(validado.descricao !== undefined && { descricao: validado.descricao }),
      ...(validado.precoBase !== undefined && { precoBase: validado.precoBase }),
      ...(validado.duracaoEstimadaMinutos !== undefined && { duracaoEstimadaMinutos: validado.duracaoEstimadaMinutos }),
      ...(validado.metadados !== undefined && { metadados: validado.metadados }),
    }

    // ServicoFactory decide os defaults (ex: duração padrão do vertical).
    // id/criadoEm/atualizadoEm do rascunho são descartados — o
    // repositório só lê os campos de negócio; o banco gera os dele.
    const rascunho = ServicoFactory.criar('rascunho-descartado', input)
    const servico = await this.servicos.criar({
      contaId: rascunho.contaId,
      tipoNegocio: rascunho.tipoNegocio,
      nome: rascunho.nome,
      descricao: rascunho.descricao,
      precoBase: rascunho.precoBase,
      duracaoEstimadaMinutos: rascunho.duracaoEstimadaMinutos,
      ativo: rascunho.ativo,
      metadados: rascunho.metadados,
    })

    logger.info({ servicoId: servico.id, tipoNegocio }, 'Serviço criado no catálogo.')
    return servico
  }

  async listarServicos(userId: string, filtros: FiltrosServico = {}): Promise<Servico[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const filtroBanco: Record<string, unknown> = { conta_id: usuario.contaId }
    if (filtros.ativo !== undefined) filtroBanco['ativo'] = filtros.ativo
    return this.servicos.listar(filtroBanco, { ordenarPor: 'nome' })
  }

  async atualizarServico(servicoId: string, dados: unknown): Promise<Servico> {
    await this.buscarServicoOuFalhar(servicoId)
    const validado = schemaAtualizarServico.parse(dados)
    const servico = await this.servicos.atualizar(servicoId, validado)
    logger.info({ servicoId }, 'Serviço atualizado.')
    return servico
  }

  async deletarServico(servicoId: string): Promise<void> {
    await this.buscarServicoOuFalhar(servicoId)
    await this.servicos.deletar(servicoId)
    logger.info({ servicoId }, 'Serviço removido do catálogo.')
  }

  async ativarServico(servicoId: string): Promise<Servico> {
    await this.buscarServicoOuFalhar(servicoId)
    return this.servicos.atualizar(servicoId, { ativo: true })
  }

  async desativarServico(servicoId: string): Promise<Servico> {
    await this.buscarServicoOuFalhar(servicoId)
    return this.servicos.atualizar(servicoId, { ativo: false })
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarServicoOuFalhar(servicoId: string): Promise<Servico> {
    const servico = await this.servicos.buscarPorId(servicoId)
    if (!servico) throw new ErroNaoEncontrado('Serviço', servicoId)
    return servico
  }
}
