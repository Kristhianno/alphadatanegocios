/**
 * Roda antes de cada arquivo de teste (vitest.config.ts → setupFiles).
 * JWT_SECRET só existe aqui — os testes nunca leem server/.env real,
 * então não dependem de segredo nenhum de produção pra rodar.
 */
process.env['JWT_SECRET'] ??= 'segredo-de-teste-nao-usar-em-producao'
process.env['LOG_LEVEL'] ??= 'silent'
