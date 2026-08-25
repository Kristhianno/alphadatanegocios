/**
 * Expõe a configuração dinâmica por vertical — é o que permite o
 * frontend "se reconfigurar" (menu, campos de metadados) sem hardcode
 * por tipo de negócio. /tipos-negocio-disponiveis é pública de
 * propósito: alimenta o seletor de vertical durante o cadastro, antes
 * de existir qualquer token.
 */
import { Hono } from 'hono'
import { getConfigPlano } from '../config/planos.config.js'
import { getConfigTipoNegocio, listarTiposNegocioDisponiveis } from '../utils/config-factory.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { ErroProibido } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()

router.get('/tipos-negocio-disponiveis', (c) => c.json(listarTiposNegocioDisponiveis(), 200))

router.get('/tipo-negocio', autenticar, carregarContexto, (c) => {
  const conta = c.get('conta')
  if (!conta.tipoNegocio) throw new ErroProibido('Esta conta ainda não escolheu um tipo de negócio.')
  return c.json(getConfigTipoNegocio(conta.tipoNegocio), 200)
})

router.get('/plano', autenticar, carregarContexto, (c) => c.json(getConfigPlano(c.get('conta').plano), 200))

export default router
