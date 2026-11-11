/**
 * Para onde mandar um usuário logado que quer "entrar no sistema" — antes
 * era o redirect automático da raiz `/`, que impedia quem tinha sessão
 * salva de ver o site (o "Voltar para o site" do login não voltava).
 * Hoje a raiz é sempre a landing; isto alimenta o botão "Ir para o meu painel".
 */
export function destinoDoUsuario(user) {
  if (!user) return { para: '/login' }
  if (user.papel === 'superadmin') return { para: '/superadmin/dashboard' }
  if (!user.tipoNegocio) return { para: '/login', state: { sessaoPendente: user } }
  if (user.assinaturaPendente) return { para: '/checkout' }
  return { para: user.deveTrocarSenha ? '/trocar-senha' : `/${user.userType}/dashboard` }
}
