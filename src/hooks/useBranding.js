import { useAuth } from './useAuth'

// Nome da plataforma em si — usado como marca nas telas antes do login
// (Login, cadastro, troca de senha) e como fallback enquanto a conta não
// personalizou nome fantasia/logo.
export const NOME_PLATAFORMA_PADRAO = 'ALPHADATA'

/** Nome fantasia e logo da conta logada, já com fallback pra marca padrão. */
export function useBranding() {
  const { user } = useAuth()
  return {
    nomeExibido: user?.nomeEmpresa?.trim() || NOME_PLATAFORMA_PADRAO,
    logoUrl: user?.logoUrl ?? null,
    /** Nome da marca em imagem: quando existe, substitui o nome fantasia em texto. */
    logotipoUrl: user?.logotipoUrl ?? null,
  }
}
