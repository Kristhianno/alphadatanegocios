/**
 * Service de identidade: cadastro de conta, seleção do vertical de
 * negócio e gestão de perfil do usuário logado.
 *
 * `userId` em todos os métodos é o id de {@link Usuario} (o login),
 * não o id da {@link Conta} — é o que vai no JWT depois que
 * auth.middleware (Tarefa 5) autentica a requisição. O service resolve
 * `usuario.contaId` internamente sempre que precisa tocar a conta.
 */
import { z } from 'zod'
import type { Cliente } from '../config/database.config.js'
import type { Conta, TipoNegocio, Usuario } from '../models/User.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { hashSenha, verificarSenha } from '../utils/senha.js'
import { ErroConflito, ErroNaoAutorizado, ErroNaoEncontrado, ErroProibido, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const TIPOS_NEGOCIO_VALIDOS = ['confeitaria', 'salao_festas', 'fotografia_video', 'manutencao', 'outro'] as const

const schemaCriarUsuario = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(8, 'A senha precisa de ao menos 8 caracteres.'),
  nomeEmpresa: z.string().trim().min(2, 'Informe o nome da empresa.'),
})

const schemaAutenticar = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(1, 'Informe a senha.'),
})

const schemaAtualizarPerfil = z.object({
  nome: z.string().trim().min(2).optional(),
  email: z.string().email().optional(),
})

/** ~260KB de imagem crua, já em base64 (data URL) — suficiente pra um logotipo, sem deixar o jsonb da conta inchar. */
const schemaAtualizarBranding = z.object({
  nomeEmpresa: z.string().trim().min(2, 'Informe o nome da empresa.').optional(),
  logoUrl: z.string().trim().min(1).max(350_000, 'Imagem muito grande. Escolha um arquivo menor.').nullable().optional(),
})

const schemaTrocarSenha = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual.'),
  novaSenha: z.string().min(8, 'A nova senha precisa de ao menos 8 caracteres.'),
})

/** Defaults de configuração aplicados quando a conta escolhe seu vertical. */
const CONFIGURACOES_PADRAO_POR_TIPO: Record<TipoNegocio, Record<string, unknown>> = {
  confeitaria: { moeda: 'BRL', alertaEstoqueBaixo: true },
  salao_festas: { moeda: 'BRL', confirmacaoEquipeDiasAntes: 7 },
  fotografia_video: { moeda: 'BRL', validadeGaleriaDias: 30 },
  manutencao: { moeda: 'BRL', slaPadraoHoras: 24 },
  outro: { moeda: 'BRL' },
}

export class UserService {
  private readonly contas: ContaRepository
  private readonly usuarios: UsuarioRepository

  constructor(client: Cliente) {
    this.contas = new ContaRepository(client)
    this.usuarios = new UsuarioRepository(client)
  }

  /**
   * Cadastro inicial: abre a conta (sem vertical ainda) e cria o
   * primeiro login, com papel 'admin'. tipoNegocio é escolhido depois,
   * em {@link selecionarTipoNegocio} — por isso não é parâmetro aqui.
   */
  async criarUsuario(email: string, senha: string, nomeEmpresa: string): Promise<{ conta: Conta; usuario: Usuario }> {
    const dados = schemaCriarUsuario.parse({ email, senha, nomeEmpresa })

    const existente = await this.usuarios.buscarComCredenciaisPorEmail(dados.email)
    if (existente) throw new ErroConflito(`Já existe uma conta com o email "${dados.email}".`)

    const conta = await this.contas.criar({ nomeEmpresa: dados.nomeEmpresa, plano: 'startup', configuracoesGerais: {} })
    const senhaHash = await hashSenha(dados.senha)
    const usuario = await this.usuarios.criar({
      contaId: conta.id,
      email: dados.email,
      senhaHash,
      nome: dados.nomeEmpresa,
      papel: 'admin' as const,
      status: 'ativo',
      deveTrocarSenha: false,
    })

    logger.info({ contaId: conta.id, usuarioId: usuario.id }, 'Nova conta cadastrada.')
    return { conta, usuario }
  }

