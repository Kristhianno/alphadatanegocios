import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/database.config.js'
import { ConfeitariaService } from '../services/tipo-especifico/ConfeitariaService.js'
import { autenticar } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'

const router = Router()
const confeitariaService = new ConfeitariaService(supabase)

const schemaMovimentacao = z.object({ quantidade: z.number().refine((v) => v !== 0, 'A quantidade não pode ser zero.') })

router.use(autenticar, carregarContexto, exigirTipoNegocio('confeitaria'))

router.post('/receitas', async (req, res) => {
  const receita = await confeitariaService.criarReceita(req.usuarioAutenticado!.id, req.body)
  res.status(201).json(receita)
})

router.get('/receitas/:receitaId/custo', validarUuidParam('receitaId'), async (req, res) => {
  const custo = await confeitariaService.calcularCustoProducao(req.params['receitaId'] as string)
  res.status(200).json({ custo })
})

router.post('/pedidos', async (req, res) => {
  const pedido = await confeitariaService.criarPedidoConfeitaria(req.usuarioAutenticado!.id, req.body)
  res.status(201).json(pedido)
})

router.post('/pedidos/:pedidoId/ordem-producao', validarUuidParam('pedidoId'), async (req, res) => {
  const ordem = await confeitariaService.gerarOrdenProducaoComChecklist(req.params['pedidoId'] as string)
  res.status(201).json(ordem)
})

router.patch('/ingredientes/:ingredienteId/estoque', validarUuidParam('ingredienteId'), validar(schemaMovimentacao), async (req, res) => {
  const { quantidade } = req.dadosValidados as z.infer<typeof schemaMovimentacao>
  const resultado = await confeitariaService.atualizarMovimentacaoEstoque(req.params['ingredienteId'] as string, quantidade)
  res.status(200).json(resultado)
})

router.get('/produtos/:produtoId/margem', validarUuidParam('produtoId'), async (req, res) => {
  const margem = await confeitariaService.calcularMargemLucro(req.params['produtoId'] as string)
  res.status(200).json({ margemLucroPercentual: margem })
})

export default router
