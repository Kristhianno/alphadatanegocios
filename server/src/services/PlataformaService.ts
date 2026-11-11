/**
 * Visão do dono da plataforma (papel `superadmin`): todas as contas
 * (tenants), seus admins, situação da assinatura e os leads da landing.
 *
 * Única parte do sistema que lê dados de MAIS DE UMA conta — por isso
 * só é exposto por routes/plataforma.routes.ts, atrás de
 * `requererPapel('superadmin')`. A conta interna do próprio superadmin
 * (configuracoesGerais.interna === true) é escondida de tudo aqui.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { Conta, StatusConta, Usuario } from '../models/User.js'
import type { Lead } from '../models/Lead.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { LeadRepository } from '../repositories/LeadRepository.js'
import { trialAindaAtivo } from '../utils/assinatura.js'
import { ErroNaoEncontrado, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

/** Em que pé está a cobrança da conta — derivado, nunca gravado. */
export type SituacaoAssinatura = 'pagante' | 'em_teste' | 'pendente' | 'sem_plano'

export interface ContaPlataforma {
  id: string
  nomeEmpresa: string
  tipoNegocio: Conta['tipoNegocio']
  /** Rótulo do nicho escolhido no onboarding (ex: "Personagens Vivos") — `configuracoesGerais.segmentoEscolhido`. */
  nicho: string | null
  plano: Conta['plano']
  cicloCobranca: Conta['cicloCobranca']
  status: StatusConta
  situacaoAssinatura: SituacaoAssinatura
  trialTerminaEm: Date | null
  emailAdmin: string | null
  totalUsuarios: number
  ultimoLoginEm: Date | null
  criadoEm: Date
}

export interface ResumoPlataforma {
  totalContas: number
  contasUltimos30Dias: number
  porSituacao: Record<SituacaoAssinatura, number>
  porNicho: { nicho: string; total: number }[]
  porPlano: Record<string, number>
  totalUsuarios: number
  totalLeads: number
  leadsUltimos30Dias: number
}

const schemaStatusConta = z.enum(['ativo', 'suspenso', 'cancelado'])

const TRINTA_DIAS_MS = 30 * 24 * 60 * 60 * 1000

export function contaEhInterna(conta: Pick<Conta, 'configuracoesGerais'>): boolean {
  return conta.configuracoesGerais['interna'] === true
}

export function situacaoAssinatura(conta: Pick<Conta, 'stripeSubscriptionId' | 'status' | 'trialTerminaEm' | 'assinaturaPendente'>): SituacaoAssinatura {
  if (conta.stripeSubscriptionId && conta.status === 'ativo') return 'pagante'
  if (conta.assinaturaPendente) return 'pendente'
  if (trialAindaAtivo(conta.trialTerminaEm)) return 'em_teste'
  return 'sem_plano'
}

function nichoDaConta(conta: Conta): string | null {
  const nicho = conta.configuracoesGerais['segmentoEscolhido']
  return typeof nicho === 'string' && nicho.trim() ? nicho : null
}

export class PlataformaService {
  private readonly contas: ContaRepository
  private readonly usuarios: UsuarioRepository
  private readonly leads: LeadRepository

  constructor(client: Cliente) {
    this.contas = new ContaRepository(client)
    this.usuarios = new UsuarioRepository(client)
    this.leads = new LeadRepository(client)
  }

  /** Todas as contas de clientes (sem a interna), mais recentes primeiro. */
  async listarContas(): Promise<ContaPlataforma[]> {
    const [contas, usuarios] = await Promise.all([
      this.contas.listar({}, { ordenarPor: 'criado_em', ascendente: false }),
      this.usuarios.listar(),
    ])

    const usuariosPorConta = new Map<string, Usuario[]>()
    for (const u of usuarios) {
      const lista = usuariosPorConta.get(u.contaId) ?? []
      lista.push(u)
      usuariosPorConta.set(u.contaId, lista)
    }

    return contas
      .filter((conta) => !contaEhInterna(conta))
      .map((conta) => {
        const daConta = usuariosPorConta.get(conta.id) ?? []
        const admin = daConta.find((u) => u.papel === 'admin') ?? null
        const ultimoLoginEm = daConta.reduce<Date | null>(
          (maisRecente, u) => (u.ultimoLoginEm && (!maisRecente || u.ultimoLoginEm > maisRecente) ? u.ultimoLoginEm : maisRecente),
          null,
        )
        return {
          id: conta.id,
          nomeEmpresa: conta.nomeEmpresa,
          tipoNegocio: conta.tipoNegocio,
          nicho: nichoDaConta(conta),
          plano: conta.plano,
          cicloCobranca: conta.cicloCobranca,
          status: conta.status,
          situacaoAssinatura: situacaoAssinatura(conta),
          trialTerminaEm: conta.trialTerminaEm,
          emailAdmin: admin?.email ?? null,
          totalUsuarios: daConta.length,
          ultimoLoginEm,
          criadoEm: conta.criadoEm,
        }
      })
  }

  async listarLeads(): Promise<Lead[]> {
    return this.leads.listar({}, { ordenarPor: 'criado_em', ascendente: false })
  }

  async resumo(): Promise<ResumoPlataforma> {
    const [contas, leads] = await Promise.all([this.listarContas(), this.listarLeads()])
    const limite = Date.now() - TRINTA_DIAS_MS

    const porSituacao: Record<SituacaoAssinatura, number> = { pagante: 0, em_teste: 0, pendente: 0, sem_plano: 0 }
    const porPlano: Record<string, number> = {}
    const contagemNicho = new Map<string, number>()
    for (const conta of contas) {
      porSituacao[conta.situacaoAssinatura] += 1
      porPlano[conta.plano] = (porPlano[conta.plano] ?? 0) + 1
      const nicho = conta.nicho ?? 'Não escolhido'
      contagemNicho.set(nicho, (contagemNicho.get(nicho) ?? 0) + 1)
    }

    return {
      totalContas: contas.length,
      contasUltimos30Dias: contas.filter((c) => c.criadoEm.getTime() >= limite).length,
      porSituacao,
      porNicho: [...contagemNicho.entries()].map(([nicho, total]) => ({ nicho, total })).sort((a, b) => b.total - a.total),
      porPlano,
      totalUsuarios: contas.reduce((soma, c) => soma + c.totalUsuarios, 0),
      totalLeads: leads.length,
      leadsUltimos30Dias: leads.filter((l) => l.criadoEm.getTime() >= limite).length,
    }
  }

  /** Suspender trava o acesso de toda a conta na hora (carregarContexto relê o status a cada requisição). */
  async alterarStatusConta(contaId: string, status: unknown): Promise<ContaPlataforma> {
    const novoStatus = schemaStatusConta.parse(status)
    const conta = await this.contas.buscarPorId(contaId)
    if (!conta || contaEhInterna(conta)) throw new ErroNaoEncontrado('Conta', contaId)
    if (conta.status === novoStatus) throw new ErroValidacao(`A conta já está com status "${novoStatus}".`)

    await this.contas.atualizar(contaId, { status: novoStatus })
    logger.info({ contaId, de: conta.status, para: novoStatus }, 'Status da conta alterado pelo superadmin.')

    const atualizada = (await this.listarContas()).find((c) => c.id === contaId)
    if (!atualizada) throw new ErroNaoEncontrado('Conta', contaId)
    return atualizada
  }
}
