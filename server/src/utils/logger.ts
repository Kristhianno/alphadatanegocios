import pino from 'pino'

/**
 * Logger compartilhado por todos os services. Em produção emite JSON
 * de linha única (fácil de agregar); em desenvolvimento usa
 * pino-pretty para leitura humana no terminal.
 */
const ehProducao = process.env['NODE_ENV'] === 'production'

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  ...(ehProducao
    ? {}
    : { transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }),
})
