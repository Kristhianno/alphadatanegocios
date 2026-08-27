/**
 * Os services de manutenção (Tarefa 3) não checam se quem chama
 * gerarOrcamento/agendarTecnico/registrarMaterialsUsados/gerarLaudoTecnico/
 * criarManutencaoPreventiva tem vínculo com o chamado/ordem informado —
 * são operações de equipe interna, então a rota é quem fecha essa
 * fronteira: `requererPapel('admin', 'gestor', 'tecnico')` bloqueia um
 * usuário papel 'cliente' de, por exemplo, gerar orçamento ou agendar
 * técnico para um chamado que não é dele. Abrir chamado e aceitar
 * orçamento, por outro lado, são ações do próprio cliente — aí o
 * `clienteId` vem do JWT (não do body), pra um cliente não conseguir
 * agir em nome de outro só trocando um id na requisição.
 */
import { Hono } from 'hono'
import { z } from 'zod'
import { getSupabase } from '../config/database.config.js'
import { ManutencaoService } from '../services/tipo-especifico/ManutencaoService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import { ErroProibido } from '../errors/AppError.js'
import type { AppEnv } from '../types/hono.js'

const router = new Hono<AppEnv>()
function manutencaoService() { return new ManutencaoService(getSupabase()) }

const EQUIPE_INTERNA = ['admin', 'gestor', 'tecnico'] as const

const schemaChamado = z.object({
  tipoManutencao: z.enum(['preventiva', 'corretiva', 'emergencia']),
  descricao: z.string().trim().min(5, 'Descreva o problema com ao menos 5 caracteres.'),
})
const schemaAgendar = z.object({ tecnicoId: z.string().uuid(), data: z.coerce.date() })
const schemaOrdem = z.object({ tecnicoId: z.string().uuid() })
const schemaMateriais = z.object({
  materiais: z.array(z.object({ materialId: z.string().uuid(), quantidade: z.number().positive() })).min(1),
})
const schemaLaudo = z.object({
  diagnostico: z.string().optional(),
  servicosRealizados: z.string().optional(),
  recomendacoes: z.string().optional(),
})
const schemaPreventiva = z.object({
  clienteId: z.string().uuid(),
  frequencia: z.enum(['semanal', 'mensal', 'trimestral', 'semestral', 'anual']),
})

const base = [autenticar, carregarContexto, exigirTipoNegocio('manutencao')] as const
const soEquipeInterna = [...base, requererPapel(...EQUIPE_INTERNA)] as const
const soCliente = [...base, requererPapel('cliente')] as const

router.post('/chamados', ...soCliente, validar(schemaChamado), async (c) => {
  const { tipoManutencao, descricao } = c.get('dadosValidados') as z.infer<typeof schemaChamado>
  const chamado = await manutencaoService().criarChamado(c.get('usuarioAutenticado').id, tipoManutencao, descricao)
  return c.json(chamado, 201)
})

/** Sem restrição de papel: equipe interna vê todos os chamados da conta, cliente só os próprios — a distinção é resolvida dentro do service, não aqui. */
router.get('/chamados', ...base, async (c) => {
  const chamados = await manutencaoService().listarChamados(c.get('usuarioAutenticado').id)
  return c.json(chamados, 200)
})

/** Sem restrição de papel: equipe interna vê todos os orçamentos da conta, cliente só os próprios — a distinção é resolvida dentro do service, igual GET /chamados. */
router.get('/orcamentos', ...base, async (c) => {
  const orcamentos = await manutencaoService().listarOrcamentos(c.get('usuarioAutenticado').id)
  return c.json(orcamentos, 200)
})

router.post('/chamados/:chamadoId/orcamento', ...soEquipeInterna, validarUuidParam('chamadoId'), async (c) => {
  const orcamento = await manutencaoService().gerarOrcamento(c.req.param('chamadoId') as string)
  return c.json(orcamento, 201)
})

router.get('/chamados/:chamadoId/orcamento', ...soCliente, validarUuidParam('chamadoId'), async (c) => {
  const clienteId = c.get('usuarioAutenticado').clienteId
  if (!clienteId) throw new ErroProibido('Este login não está vinculado a um cliente.')
  const orcamento = await manutencaoService().buscarOrcamentoPendente(c.req.param('chamadoId') as string, clienteId)
  return c.json(orcamento, 200)
})

router.post('/chamados/:chamadoId/orcamento/aceitar', ...soCliente, validarUuidParam('chamadoId'), async (c) => {
  const clienteId = c.get('usuarioAutenticado').clienteId
  if (!clienteId) throw new ErroProibido('Este login não está vinculado a um cliente.')
  const orcamento = await manutencaoService().aceitarOrcamento(c.req.param('chamadoId') as string, clienteId)
  return c.json(orcamento, 200)
})

router.post('/chamados/:chamadoId/ordem', ...soEquipeInterna, validarUuidParam('chamadoId'), validar(schemaOrdem), async (c) => {
  const { tecnicoId } = c.get('dadosValidados') as z.infer<typeof schemaOrdem>
  const ordem = await manutencaoService().criarOrdenManutencao(c.req.param('chamadoId') as string, tecnicoId)
  return c.json(ordem, 201)
})

router.post('/chamados/:chamadoId/agendar', ...soEquipeInterna, validarUuidParam('chamadoId'), validar(schemaAgendar), async (c) => {
  const { tecnicoId, data } = c.get('dadosValidados') as z.infer<typeof schemaAgendar>
  const ordem = await manutencaoService().agendarTecnico(c.req.param('chamadoId') as string, tecnicoId, data)
  return c.json(ordem, 200)
})

router.post('/ordens/:ordemId/materiais', ...soEquipeInterna, validarUuidParam('ordemId'), validar(schemaMateriais), async (c) => {
  const { materiais } = c.get('dadosValidados') as z.infer<typeof schemaMateriais>
  const quantidade = await manutencaoService().registrarMaterialsUsados(c.req.param('ordemId') as string, materiais)
  return c.json({ quantidade }, 201)
})

router.post('/ordens/:ordemId/laudo', ...soEquipeInterna, validarUuidParam('ordemId'), validar(schemaLaudo), async (c) => {
  const dados = c.get('dadosValidados') as z.infer<typeof schemaLaudo>
  const laudo = await manutencaoService().gerarLaudoTecnico(c.req.param('ordemId') as string, {
    ...(dados.diagnostico !== undefined && { diagnostico: dados.diagnostico }),
    ...(dados.servicosRealizados !== undefined && { servicosRealizados: dados.servicosRealizados }),
    ...(dados.recomendacoes !== undefined && { recomendacoes: dados.recomendacoes }),
  })
  return c.json(laudo, 201)
})

router.post('/preventivas', ...soEquipeInterna, validar(schemaPreventiva), async (c) => {
  const { clienteId, frequencia } = c.get('dadosValidados') as z.infer<typeof schemaPreventiva>
  const preventiva = await manutencaoService().criarManutencaoPreventiva(clienteId, frequencia)
  return c.json(preventiva, 201)
})

export default router
