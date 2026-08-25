/**
 * /convites/clientes/gerar é autenticado (equipe interna); as outras
 * duas são deliberadamente públicas — é o link que o futuro cliente
 * abre sem ter feito login em lugar nenhum ainda.
 */
import { Router } from 'express'
import { supabase } from '../config/database.config.js'
import { ConvitesService } from '../services/ConvitesService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'

const router = Router()
const convitesService = new ConvitesService(supabase)

router.post('/clientes/gerar', autenticar, requererPapel('admin', 'gestor', 'tecnico'), async (req, res) => {
  const convite = await convitesService.criarConvite(req.usuarioAutenticado!.id)
  res.status(201).json(convite)
})

router.get('/clientes/:token', async (req, res) => {
  const info = await convitesService.obterInfoConvite(req.params['token'] as string)
  res.status(200).json(info)
})

router.post('/clientes/:token', async (req, res) => {
  const resultado = await convitesService.criarClientePorConvite(req.params['token'] as string, req.body)
  res.status(201).json(resultado)
})

export default router
