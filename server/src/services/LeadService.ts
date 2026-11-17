/**
 * Captação de leads da landing page pública ("Conhecer planos", "fale com
 * a gente"). Sem vínculo com conta/tenant — dado comercial da ALPHADATA.
 *
 * Cada lead vai pra: banco (tabela `leads`), planilha do Google Sheets
 * (GOOGLE_SHEETS_WEBHOOK_URL) e, se configurado, um aviso no WhatsApp do
 * dono via Evolution API (EVOLUTION_API_URL, EVOLUTION_API_KEY,
 * EVOLUTION_INSTANCIA, AVISO_WHATSAPP_NUMERO). Planilha e WhatsApp são
 * best-effort: uma falha neles nunca perde o lead.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { Lead } from '../models/Lead.js'
import { LeadRepository } from '../repositories/LeadRepository.js'
import { ErroPersistencia } from '../errors/AppError.js'
import { validarTelefoneBr } from '../utils/validadores.js'
import { logger } from '../utils/logger.js'

const schemaCriarLead = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(120),
  email: z.string().trim().email('E-mail inválido.').max(200),
  telefone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || validarTelefoneBr(v), 'WhatsApp inválido — informe DDD + número.'),
  mensagem: z
    .string()
    .trim()
    .max(2000, 'Mensagem muito longa.')
    .optional()
    .transform((v) => (v ? v : undefined)),
  origem: z.string().trim().min(1).max(60).optional(),
  /** Campo-armadilha: invisível pra pessoas, robôs de spam preenchem. */
  site: z.string().optional(),
})

/** Número no formato que a Evolution espera: só dígitos, com DDI 55 quando vier só DDD + número. */
export function normalizarWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, '')
  return digitos.length <= 11 ? `55${digitos}` : digitos
}

export function textoAvisoWhatsapp(lead: Pick<Lead, 'nome' | 'email' | 'telefone' | 'mensagem' | 'origem'>): string {
  return [
    '🎉 *Novo interessado nos planos ALPHADATA*',
    '',
    `*Nome:* ${lead.nome}`,
    `*E-mail:* ${lead.email}`,
    lead.telefone ? `*WhatsApp:* ${lead.telefone}` : null,
    `*Origem:* ${lead.origem}`,
    lead.mensagem ? `\n*Mensagem:*\n${lead.mensagem}` : null,
  ]
    .filter((linha) => linha !== null)
    .join('\n')
}

export class LeadService {
  private readonly leads: LeadRepository

  constructor(client: Cliente) {
    this.leads = new LeadRepository(client)
  }

  /** Devolve null quando o envio é descartado pela armadilha anti-spam (a rota responde sucesso mesmo assim). */
  async criar(dados: unknown): Promise<Lead | null> {
    const validado = schemaCriarLead.parse(dados)
    if (validado.site) {
      logger.warn({ email: validado.email }, 'Lead descartado pela armadilha anti-spam.')
      return null
    }
    const { site: _armadilha, ...novo } = validado

    let lead: Lead
    try {
      lead = await this.leads.criar(novo)
    } catch (erro) {
      // Antes da migration 20261117000001 as colunas telefone/mensagem não existem:
      // salva o lead mesmo assim (sem elas) em vez de perder o contato.
      if (!(erro instanceof ErroPersistencia) || (!novo.telefone && !novo.mensagem)) throw erro
      logger.warn({ email: novo.email }, 'Colunas telefone/mensagem ausentes em leads — salvando sem elas.')
      const salvo = await this.leads.criar({ nome: novo.nome, email: novo.email, origem: novo.origem })
      lead = { ...salvo, telefone: novo.telefone ?? null, mensagem: novo.mensagem ?? null }
    }
    logger.info({ leadId: lead.id, email: lead.email, origem: lead.origem }, 'Novo lead captado.')

    await Promise.all([this.enviarParaPlanilha(lead), this.avisarNoWhatsapp(lead)])
    return lead
  }

  private async enviarParaPlanilha(lead: Lead): Promise<void> {
    const webhookUrl = process.env['GOOGLE_SHEETS_WEBHOOK_URL']
    if (!webhookUrl) return

    try {
      // redirect: 'manual' de propósito — um Web App do Apps Script SEMPRE
      // responde com 302 em /exec, mesmo quando doPost() rodou com sucesso;
      // seguir o redirect transformaria o POST em GET e geraria alerta falso.
      const resposta = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone ?? '',
          mensagem: lead.mensagem ?? '',
          origem: lead.origem,
          criadoEm: lead.criadoEm.toISOString(),
        }),
        redirect: 'manual',
      })
      if (resposta.status >= 400) {
        logger.warn({ status: resposta.status, leadId: lead.id }, 'Planilha do Google Sheets recusou o lead.')
      }
    } catch (erro) {
      logger.warn({ erro, leadId: lead.id }, 'Falha ao enviar lead para a planilha do Google Sheets.')
    }
  }

  /** Aviso no WhatsApp do dono pela Evolution API (v2: POST /message/sendText/{instancia} com { number, text }). */
  private async avisarNoWhatsapp(lead: Lead): Promise<void> {
    const url = process.env['EVOLUTION_API_URL']?.replace(/\/$/, '')
    const chave = process.env['EVOLUTION_API_KEY']
    const instancia = process.env['EVOLUTION_INSTANCIA']
    const destino = process.env['AVISO_WHATSAPP_NUMERO']
    if (!url || !chave || !instancia || !destino) return

    try {
      const resposta = await fetch(`${url}/message/sendText/${encodeURIComponent(instancia)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: chave },
        body: JSON.stringify({ number: normalizarWhatsapp(destino), text: textoAvisoWhatsapp(lead) }),
      })
      if (!resposta.ok) logger.warn({ status: resposta.status, leadId: lead.id }, 'Evolution API recusou o aviso de lead.')
    } catch (erro) {
      logger.warn({ erro, leadId: lead.id }, 'Falha ao avisar o lead no WhatsApp.')
    }
  }
}
