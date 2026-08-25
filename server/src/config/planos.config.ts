/**
 * Dados dos planos de assinatura (`Conta.plano`). Puramente
 * declarativo — nenhuma rota ainda impõe `limiteUsuarios`/`limiteAgendamentosMes`;
 * isso ficaria pra um middleware de "verificar limite do plano" que
 * ninguém pediu ainda. Registrado aqui pra não fingir que o
 * enforcement existe quando não existe.
 */
import type { Plano } from '../models/User.js'

export interface ConfigPlano {
  plano: Plano
  nome: string
  precoMensalCentavos: number
  limiteUsuarios: number
  /** null = ilimitado. */
  limiteAgendamentosMes: number | null
  recursos: string[]
}

const PLANOS_CONFIG: Record<Plano, ConfigPlano> = {
  startup: {
    plano: 'startup',
    nome: 'Startup',
    precoMensalCentavos: 4_900,
    limiteUsuarios: 3,
    limiteAgendamentosMes: 100,
    recursos: ['1 vertical de negócio', 'Agendamentos e catálogo', 'Suporte por email'],
  },
  profissional: {
    plano: 'profissional',
    nome: 'Profissional',
    precoMensalCentavos: 14_900,
    limiteUsuarios: 15,
    limiteAgendamentosMes: 1_000,
    recursos: ['1 vertical de negócio', 'Relatórios do vertical', 'Suporte prioritário'],
  },
  enterprise: {
    plano: 'enterprise',
    nome: 'Enterprise',
    precoMensalCentavos: 39_900,
    limiteUsuarios: 100,
    limiteAgendamentosMes: null,
    recursos: ['1 vertical de negócio', 'Relatórios avançados', 'Suporte dedicado'],
  },
}

export function getConfigPlano(plano: Plano): ConfigPlano {
  return PLANOS_CONFIG[plano]
}

export function listarPlanosDisponiveis(): ConfigPlano[] {
  return Object.values(PLANOS_CONFIG)
}
