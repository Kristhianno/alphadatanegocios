import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { ServicoService } from '../services/ServicoService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import { ErroProibido } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function servicoService() { return new ServicoService(getSupabase()) }

const schemaFiltros = z.object({
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

const protegido = [autenticar, carregarContexto] as const

router.post('/', ...protegido, async (c) => {
  const conta = c.get('conta')
  if (!conta.tipoNegocio) {
    throw new ErroProibido('Selecione o tipo de negócio da conta antes de cadastrar serviços.')
  }
  const servico = await servicoService().criarServico(c.get('usuarioAutenticado').id, conta.tipoNegocio, await c.req.json())
  return c.json(servico, 201)
})

router.get('/', ...protegido, validar(schemaFiltros, 'query'), async (c) => {
  const filtros = c.get('dadosValidados') as { ativo?: boolean }
  const servicos = await servicoService().listarServicos(c.get('usuarioAutenticado').id, filtros)
  return c.json(servicos, 200)
})

router.patch('/:id', ...protegido, validarUuidParam('id'), async (c) => {
  const servico = await servicoService().atualizarServico(c.req.param('id') as string, await c.req.json())
  return c.json(servico, 200)
})

router.delete('/:id', ...protegido, validarUuidParam('id'), async (c) => {
  await servicoService().deletarServico(c.req.param('id') as string)
  return c.body(null, 204)
})

router.post('/:id/ativar', ...protegido, validarUuidParam('id'), async (c) => {
  const servico = await servicoService().ativarServico(c.req.param('id') as string)
  return c.json(servico, 200)
})

router.post('/:id/desativar', ...protegido, validarUuidParam('id'), async (c) => {
  const servico = await servicoService().desativarServico(c.req.param('id') as string)
  return c.json(servico, 200)
})

export default router
