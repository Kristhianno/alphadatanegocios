// Contas demo por vertical (dados reais, semeadas por server/scripts/seed-*.ts).
// `slug` é o que vira URL em /demo/:slug — um link só pra cada nicho, sem
// expor os outros verticais pra quem recebe o link (ver Login.jsx e
// DemoAutoLogin.jsx).

// Guardado no navegador por DemoAutoLogin ao entrar via /demo/:vertical —
// faz o /login (inclusive depois de um logout) continuar mostrando só
// aquele nicho na seção de teste, em vez dos 4.
export const CHAVE_DEMO_VERTICAL_FIXADO = 'alphadata_demo_vertical_fixado'

export const CONTAS_DEMO_VERTICAIS = [
  { slug: 'manutencao', label: 'Manutenção', email: 'admin@alphadata.com', senha: 'admin123' },
  { slug: 'confeitaria', label: 'Confeitaria', email: 'confeitaria@alphadata.com', senha: 'admin123' },
  { slug: 'salao-festas', label: 'Salão de Festas / Eventos', email: 'salaodefestas@alphadata.com', senha: 'admin123' },
  { slug: 'fotografia', label: 'Fotografia', email: 'fotografia@alphadata.com', senha: 'admin123' },
]
