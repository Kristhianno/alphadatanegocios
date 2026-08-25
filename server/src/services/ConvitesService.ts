/**
 * Convite de cliente por link: a equipe interna gera um link público
 * (sem exigir login prévio do cliente) que abre um formulário com os
 * campos de cadastro; ao enviar, o sistema cria o `ClienteFinal` E um
 * `Usuario` papel 'cliente' já vinculado, com senha temporária —
 * fechando o fluxo "cliente preenche form → já pode logar e acompanhar
 * o processo" pedido explicitamente.
 *
 * Não existe tabela de convites — o token é um JWT autocontido
 * (contaId + expiração), verificado sem consulta ao banco. Simples e
 * suficiente: um convite não precisa ser revogável antes de expirar, e
 * ninguém pediu isso.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { Conta, TipoNegocio } from '../models/User.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { ClienteService } from './ClienteService.js'
import { assinarConviteCliente, verificarConviteCliente } from '../utils/jwt.js'
import { gerarSenhaTemporaria, hashSenha } from '../utils/senha.js'
import { validarDocumento, validarTelefoneBr } from '../utils/validadores.js'
import { ErroConflito, ErroNaoEncontrado, ErroProibido } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const EQUIPE_INTERNA = ['admin', 'gestor', 'tecnico'] as const

const schemaCadastroPorConvite = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome completo.'),
  email: z.string().email('Email inválido.'),
  telefone: z.string().refine(validarTelefoneBr, 'Telefone inválido — informe DDD + número.').optional(),
  documento: z.string().refine(validarDocumento, 'CPF ou CNPJ inválido.').optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
})

export interface InfoConvite {
  nomeEmpresa: string
  tipoNegocio: TipoNegocio | null
}

export interface ResultadoCadastroPorConvite {
  email: string
  senhaTemporaria: string
  nome: string
}

export class ConvitesService {
  private readonly contas: ContaRepository
  private readonly usuarios: UsuarioRepository
  private readonly clienteService: ClienteService

  constructor(private readonly client: Cliente) {
    this.contas = new ContaRepository(client)
    this.usuarios = new UsuarioRepository(client)
    this.clienteService = new ClienteService(client)
  }

  /** Só a equipe interna pode gerar um link de convite — o próprio ErroProibido daqui é o que auth.middleware.requererPapel espelha na rota. */
  async criarConvite(userId: string): Promise<{ token: string; expiraEm: Date }> {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    if (!(EQUIPE_INTERNA as readonly string[]).includes(usuario.papel)) {
      throw new ErroProibido('Apenas a equipe interna pode convidar um cliente.')
    }

    const token = await assinarConviteCliente({ contaId: usuario.contaId, criadoPor: userId })
    const expiraEm = new Date(Date.now() + 7 * 86_400_000)
    logger.info({ contaId: usuario.contaId, criadoPor: userId }, 'Convite de cliente gerado.')
    return { token, expiraEm }
  }

  /** Dados públicos pro formulário se apresentar ("Cadastro de cliente — Confeitaria da Ana") sem precisar de autenticação. */
  async obterInfoConvite(token: string): Promise<InfoConvite> {
    const payload = await verificarConviteCliente(token)
    const conta = await this.buscarContaOuFalhar(payload.contaId)
    return { nomeEmpresa: conta.nomeEmpresa, tipoNegocio: conta.tipoNegocio }
  }

  /**
   * Cria o cliente e o login dele numa transação lógica (se o segundo
   * insert falhar, o cliente cadastrado fica órfão de login — aceitável
   * aqui: o pior caso é a equipe interna reenviar o convite e o cliente
   * preencher de novo, não um estado inconsistente perigoso).
   */
  async criarClientePorConvite(token: string, dados: unknown): Promise<ResultadoCadastroPorConvite> {
    const payload = await verificarConviteCliente(token)
    const validado = schemaCadastroPorConvite.parse(dados)

    const existente = await this.usuarios.buscarComCredenciaisPorEmail(validado.email)
    if (existente) throw new ErroConflito(`Já existe um cadastro com o email "${validado.email}".`)

    const cliente = await this.clienteService.criarClienteParaConta(payload.contaId, validado)

    const senhaTemporaria = gerarSenhaTemporaria()
    const senhaHash = await hashSenha(senhaTemporaria)
    await this.usuarios.criar({
      contaId: payload.contaId,
      email: validado.email,
      senhaHash,
      nome: validado.nome,
      papel: 'cliente' as const,
      clienteId: cliente.id,
      status: 'ativo',
      deveTrocarSenha: true,
    })

    logger.info({ contaId: payload.contaId, clienteId: cliente.id }, 'Cliente cadastrado por convite — login criado com senha temporária.')
    return { email: validado.email, senhaTemporaria, nome: validado.nome }
  }

  private async buscarContaOuFalhar(contaId: string): Promise<Conta> {
    const conta = await this.contas.buscarPorId(contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', contaId)
    return conta
  }
}
