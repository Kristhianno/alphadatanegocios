import type { Cliente } from '../config/database.config.js'
import type { Conta } from '../models/User.js'
import { calcularAssinaturaPendente } from '../utils/assinatura.js'
import { Repository, type LinhaBanco } from './Repository.js'

export class ContaRepository extends Repository<Conta> {
  constructor(client: Cliente) {
    super(client, 'contas')
  }

  protected paraDominio(linha: LinhaBanco): Conta {
    const base = {
      id: linha['id'] as string,
      nomeEmpresa: linha['nome_empresa'] as string,
      tipoNegocio: (linha['tipo_negocio'] as Conta['tipoNegocio']) ?? null,
      plano: linha['plano'] as Conta['plano'],
      status: linha['status'] as Conta['status'],
      configuracoesGerais: (linha['configuracoes_gerais'] as Record<string, unknown>) ?? {},
      cicloCobranca: (linha['ciclo_cobranca'] as Conta['cicloCobranca']) ?? null,
      stripeCustomerId: (linha['stripe_customer_id'] as string) ?? null,
      stripeSubscriptionId: (linha['stripe_subscription_id'] as string) ?? null,
      trialTerminaEm: linha['trial_termina_em'] ? new Date(linha['trial_termina_em'] as string) : null,
      assinaturaPendente: (linha['assinatura_pendente'] as boolean) ?? false,
      criadoEm: new Date(linha['criado_em'] as string),
      atualizadoEm: new Date(linha['atualizado_em'] as string),
    }
    // Recalculado a cada leitura (não confia só no que está gravado) porque "o trial
    // acabou" é um fato que muda sozinho com o relógio — ver utils/assinatura.ts.
    return { ...base, assinaturaPendente: calcularAssinaturaPendente(base) }
  }

  protected paraLinha(dados: Partial<Conta>): LinhaBanco {
    const linha: LinhaBanco = {}
    if (dados.nomeEmpresa !== undefined) linha['nome_empresa'] = dados.nomeEmpresa
    if (dados.tipoNegocio !== undefined) linha['tipo_negocio'] = dados.tipoNegocio
    if (dados.plano !== undefined) linha['plano'] = dados.plano
    if (dados.status !== undefined) linha['status'] = dados.status
    if (dados.configuracoesGerais !== undefined) linha['configuracoes_gerais'] = dados.configuracoesGerais
    if (dados.cicloCobranca !== undefined) linha['ciclo_cobranca'] = dados.cicloCobranca
    if (dados.stripeCustomerId !== undefined) linha['stripe_customer_id'] = dados.stripeCustomerId
    if (dados.stripeSubscriptionId !== undefined) linha['stripe_subscription_id'] = dados.stripeSubscriptionId
    if (dados.trialTerminaEm !== undefined) linha['trial_termina_em'] = dados.trialTerminaEm
    if (dados.assinaturaPendente !== undefined) linha['assinatura_pendente'] = dados.assinaturaPendente
    return linha
  }

  /** Usado pelo webhook do Stripe pra achar a conta dona de uma subscription já vinculada. */
  async buscarPorStripeSubscriptionId(stripeSubscriptionId: string): Promise<Conta | null> {
    const [conta] = await this.listar({ stripe_subscription_id: stripeSubscriptionId }, { limite: 1 })
    return conta ?? null
  }
}
