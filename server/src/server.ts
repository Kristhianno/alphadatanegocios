import { app } from './app.js'
import { logger } from './utils/logger.js'

const PORTA = Number(process.env['PORT'] ?? 3333)

app.listen(PORTA, () => {
  logger.info({ porta: PORTA }, 'ServiceHub API no ar.')
})
