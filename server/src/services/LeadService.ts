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
    return lead
  }
}
