/**
 * Financeiro — módulo genérico de lançamentos (receita/despesa),
 * restrito à equipe interna. Quem fecha essa fronteira é a rota
 * (`requererPapel('admin', 'gestor')` em financeiro.routes.ts), não
 * este service — mesmo padrão de ManutencaoService/ContratoService.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { LancamentoFinanceiro } from '../models/LancamentoFinanceiro.js'
import { LancamentoFinanceiroRepository } from '../repositories/LancamentoFinanceiroRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { ErroNaoEncontrado, ErroValidacao } from '../errors/AppError.js'
import { arredondarMoeda } from '../utils/calculadores.js'
import { logger } from '../utils/logger.js'

export interface FiltrosLancamentoFinanceiro {
  tipo?: LancamentoFinanceiro['tipo']
  status?: LancamentoFinanceiro['status']
}

export interface ResumoFinanceiro {
  totalReceitas: number
  totalDespesas: number
  saldo: number
}

const schemaCriarLancamento = z.object({
  tipo: z.enum(['receita', 'despesa']),
  categoria: z.string().trim().min(1).optional(),
  descricao: z.string().trim().min(2, 'Descreva o lançamento com ao menos 2 caracteres.'),
  valor: z.number().positive('O valor precisa ser maior que zero.'),
  referenciaTipo: z.string().trim().min(1).optional(),
  referenciaId: z.string().uuid().optional(),
  dataPrevista: z.coerce.date().optional(),
})

export class LancamentoFinanceiroService {
  private readonly lancamentos: LancamentoFinanceiroRepository
  private readonly usuarios: UsuarioRepository

  constructor(client: Cliente) {
    this.lancamentos = new LancamentoFinanceiroRepository(client)
    this.usuarios = new UsuarioRepository(client)
  }

  async listar(userId: string, filtros: FiltrosLancamentoFinanceiro = {}): Promise<LancamentoFinanceiro[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const filtroBanco: Record<string, unknown> = { conta_id: usuario.contaId }
    if (filtros.tipo) filtroBanco['tipo'] = filtros.tipo
    if (filtros.status) filtroBanco['status'] = filtros.status
    return this.lancamentos.listar(filtroBanco, { ordenarPor: 'criado_em', ascendente: false })
  }

  /** Soma só os lançamentos com status "pago" — pendente/cancelado não entram no saldo realizado. */
  async resumo(userId: string): Promise<ResumoFinanceiro> {
    const pagos = await this.listar(userId, { status: 'pago' })
    const totalReceitas = arredondarMoeda(pagos.filter((l) => l.tipo === 'receita').reduce((soma, l) => soma + l.valor, 0))
    const totalDespesas = arredondarMoeda(pagos.filter((l) => l.tipo === 'despesa').reduce((soma, l) => soma + l.valor, 0))
    return { totalReceitas, totalDespesas, saldo: arredondarMoeda(totalReceitas - totalDespesas) }
  }

  async criar(userId: string, dados: unknown): Promise<LancamentoFinanceiro> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const validado = schemaCriarLancamento.parse(dados)

    const lancamento = await this.lancamentos.criar({
      contaId: usuario.contaId,
      tipo: validado.tipo,
      categoria: validado.categoria ?? null,
      descricao: validado.descricao,
      valor: validado.valor,
      referenciaTipo: validado.referenciaTipo ?? null,
      referenciaId: validado.referenciaId ?? null,
      status: 'pendente', // explícito, não deixado pro default da coluna
      dataPrevista: validado.dataPrevista ?? null,
    })

    logger.info({ lancamentoId: lancamento.id, tipo: lancamento.tipo, valor: lancamento.valor }, 'Lançamento financeiro criado.')
    return lancamento
  }

  async marcarPago(lancamentoId: string): Promise<LancamentoFinanceiro> {
    const lancamento = await this.buscarLancamentoOuFalhar(lancamentoId)
    if (lancamento.status !== 'pendente') {
      throw new ErroValidacao(`Só é possível marcar como pago um lançamento "pendente" (atual: "${lancamento.status}").`)
    }
    const atualizado = await this.lancamentos.atualizar(lancamentoId, { status: 'pago', dataPagamento: new Date() })
    logger.info({ lancamentoId }, 'Lançamento financeiro marcado como pago.')
    return atualizado
  }

  async cancelar(lancamentoId: string): Promise<LancamentoFinanceiro> {
    const lancamento = await this.buscarLancamentoOuFalhar(lancamentoId)
    if (lancamento.status === 'cancelado') {
      throw new ErroValidacao('Este lançamento já está cancelado.')
    }
    const atualizado = await this.lancamentos.atualizar(lancamentoId, { status: 'cancelado' })
    logger.info({ lancamentoId }, 'Lançamento financeiro cancelado.')
    return atualizado
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarLancamentoOuFalhar(lancamentoId: string): Promise<LancamentoFinanceiro> {
    const lancamento = await this.lancamentos.buscarPorId(lancamentoId)
    if (!lancamento) throw new ErroNaoEncontrado('Lançamento financeiro', lancamentoId)
    return lancamento
  }
}
