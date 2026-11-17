/**
 * CRM em kanban (plano Completo): leads de uma conta passando por
 * Primeiro contato → Follow-up → Concluído. Avançar exige marcos do
 * negócio (REQUISITOS_ETAPA): orçamento enviado pra ir ao follow-up;
 * contrato enviado + assinado + sinal pago pra concluir. Concluído =
 * festa fechada: a data fica travada.
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
import {
  CAMPO_MARCO, ETAPAS_LEAD, MARCOS_LEAD, ORIGENS_LEAD, REQUISITOS_ETAPA, ROTULO_ETAPA, ROTULO_MARCO,
  marcosPendentes, type EtapaLead, type LeadCrm,
} from '../models/LeadCrm.js'
import { LeadCrmRepository } from '../repositories/LeadCrmRepository.js'
import { validarTelefoneBr } from '../utils/validadores.js'
import { ErroConflito, ErroNaoEncontrado, ErroPersistencia } from '../errors/AppError.js'
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
})

// 'novo' ainda é aceito na criação (integrações antigas) e vira "Primeiro contato".
const schemaCriar = schemaDadosLead.extend({ etapa: z.enum([...ETAPAS_LEAD, 'novo']).optional() })
const schemaAtualizar = schemaDadosLead.partial()
const schemaMarco = z.object({ marco: z.enum(MARCOS_LEAD), feito: z.boolean() })
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

  /** Lead novo entra em "Primeiro contato", no TOPO da coluna. */
  async criar(contaId: string, dados: unknown): Promise<LeadCrm> {
    const { etapa: etapaPedida, ...validado } = schemaCriar.parse(dados)
    const etapa: EtapaLead = !etapaPedida || etapaPedida === 'novo' ? 'primeiro_contato' : etapaPedida
    if (etapa !== 'primeiro_contato') {
      throw new ErroConflito('Todo lead começa em "Primeiro contato". Ele avança quando o orçamento é enviado.')
    }
    const daColuna = (await this.listar(contaId)).filter((l) => l.etapa === etapa)
    const posicao = daColuna.length ? Math.min(...daColuna.map((l) => l.posicao)) - 1 : 0

    const lead = await this.leads.criar({
      ...validado,
      contaId,
      etapa,
      posicao,
      origem: validado.origem ?? 'whatsapp',
      resultado: null,
      ultimoContatoEm: new Date(),
    })
    logger.info({ contaId, leadId: lead.id }, 'Lead criado no CRM.')
    return lead
  }

  async atualizar(contaId: string, leadId: string, dados: unknown): Promise<LeadCrm> {
    const lead = await this.buscarDaConta(contaId, leadId)
    const validado = schemaAtualizar.parse(dados)
    if (lead.etapa === 'concluido' && validado.dataEvento !== undefined && validado.dataEvento !== lead.dataEvento) {
      throw new ErroConflito('A data desta festa está fechada. Para mudar, volte o card para Follow-up.')
    }
    return this.leads.atualizar(leadId, validado)
  }

  /**
   * Arrastar no kanban: troca etapa e/ou posição. Avançar só com os
   * marcos da etapa de destino cumpridos (e, pra concluir, data da festa
   * definida). Voltar é livre — reabrir um concluído libera a data.
   */
  async mover(contaId: string, leadId: string, dados: unknown): Promise<LeadCrm> {
    const lead = await this.buscarDaConta(contaId, leadId)
    const { etapa, posicao } = schemaMover.parse(dados)

    const avancando = ETAPAS_LEAD.indexOf(etapa) > ETAPAS_LEAD.indexOf(lead.etapa)
    if (avancando) {
      const pendentes = marcosPendentes(lead, etapa)
      if (pendentes.length) {
        throw new ErroConflito(`Para passar para ${ROTULO_ETAPA[etapa]}, falta: ${pendentes.map((m) => ROTULO_MARCO[m]).join(', ')}.`)
      }
      if (etapa === 'concluido' && !lead.dataEvento) {
        throw new ErroConflito('Para concluir, informe a data da festa: ela fica fechada no calendário.')
      }
    }

    const atualizacao: Partial<LeadCrm> = { etapa, posicao }
    if (etapa !== lead.etapa) {
      if (etapa === 'follow_up') atualizacao.ultimoContatoEm = new Date()
      atualizacao.resultado = etapa === 'concluido' ? 'ganho' : null
    }
    const movido = await this.leads.atualizar(leadId, atualizacao)
    if (etapa !== lead.etapa) logger.info({ contaId, leadId, de: lead.etapa, para: etapa }, 'Lead mudou de etapa.')
    return movido
  }

  /**
   * Marca/desmarca um marco (orçamento enviado, contrato enviado/assinado,
   * sinal pago). Não deixa desmarcar o que a etapa atual exige — pra isso,
   * volte o card antes. Assinar implica ter enviado; desfazer o envio
   * desfaz a assinatura.
   */
  async marcar(contaId: string, leadId: string, dados: unknown): Promise<LeadCrm> {
    const lead = await this.buscarDaConta(contaId, leadId)
    const { marco, feito } = schemaMarco.parse(dados)
    const atualizacao: Partial<LeadCrm> = {}

    if (feito) {
      if (!lead[CAMPO_MARCO[marco]]) atualizacao[CAMPO_MARCO[marco]] = new Date()
      if (marco === 'contratoAssinado' && !lead.contratoEnviadoEm) atualizacao.contratoEnviadoEm = new Date()
      atualizacao.ultimoContatoEm = new Date()
    } else {
      const desfeitos = marco === 'contratoEnviado' ? (['contratoEnviado', 'contratoAssinado'] as const) : ([marco] as const)
      const exigido = desfeitos.find((m) => REQUISITOS_ETAPA[lead.etapa].includes(m) && lead[CAMPO_MARCO[m]])
      if (exigido) {
        throw new ErroConflito(`"${ROTULO_MARCO[exigido]}" é exigido em ${ROTULO_ETAPA[lead.etapa]}. Volte o card de etapa antes de desmarcar.`)
      }
      for (const m of desfeitos) atualizacao[CAMPO_MARCO[m]] = null
    }
    const atualizado = await this.leads.atualizar(leadId, atualizacao)
    logger.info({ contaId, leadId, marco, feito }, 'Marco do lead atualizado.')
    return atualizado
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
      ganhos: leads.filter((l) => l.etapa === 'concluido').length,
      perdidos: leads.filter((l) => l.resultado === 'perdido').length,
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