  /**
   * Confere email/senha e devolve usuário + conta prontos pra emissão
   * do JWT (auth.middleware, Tarefa 5). Mensagem de erro deliberadamente
   * idêntica para "email não existe" e "senha errada" — não dar pista
   * de qual das duas está errada evita enumeração de emails cadastrados.
   */
  async autenticar(email: string, senha: string): Promise<{ usuario: Usuario; conta: Conta }> {
    const dados = schemaAutenticar.parse({ email, senha })

    const credenciais = await this.usuarios.buscarComCredenciaisPorEmail(dados.email)
    if (!credenciais?.senhaHash || !(await verificarSenha(dados.senha, credenciais.senhaHash))) {
      throw new ErroNaoAutorizado('Email ou senha inválidos.')
    }
    if (credenciais.status !== 'ativo') {
      throw new ErroProibido('Este usuário está inativo ou suspenso.')
    }

    const { senhaHash: _senhaHashDescartado, ...usuario } = credenciais
    const conta = await this.contas.buscarPorId(usuario.contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', usuario.contaId)

    await this.usuarios.atualizar(usuario.id, { ultimoLoginEm: new Date() })
    logger.info({ usuarioId: usuario.id }, 'Login realizado.')
    return { usuario, conta }
  }

  /** Usuário + conta do usuário logado — usado por GET /auth/me. */
  async obterPerfilCompleto(userId: string): Promise<{ usuario: Usuario; conta: Conta }> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const conta = await this.contas.buscarPorId(usuario.contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', usuario.contaId)
    return { usuario, conta }
  }

  /**
   * Define o vertical de negócio da conta. Só o admin que abriu a
   * conta pode fazer essa escolha (é uma decisão estrutural, não
   * operacional). `descricaoPersonalizada` só se aplica a tipoNegocio
   * === 'outro' — é o texto livre que o admin digitou pra descrever o
   * negócio dele quando nenhuma vertical pronta encaixa; fica em
   * `configuracoesGerais.tipoNegocioDescricao`, mesmo raciocínio do
   * `logoUrl` em {@link atualizarBranding}.
   */
  async selecionarTipoNegocio(userId: string, tipoNegocio: TipoNegocio, descricaoPersonalizada?: string): Promise<Conta> {
    if (!TIPOS_NEGOCIO_VALIDOS.includes(tipoNegocio)) {
      throw new ErroValidacao(`Tipo de negócio inválido: "${tipoNegocio}".`)
    }

    const usuario = await this.buscarUsuarioOuFalhar(userId)
    if (usuario.papel !== 'admin') {
      throw new ErroProibido('Apenas o administrador da conta pode escolher o tipo de negócio.')
    }

    const conta = await this.contas.buscarPorId(usuario.contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', usuario.contaId)
    if (conta.tipoNegocio) {
      throw new ErroConflito('Esta conta já tem um tipo de negócio definido.')
    }

    await this.contas.atualizar(conta.id, { tipoNegocio })
    let contaComConfiguracoes = await this.criarConfiguracoesIniciais(userId, tipoNegocio)

    const descricao = descricaoPersonalizada?.trim()
    if (tipoNegocio === 'outro' && descricao) {
      contaComConfiguracoes = await this.contas.atualizar(conta.id, {
        configuracoesGerais: { ...contaComConfiguracoes.configuracoesGerais, tipoNegocioDescricao: descricao },
      })
    }

    logger.info({ contaId: conta.id, tipoNegocio }, 'Tipo de negócio selecionado.')
    return contaComConfiguracoes
  }

  /** Aplica os defaults de configuração do vertical escolhido, sem sobrescrever o que o usuário já tiver customizado. */
  async criarConfiguracoesIniciais(userId: string, tipoNegocio: TipoNegocio): Promise<Conta> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const conta = await this.contas.buscarPorId(usuario.contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', usuario.contaId)

    const configuracoesGerais = { ...CONFIGURACOES_PADRAO_POR_TIPO[tipoNegocio], ...conta.configuracoesGerais }
    return this.contas.atualizar(conta.id, { configuracoesGerais })
  }

  /** Configuração completa da conta do usuário logado — usado para hidratar o app no login. */
  async obterConfiguracoes(userId: string): Promise<Conta> {
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    const conta = await this.contas.buscarPorId(usuario.contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', usuario.contaId)
    return conta
  }

  async atualizarPerfil(userId: string, dados: { nome?: string; email?: string }): Promise<Usuario> {
    const validado = schemaAtualizarPerfil.parse(dados)
    await this.buscarUsuarioOuFalhar(userId)
    return this.usuarios.atualizar(userId, validado)
  }

  /**
   * Personalização de marca da conta: nome fantasia (reaproveita
   * `nomeEmpresa`) e logotipo (guardado em `configuracoesGerais.logoUrl`,
   * sem coluna própria — mesmo raciocínio de {@link criarConfiguracoesIniciais}).
   * Só o admin da conta altera, porque é branding pra toda a equipe, não
   * uma preferência pessoal. `logoUrl` aceita `null` pra remover o logo
   * salvo — por isso a checagem de presença usa `dados` (input bruto) e
   * não `validado` (zod omite chaves opcionais ausentes do resultado).
   */
  async atualizarBranding(userId: string, dados: { nomeEmpresa?: string; logoUrl?: string | null }): Promise<Conta> {
    const validado = schemaAtualizarBranding.parse(dados)
    const usuario = await this.buscarUsuarioOuFalhar(userId)
    if (usuario.papel !== 'admin') {
      throw new ErroProibido('Apenas o administrador da conta pode personalizar a marca.')
    }

    const conta = await this.contas.buscarPorId(usuario.contaId)
    if (!conta) throw new ErroNaoEncontrado('Conta', usuario.contaId)

    const atualizacao: Partial<Conta> = {}
    if (validado.nomeEmpresa !== undefined) atualizacao.nomeEmpresa = validado.nomeEmpresa
    if ('logoUrl' in dados) {
      atualizacao.configuracoesGerais = { ...conta.configuracoesGerais, logoUrl: validado.logoUrl ?? null }
    }

    const contaAtualizada = await this.contas.atualizar(conta.id, atualizacao)
    logger.info({ contaId: conta.id }, 'Marca da conta personalizada (nome/logo).')
    return contaAtualizada
  }

  /**
   * Troca a senha do usuário logado — exige a senha atual (que pode ser
   * a temporária gerada por um convite de cliente, ver
   * ConvitesService.criarClientePorConvite). Sempre zera
   * `deveTrocarSenha`, mesmo se já estava false, pra essa ser a única
   * saída do estado "senha temporária" no sistema.
   */
  async trocarSenha(userId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const validado = schemaTrocarSenha.parse({ senhaAtual, novaSenha })
    const credenciais = await this.usuarios.buscarComCredenciaisPorEmail((await this.buscarUsuarioOuFalhar(userId)).email)
    if (!credenciais?.senhaHash || !(await verificarSenha(validado.senhaAtual, credenciais.senhaHash))) {
      throw new ErroNaoAutorizado('Senha atual incorreta.')
    }

    const senhaHash = await hashSenha(validado.novaSenha)
    await this.usuarios.atualizar(userId, { senhaHash, deveTrocarSenha: false })
    logger.info({ usuarioId: userId }, 'Senha trocada pelo usuário.')
  }

  private async buscarUsuarioOuFalhar(userId: string): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(userId)
    if (!usuario) throw new ErroNaoEncontrado('Usuário', userId)
    return usuario
  }
}
