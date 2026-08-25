/**
 * Modelos de identidade: `Conta` (o tenant — a empresa assinante do
 * ServiceHub) e `Usuario` (um login dentro dessa conta).
 *
 * O pedido original definia um único `User` com nomeEmpresa/tipoNegocio/
 * plano — esses campos são por-tenant, não por-login, então foram
 * separados aqui na mesma linha da tabela `contas` criada no schema SQL
 * (ver supabase/migrations/20260824000001_schema_shared.sql). `Usuario`
 * é quem efetivamente faz login, com um `papel` — mantendo o modelo de
 * admin / gestor-ou-tecnico / cliente já usado no ALPHADATA.
 */

/** Verticais de negócio suportados pelo ServiceHub. */
export type TipoNegocio =
  | 'confeitaria'
  | 'salao_festas'
  | 'fotografia_video'
  | 'manutencao'
  | 'outro'

/** Papel de login dentro de uma conta. */
export type Papel = 'admin' | 'gestor' | 'tecnico' | 'cliente'

export type Plano = 'startup' | 'profissional' | 'enterprise'

export type StatusConta = 'ativo' | 'cancelado' | 'suspenso'

export type StatusUsuario = 'ativo' | 'inativo' | 'suspenso'

/**
 * O tenant do SaaS: uma empresa assinante. Espelha 1:1 a tabela `contas`.
 */
export interface Conta {
  id: string
  nomeEmpresa: string
  tipoNegocio: TipoNegocio
  plano: Plano
  status: StatusConta
  /** Preferências livres (tema, notificações, integrações) sem coluna própria. */
  configuracoesGerais: Record<string, unknown>
  criadoEm: Date
  atualizadoEm: Date
}

/** Dados necessários para abrir uma nova conta — campos gerados pelo banco ficam de fora. */
export type NovaContaInput = Pick<Conta, 'nomeEmpresa' | 'tipoNegocio'> &
  Partial<Pick<Conta, 'plano' | 'configuracoesGerais'>>

/**
 * Um login dentro de uma conta. Espelha 1:1 a tabela `usuarios`,
 * exceto pelo hash de senha — ver {@link UsuarioComCredenciais}.
 */
export interface Usuario {
  id: string
  contaId: string
  /** Vínculo opcional com auth.users do Supabase Auth, se/quando adotado. */
  authUserId: string | null
  email: string
  nome: string
  papel: Papel
  /** Preenchido apenas quando papel === 'cliente'. */
  clienteId: string | null
  status: StatusUsuario
  ultimoLoginEm: Date | null
  criadoEm: Date
  atualizadoEm: Date
}

/**
 * Mesma forma de {@link Usuario}, mas com o hash de senha incluído.
 * Uso restrito à camada de autenticação (UserService/auth.middleware) —
 * nunca deve trafegar em uma resposta de API. Manter os dois tipos
 * separados é o que impede um `return usuario` acidental de vazar o hash.
 */
export interface UsuarioComCredenciais extends Usuario {
  senhaHash: string | null
}

/** Dados necessários para criar um usuário — a senha chega em texto puro e é hasheada no service. */
export interface NovoUsuarioInput {
  contaId: string
  email: string
  senha: string
  nome: string
  papel: Papel
  clienteId?: string
}

/**
 * Papéis operacionais (gestor/tecnico) recebem um rótulo diferente na UI
 * dependendo do vertical — ex: "Técnico" em manutenção, "Gestor" em
 * salão de festas. A definição de qual rótulo usar vive em
 * {@link ../config/tipos-negocio.config.ts | TIPOS_NEGOCIO_CONFIG}, não
 * aqui, para não duplicar a mesma decisão em dois lugares.
 */
export function rotuloPapel(papel: Papel): 'Administrador' | 'Operacional' | 'Cliente' {
  switch (papel) {
    case 'admin':
      return 'Administrador'
    case 'gestor':
    case 'tecnico':
      return 'Operacional'
    case 'cliente':
      return 'Cliente'
  }
}
