/**
 * Expõe a configuração dinâmica por vertical — é o que permite o
 * frontend "se reconfigurar" (menu, campos de metadados) sem hardcode
 * por tipo de negócio. /tipos-negocio-disponiveis é pública de
 * propósito: alimenta o seletor de vertical durante o cadastro, antes
 * de existir qualquer token.
 */
import { Router } from 'express'
import { getConfigPlano } from '../config/planos.config.js'
import { getConfigTipoNegocio, listarTiposNegocioDisponiveis } from '../utils/config-factory.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { ErroProibido } from '../errors/AppError.js'

const router = Router()

router.get('/tipos-negocio-disponiveis', (_req, res) => {
  res.status(200).json(listarTiposNegocioDisponiveis())
})

router.use(autenticar, carregarContexto)

router.get('/tipo-negocio', (req, res) => {
  if (!req.conta!.tipoNegocio) {
    throw new ErroProibido('Esta conta ainda não escolheu um tipo de negócio.')
  }
  res.status(200).json(getConfigTipoNegocio(req.conta!.tipoNegocio))
})

router.get('/plano', (req, res) => {
  res.status(200).json(getConfigPlano(req.conta!.plano))
})

export default router
