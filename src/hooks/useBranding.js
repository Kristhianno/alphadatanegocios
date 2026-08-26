import { useAuth } from './useAuth'

// Nome da plataforma em si — usado como marca nas telas antes do login
// (Login, cadastro, troca de senha) e como fallback enquanto a conta não
// personalizou nome fantasia/logo.
export const NOME_PLATAFORMA_PADRAO = 'ALPHADATA'

// Cabe folgado no jsonb da conta como data URL — usado em qualquer tela que faça upload de logo.
export const TAMANHO_MAX_LOGO_BYTES = 300 * 1024

/** Nome fantasia e logo da conta logada, já com fallback pra marca padrão. */
export function useBranding() {
  const { user } = useAuth()
  return {
    nomeExibido: user?.nomeEmpresa?.trim() || NOME_PLATAFORMA_PADRAO,
    logoUrl: user?.logoUrl ?? null,
  }
}
