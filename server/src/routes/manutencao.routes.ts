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
import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/database.config.js'
import { ManutencaoService } from '../services/tipo-especifico/ManutencaoService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto, exigirTipoNegocio } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'
import { ErroProibido } from '../errors/AppError.js'

const router = Router()
const manutencaoService = new ManutencaoService(supabase)

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

router.use(autenticar, carregarContexto, exigirTipoNegocio('manutencao'))

router.post('/chamados', requererPapel('cliente'), validar(schemaChamado), async (req, res) => {
  const { tipoManutencao, descricao } = req.dadosValidados as z.infer<typeof schemaChamado>
  const chamado = await manutencaoService.criarChamado(req.usuarioAutenticado!.id, tipoManutencao, descricao)
  res.status(201).json(chamado)
})

router.post('/chamados/:chamadoId/orcamento', requererPapel(...EQUIPE_INTERNA), validarUuidParam('chamadoId'), async (req, res) => {
  const orcamento = await manutencaoService.gerarOrcamento(req.params['chamadoId'] as string)
  res.status(201).json(orcamento)
})

router.post('/chamados/:chamadoId/orcamento/aceitar', requererPapel('cliente'), validarUuidParam('chamadoId'), async (req, res) => {
  if (!req.usuarioAutenticado!.clienteId) {
    throw new ErroProibido('Este login não está vinculado a um cliente.')
  }
  const orcamento = await manutencaoService.aceitarOrcamento(req.params['chamadoId'] as string, req.usuarioAutenticado!.clienteId)
  res.status(200).json(orcamento)
})

router.post('/chamados/:chamadoId/ordem', requererPapel(...EQUIPE_INTERNA), validarUuidParam('chamadoId'), validar(schemaOrdem), async (req, res) => {
  const { tecnicoId } = req.dadosValidados as z.infer<typeof schemaOrdem>
  const ordem = await manutencaoService.criarOrdenManutencao(req.params['chamadoId'] as string, tecnicoId)
  res.status(201).json(ordem)
})

router.post('/chamados/:chamadoId/agendar', requererPapel(...EQUIPE_INTERNA), validarUuidParam('chamadoId'), validar(schemaAgendar), async (req, res) => {
  const { tecnicoId, data } = req.dadosValidados as z.infer<typeof schemaAgendar>
  const ordem = await manutencaoService.agendarTecnico(req.params['chamadoId'] as string, tecnicoId, data)
  res.status(200).json(ordem)
})

router.post('/ordens/:ordemId/materiais', requererPapel(...EQUIPE_INTERNA), validarUuidParam('ordemId'), validar(schemaMateriais), async (req, res) => {
  const { materiais } = req.dadosValidados as z.infer<typeof schemaMateriais>
  const quantidade = await manutencaoService.registrarMaterialsUsados(req.params['ordemId'] as string, materiais)
  res.status(201).json({ quantidade })
})

router.post('/ordens/:ordemId/laudo', requererPapel(...EQUIPE_INTERNA), validarUuidParam('ordemId'), validar(schemaLaudo), async (req, res) => {
  const dados = req.dadosValidados as z.infer<typeof schemaLaudo>
  const laudo = await manutencaoService.gerarLaudoTecnico(req.params['ordemId'] as string, {
    ...(dados.diagnostico !== undefined && { diagnostico: dados.diagnostico }),
    ...(dados.servicosRealizados !== undefined && { servicosRealizados: dados.servicosRealizados }),
    ...(dados.recomendacoes !== undefined && { recomendacoes: dados.recomendacoes }),
  })
  res.status(201).json(laudo)
})

router.post('/preventivas', requererPapel(...EQUIPE_INTERNA), validar(schemaPreventiva), async (req, res) => {
  const { clienteId, frequencia } = req.dadosValidados as z.infer<typeof schemaPreventiva>
  const preventiva = await manutencaoService.criarManutencaoPreventiva(clienteId, frequencia)
  res.status(201).json(preventiva)
})

export default router
