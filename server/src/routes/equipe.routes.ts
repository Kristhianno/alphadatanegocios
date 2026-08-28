/**
 * Listagem e desativação da equipe interna com login (gestor/tecnico).
 * A criação do login em si é feita via convite — ver /convites/equipe/*
 * em convites.routes.ts.
 */
import { Hono } from 'hono'
import { getSupabase } from '../config/database.config.js'
import { EquipeService } from '../services/EquipeService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function equipeService() { return new EquipeService(getSupabase()) }

router.get('/', autenticar, requererPapel('admin', 'gestor'), async (c) => {
  const equipe = await equipeService().listarEquipe(c.get('usuarioAutenticado').id)
  return c.json(equipe, 200)
})

router.post('/:id/desativar', autenticar, requererPapel('admin'), validarUuidParam('id'), async (c) => {
  const membro = await equipeService().desativarMembro(c.get('usuarioAutenticado').id, c.req.param('id') as string)
  return c.json(membro, 200)
})

export default router
