/**
 * CRUD de clientes finais (o cadastro de clientes de uma conta). Não
 * estava na lista da Tarefa 3 — descoberto faltando ao testar a Tarefa
 * 4 de ponta a ponta: todo `clienteId` que os services de vertical
 * (ConfeitariaService.criarPedidoConfeitaria, SalaoFestasService.criarEvento,
 * ManutencaoService.criarChamado, ...) recebem é uma FK obrigatória pra
 * `clientes` — sem um jeito de cadastrar um cliente pela API, nenhuma
 * dessas rotas seria utilizável de verdade por um usuário real.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { ClienteFinal } from '../models/ClienteFinal.js'
import { ClienteRepository } from '../repositories/ClienteRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { validarDocumento, validarTelefoneBr } from '../utils/validadores.js'
import { ErroNaoEncontrado } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const schemaCriarCliente = z.object({
  nome: z.string().trim().min(2),
  email: z.string().email().optional(),
  telefone: z.string().refine(validarTelefoneBr, 'Telefone inválido — informe DDD + número.').optional(),
  documento: z.string().refine(validarDocumento, 'CPF ou CNPJ inválido.').optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  metadados: z.record(z.string(), z.unknown()).optional(),
})

const schemaAtualizarCliente = schemaCriarCliente.partial()

export interface FiltrosCliente {
  ativo?: boolean
}

export class ClienteService {
  private readonly clientes: ClienteRepository
  private readonly usuarios: UsuarioRepository

  constructor(client: Cliente) {
    this.clientes = new ClienteRepository(client)
    this.usuarios = new UsuarioRepository(client)
  }

  async criarCliente(userId: string, dados: unknown): Promise<ClienteFinal> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    return this.criarClienteParaConta(usuario.contaId, dados)
  }

  /**
   * Mesma criação de `criarCliente`, mas recebendo `contaId` já
   * resolvido em vez de um `userId` autenticado — é o que
   * ConvitesService.criarClientePorConvite usa, já que ali quem está
   * preenchendo o formulário é o próprio cliente sendo cadastrado, sem
   * login algum ainda.
   */
  async criarClienteParaConta(contaId: string, dados: unknown): Promise<ClienteFinal> {
    const validado = schemaCriarCliente.parse(dados)

    const cliente = await this.clientes.criar({
      contaId,
      nome: validado.nome,
      ativo: true,
      ...(validado.email !== undefined && { email: validado.email }),
      ...(validado.telefone !== undefined && { telefone: validado.telefone }),
      ...(validado.documento !== undefined && { documento: validado.documento }),
      ...(validado.endereco !== undefined && { endereco: validado.endereco }),
      ...(validado.cidade !== undefined && { cidade: validado.cidade }),
      ...(validado.estado !== undefined && { estado: validado.estado }),
      ...(validado.metadados !== undefined && { metadados: validado.metadados }),
    })

    logger.info({ clienteId: cliente.id }, 'Cliente cadastrado.')
    return cliente
  }

  async listarClientes(userId: string, filtros: FiltrosCliente = {}): Promise<ClienteFinal[]> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const filtroBanco: Record<string, unknown> = { conta_id: usuario.contaId }
    if (filtros.ativo !== undefined) filtroBanco['ativo'] = filtros.ativo
    return this.clientes.listar(filtroBanco, { ordenarPor: 'nome' })
  }

  async atualizarCliente(clienteId: string, dados: unknown): Promise<ClienteFinal> {
    await this.buscarClienteOuFalhar(clienteId)
    const validado = schemaAtualizarCliente.parse(dados)
    const cliente = await this.clientes.atualizar(clienteId, validado)
    logger.info({ clienteId }, 'Cliente atualizado.')
    return cliente
  }

  /** Soft-delete — mesma regra usada em todo o resto do sistema (nunca DELETE físico de clientes/produtos em uso normal). */
  async desativarCliente(clienteId: string): Promise<ClienteFinal> {
    await this.buscarClienteOuFalhar(clienteId)
    return this.clientes.atualizar(clienteId, { ativo: false })
  }

  private async buscarUsuarioOuFalhar(userId: string) {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }

  private async buscarClienteOuFalhar(clienteId: string): Promise<ClienteFinal> {
    const cliente = await this.clientes.buscarPorId(clienteId)
    if (!cliente) throw new ErroNaoEncontrado('Cliente', clienteId)
    return cliente
  }
}
