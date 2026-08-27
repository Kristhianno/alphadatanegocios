/**
 * Expõe a configuração dinâmica por vertical — é o que permite o
 * frontend "se reconfigurar" (menu, campos de metadados) sem hardcode
 * por tipo de negócio. /tipos-negocio-disponiveis é pública de
 * propósito: alimenta o seletor de vertical durante o cadastro, antes
 * de existir qualquer token.
 */
import { Hono } from 'hono'
import { getConfigPlano, listarPlanosComCheckout } from '../config/planos.config.js'
import { getConfigTipoNegocio, listarSegmentosOnboarding } from '../utils/config-factory.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { ErroProibido } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()

router.get('/tipos-negocio-disponiveis', (c) => c.json(listarSegmentosOnboarding(), 200))

/** Pública: alimenta os cards de preço da landing e a tela de checkout, sem hardcode de valores no frontend. */
router.get('/planos-disponiveis', (c) => c.json(listarPlanosComCheckout(), 200))

/** menuItems é filtrado por papel: MenuItem.papeis omitido = visível pra todos; com papeis definido, só aparece pra quem está na lista (ex: 'estoque' some do menu de quem loga como 'cliente'). */
router.get('/tipo-negocio', autenticar, carregarContexto, (c) => {
  const conta = c.get('conta')
  if (!conta.tipoNegocio) throw new ErroProibido('Esta conta ainda não escolheu um tipo de negócio.')
  const config = getConfigTipoNegocio(conta.tipoNegocio)
  const papel = c.get('usuarioAutenticado').papel
  const menuItems = config.menuItems.filter((item) => !item.papeis || item.papeis.includes(papel))
  return c.json({ ...config, menuItems }, 200)
})

router.get('/plano', autenticar, carregarContexto, (c) => c.json(getConfigPlano(c.get('conta').plano), 200))

export default router
