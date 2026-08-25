import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { ConfeitariaService } from '../services/tipo-especifico/ConfeitariaService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function confeitariaService() { return new ConfeitariaService(getSupabase()) }

const schemaMovimentacao = z.object({ quantidade: z.number().refine((v) => v !== 0, 'A quantidade não pode ser zero.') })

const protegido = [autenticar, carregarContexto, exigirTipoNegocio('confeitaria')] as const

router.post('/receitas', ...protegido, async (c) => {
  const receita = await confeitariaService().criarReceita(c.get('usuarioAutenticado').id, await c.req.json())
  return c.json(receita, 201)
})

router.get('/receitas/:receitaId/custo', ...protegido, validarUuidParam('receitaId'), async (c) => {
  const custo = await confeitariaService().calcularCustoProducao(c.req.param('receitaId') as string)
  return c.json({ custo }, 200)
})

router.post('/pedidos', ...protegido, async (c) => {
  const pedido = await confeitariaService().criarPedidoConfeitaria(c.get('usuarioAutenticado').id, await c.req.json())
  return c.json(pedido, 201)
})

router.post('/pedidos/:pedidoId/ordem-producao', ...protegido, validarUuidParam('pedidoId'), async (c) => {
  const ordem = await confeitariaService().gerarOrdenProducaoComChecklist(c.req.param('pedidoId') as string)
  return c.json(ordem, 201)
})

router.patch('/ingredientes/:ingredienteId/estoque', ...protegido, validarUuidParam('ingredienteId'), validar(schemaMovimentacao), async (c) => {
  const { quantidade } = c.get('dadosValidados') as z.infer<typeof schemaMovimentacao>
  const resultado = await confeitariaService().atualizarMovimentacaoEstoque(c.req.param('ingredienteId') as string, quantidade)
  return c.json(resultado, 200)
})

router.get('/produtos/:produtoId/margem', ...protegido, validarUuidParam('produtoId'), async (c) => {
  const margem = await confeitariaService().calcularMargemLucro(c.req.param('produtoId') as string)
  return c.json({ margemLucroPercentual: margem }, 200)
})

export default router
