/**
 * CRM em kanban (plano Completo): leads de uma conta passando por
 * Novo lead → Primeiro contato → Follow-up → Concluído.
 *
 * Todo método recebe o `contaId` já resolvido pela rota (carregarContexto)
 * e confere que o lead é dessa conta — um id de outra conta responde
 * "não encontrado", nunca vaza que existe.
 *
 * "Parado no follow-up": lead em 'follow_up' cujo último contato (ou a
 * criação, se nunca houve contato) foi há mais de DIAS_ALERTA_FOLLOW_UP
 * dias — mesma régua de 3 dias do follow-up do plano Completo.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import { ETAPAS_LEAD, ORIGENS_LEAD, type EtapaLead, type LeadCrm } from '../models/LeadCrm.js'
import { LeadCrmRepository } from '../repositories/LeadCrmRepository.js'
import { validarTelefoneBr } from '../utils/validadores.js'
import { ErroNaoEncontrado, ErroPersistencia } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

export const DIAS_ALERTA_FOLLOW_UP = 3
const DIA_MS = 24 * 60 * 60 * 1000

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()

const schemaDadosLead = z.object({
  nome: z.string().trim().min(2, 'Informe o nome do lead.').max(120),
  telefone: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()
    .refine((v) => v == null || validarTelefoneBr(v), 'Telefone inválido — informe DDD + número.'),
  email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional()
    .refine((v) => v == null || z.string().email().safeParse(v).success, 'E-mail inválido.'),
  tipoEvento: textoOpcional(80),
  dataEvento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do evento inválida.')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  convidados: z.number().int().min(0).max(100_000).nullable().optional(),
  valorEstimado: z.number().min(0).max(100_000_000).nullable().optional(),
  origem: z.enum(ORIGENS_LEAD).optional(),
  observacoes: textoOpcional(2000),
  resultado: z.enum(['ganho', 'perdido']).nullable().optional(),
})

const schemaCriar = schemaDadosLead.extend({ etapa: z.enum(ETAPAS_LEAD).optional() })
const schemaAtualizar = schemaDadosLead.partial()
const schemaMover = z.object({
  etapa: z.enum(ETAPAS_LEAD),
  posicao: z.number().finite(),
})

export interface ResumoCrm {
  total: number
  porEtapa: Record<EtapaLead, number>
  /** Em follow-up há mais de DIAS_ALERTA_FOLLOW_UP dias sem contato. */
  paradosNoFollowUp: number
  ganhos: number
  perdidos: number
}

export function estaParadoNoFollowUp(lead: Pick<LeadCrm, 'etapa' | 'ultimoContatoEm' | 'criadoEm'>, agora = Date.now()): boolean {
  if (lead.etapa !== 'follow_up') return false
  const referencia = (lead.ultimoContatoEm ?? lead.criadoEm).getTime()
  return agora - referencia > DIAS_ALERTA_FOLLOW_UP * DIA_MS
}

export class CrmService {
  private readonly leads: LeadCrmRepository

  constructor(client: Cliente) {
    this.leads = new LeadCrmRepository(client)
  }

  async listar(contaId: string): Promise<LeadCrm[]> {
    return this.leads.listar({ conta_id: contaId }, { ordenarPor: 'posicao', ascendente: true })
  }

  /** Lead novo entra no TOPO da coluna (posição menor que a de todos os outros dela). */
  async criar(contaId: string, dados: unknown): Promise<LeadCrm> {
    const validado = schemaCriar.parse(dados)
    const etapa = validado.etapa ?? 'novo'
    const daColuna = (await this.listar(contaId)).filter((l) => l.etapa === etapa)
    const posicao = daColuna.length ? Math.min(...daColuna.map((l) => l.posicao)) - 1 : 0

    const lead = await this.leads.criar({
      ...validado,
      contaId,
      etapa,
      posicao,
      origem: validado.origem ?? 'whatsapp',
      resultado: etapa === 'concluido' ? (validado.resultado ?? null) : null,
      ultimoContatoEm: etapa === 'novo' ? null : new Date(),
    })
    logger.info({ contaId, leadId: lead.id }, 'Lead criado no CRM.')
    return lead
  }

  async atualizar(contaId: string, leadId: string, dados: unknown): Promise<LeadCrm> {
    const lead = await this.buscarDaConta(contaId, leadId)
    const validado = schemaAtualizar.parse(dados)
    // Resultado (ganho/perdido) só vale pra lead concluído.
    if (validado.resultado !== undefined && lead.etapa !== 'concluido') validado.resultado = null
    return this.leads.atualizar(leadId, validado)
  }

  /**
   * Arrastar no kanban: troca etapa e/ou posição. Entrar em "Primeiro
   * contato" ou "Follow-up" conta como um contato agora (zera o alerta);
   * sair de "Concluído" limpa o ganho/perdido.
   */
  async mover(contaId: string, leadId: string, dados: unknown): Promise<LeadCrm> {
    const lead = await this.buscarDaConta(contaId, leadId)
    const { etapa, posicao } = schemaMover.parse(dados)

    const atualizacao: Partial<LeadCrm> = { etapa, posicao }
    if (etapa !== lead.etapa) {
      if (etapa === 'primeiro_contato' || etapa === 'follow_up') atualizacao.ultimoContatoEm = new Date()
      if (etapa !== 'concluido') atualizacao.resultado = null
    }
    const movido = await this.leads.atualizar(leadId, atualizacao)
    if (etapa !== lead.etapa) logger.info({ contaId, leadId, de: lead.etapa, para: etapa }, 'Lead mudou de etapa.')
    return movido
  }

  /** "Falei com o cliente agora" — reinicia a contagem do alerta de follow-up. */
  async registrarContato(contaId: string, leadId: string): Promise<LeadCrm> {
    await this.buscarDaConta(contaId, leadId)
    return this.leads.atualizar(leadId, { ultimoContatoEm: new Date() })
  }

  async excluir(contaId: string, leadId: string): Promise<void> {
    await this.buscarDaConta(contaId, leadId)
    await this.leads.deletar(leadId)
    logger.info({ contaId, leadId }, 'Lead excluído do CRM.')
  }

  async resumo(contaId: string): Promise<ResumoCrm> {
    const leads = await this.listar(contaId)
    const porEtapa = Object.fromEntries(ETAPAS_LEAD.map((e) => [e, 0])) as Record<EtapaLead, number>
    for (const lead of leads) porEtapa[lead.etapa] += 1
    return {
      total: leads.length,
      porEtapa,
      paradosNoFollowUp: leads.filter((l) => estaParadoNoFollowUp(l)).length,
      ganhos: leads.filter((l) => l.etapa === 'concluido' && l.resultado === 'ganho').length,
      perdidos: leads.filter((l) => l.etapa === 'concluido' && l.resultado === 'perdido').length,
    }
  }

  /** Versão tolerante pro dashboard: se a tabela ainda não existir (migration pendente), não derruba a tela inteira. */
  async resumoSeDisponivel(contaId: string): Promise<ResumoCrm | null> {
    try {
      return await this.resumo(contaId)
    } catch (erro) {
      if (erro instanceof ErroPersistencia) {
        logger.warn({ contaId }, 'Resumo do CRM indisponível (tabela crm_leads ausente?).')
        return null
      }
      throw erro
    }
  }

  private async buscarDaConta(contaId: string, leadId: string): Promise<LeadCrm> {
    const lead = await this.leads.buscarPorId(leadId)
    if (!lead || lead.contaId !== contaId) throw new ErroNaoEncontrado('Lead', leadId)
    return lead
  }
}
