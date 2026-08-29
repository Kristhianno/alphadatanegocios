/** Captação de leads da landing page pública ("fale com a gente"). Sem vínculo com conta/tenant — dado comercial da ALPHADATA. */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { Lead } from '../models/Lead.js'
import { LeadRepository } from '../repositories/LeadRepository.js'
import { logger } from '../utils/logger.js'

const schemaCriarLead = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.'),
  email: z.string().trim().email('Email inválido.'),
  origem: z.string().trim().min(1).optional(),
})

export class LeadService {
  private readonly leads: LeadRepository

  constructor(client: Cliente) {
    this.leads = new LeadRepository(client)
  }

  async criar(nome: string, email: string, origem?: string): Promise<Lead> {
    const dados = schemaCriarLead.parse({ nome, email, origem })
    const lead = await this.leads.criar(dados)
    logger.info({ leadId: lead.id, email: lead.email }, 'Novo lead captado.')

    // Best-effort: espelha o lead numa planilha do Google Sheets via um
    // Apps Script Web App (ver server/.dev.vars.example) — igual ao
    // espelhamento no Supabase Auth em UserService.criarUsuario, uma
    // falha aqui não pode derrubar a captação do lead em si.
    await this.enviarParaPlanilha(lead)

    return lead
  }

  private async enviarParaPlanilha(lead: Lead): Promise<void> {
    const webhookUrl = process.env['GOOGLE_SHEETS_WEBHOOK_URL']
    if (!webhookUrl) return

    try {
      const resposta = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: lead.nome,
          email: lead.email,
          origem: lead.origem,
          criadoEm: lead.criadoEm.toISOString(),
        }),
      })
      if (!resposta.ok) {
        logger.warn({ status: resposta.status, leadId: lead.id }, 'Planilha do Google Sheets recusou o lead.')
      }
    } catch (erro) {
      logger.warn({ erro, leadId: lead.id }, 'Falha ao enviar lead para a planilha do Google Sheets.')
    }
  }
}
