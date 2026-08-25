/**
 * Cadastro de clientes finais. Restrito à equipe interna (admin/gestor/
 * técnico) — é dado de CRM da conta, um login papel 'cliente' não deve
 * listar ou editar o cadastro de outros clientes.
 */
import { Router } from 'express'
import { z } from 'zod'
import { supabase } from '../config/database.config.js'
import { ClienteService } from '../services/ClienteService.js'
import type { FiltrosCliente } from '../services/ClienteService.js'
import { autenticar, requererPapel } from '../middleware/auth.middleware.js'
import { carregarContexto } from '../middleware/contexto-negocio.middleware.js'
import { validar, validarUuidParam } from '../middleware/validacao.middleware.js'

const router = Router()
const clienteService = new ClienteService(supabase)

const schemaFiltros = z.object({
  ativo: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
})

router.use(autenticar, carregarContexto, requererPapel('admin', 'gestor', 'tecnico'))

router.post('/', async (req, res) => {
  const cliente = await clienteService.criarCliente(req.usuarioAutenticado!.id, req.body)
  res.status(201).json(cliente)
})

router.get('/', validar(schemaFiltros, 'query'), async (req, res) => {
  const filtros = req.dadosValidados as FiltrosCliente
  const clientes = await clienteService.listarClientes(req.usuarioAutenticado!.id, filtros)
  res.status(200).json(clientes)
})

router.patch('/:id', validarUuidParam('id'), async (req, res) => {
  const cliente = await clienteService.atualizarCliente(req.params['id'] as string, req.body)
  res.status(200).json(cliente)
})

router.post('/:id/desativar', validarUuidParam('id'), async (req, res) => {
  const cliente = await clienteService.desativarCliente(req.params['id'] as string)
  res.status(200).json(cliente)
})

export default router
