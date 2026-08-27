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
import { PLANOS_COM_CHECKOUT } from '../config/planos.config.js'
import type { CicloCobranca, Conta, Plano, TipoNegocio, Usuario } from '../models/User.js'
import { ContaRepository } from '../repositories/ContaRepository.js'
import { UsuarioRepository } from '../repositories/UsuarioRepository.js'
import { hashSenha, verificarSenha } from '../utils/senha.js'
import { ErroConflito, ErroNaoAutorizado, ErroNaoEncontrado, ErroProibido, ErroValidacao } from '../errors/AppError.js'
import { logger } from '../utils/logger.js'

const TIPOS_NEGOCIO_VALIDOS = ['confeitaria', 'salao_festas', 'fotografia_video', 'manutencao', 'outro'] as const

/** Duração do teste grátis (local, sem Stripe) — ver criarUsuario/autenticarViaSupabase. */
const DURACAO_TRIAL_MS = 7 * 24 * 60 * 60 * 1000

const schemaCriarUsuario = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(8, 'A senha precisa de ao menos 8 caracteres.'),
  nomeEmpresa: z.string().trim().min(2, 'Informe o nome da empresa.'),
  /** Presentes quando o cadastro veio de um CTA de plano na landing — ver POST /auth/registrar. */
  plano: z.enum(PLANOS_COM_CHECKOUT as [Plano, ...Plano[]]).optional(),
  ciclo: z.enum(['mensal', 'anual']).optional(),
})

const schemaAutenticar = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(1, 'Informe a senha.'),
})

const schemaAutenticarViaSupabase = z.object({
  supabaseAccessToken: z.string().min(1, 'Token do Supabase ausente.'),
  novaSenha: z.string().min(8, 'A nova senha precisa de ao menos 8 caracteres.').optional(),
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

  constructor(private readonly client: Cliente) {
    this.contas = new ContaRepository(client)
    this.usuarios = new UsuarioRepository(client)
  }

  /**
   * Cadastro inicial: abre a conta (sem vertical ainda) e cria o
   * primeiro login, com papel 'admin'. tipoNegocio é escolhido depois,
   * em {@link selecionarTipoNegocio} — por isso não é parâmetro aqui.
   *
   * `plano`/`ciclo` já vêm escolhidos pela pessoa no formulário de
   * cadastro (ver Login.jsx) — sempre com um valor, mesmo pra quem não
   * veio de um CTA de plano na landing (default 'startup'/'mensal'
   * neste caso). O teste grátis de 7 dias roda inteiramente local, sem
   * Stripe e sem pedir cartão: `trialTerminaEm` é gravado aqui mesmo,
   * na hora do cadastro. `Conta.assinaturaPendente` (ver
   * ContaRepository.paraDominio/utils/assinatura.ts) só vira `true`
   * sozinho quando esse prazo passa sem uma assinatura paga ativa —
   * é isso que trava o dashboard (Layout.jsx) e manda pra `/checkout`
   * pedir cartão e escolher o plano final.
   */
  async criarUsuario(
    email: string,
    senha: string,
    nomeEmpresa: string,
    plano?: Plano,
    ciclo?: CicloCobranca,
  ): Promise<{ conta: Conta; usuario: Usuario }> {
    const dados = schemaCriarUsuario.parse({ email, senha, nomeEmpresa, plano, ciclo })

    const existente = await this.usuarios.buscarComCredenciaisPorEmail(dados.email)
    if (existente) throw new ErroConflito(`Já existe uma conta com o email "${dados.email}".`)

    const conta = await this.contas.criar({
      nomeEmpresa: dados.nomeEmpresa,
      plano: dados.plano ?? 'startup',
      configuracoesGerais: {},
      cicloCobranca: dados.ciclo ?? 'mensal',
      trialTerminaEm: new Date(Date.now() + DURACAO_TRIAL_MS),
    })
    const senhaHash = await hashSenha(dados.senha)
    let usuario = await this.usuarios.criar({
      contaId: conta.id,
      email: dados.email,
      senhaHash,
      nome: dados.nomeEmpresa,
      papel: 'admin' as const,
      status: 'ativo',
      deveTrocarSenha: false,
    })

    // Espelha o login no Supabase Auth pra habilitar "esqueci minha senha"
    // e a vinculação por email caso essa pessoa entre com Google depois.
    // Best-effort: uma falha aqui (rede, provider fora do ar, ou o email
    // já existir lá por causa do script de backfill) não pode derrubar
    // o cadastro — o login local por bcrypt continua funcionando de todo jeito.
    try {
      const { data: supabaseUser, error: erroSupabase } = await this.client.auth.admin.createUser({
        email: dados.email,
        password: dados.senha,
        email_confirm: true,
      })
      if (erroSupabase) {
        logger.warn({ erro: erroSupabase.message, email: dados.email }, 'Não foi possível espelhar o cadastro no Supabase Auth.')
      } else if (supabaseUser.user) {
        usuario = await this.usuarios.atualizar(usuario.id, { authUserId: supabaseUser.user.id })
      }
    } catch (erro) {
      logger.warn({ erro }, 'Falha ao espelhar o cadastro no Supabase Auth.')
    }

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

  /**
   * Autentica via uma identidade já confirmada pelo Supabase Auth
   * (retorno do login com Google, ou o link de "esqueci minha senha") e
   * devolve usuário + conta prontos pra emissão do MESMO JWT de sempre —
   * o Supabase só serve de verificador de identidade aqui, nunca vira o
   * tipo de sessão que o resto do app entende.
   *
   * Resolve o Usuario local em 3 passos: por `authUserId` (caminho
   * comum, depois da primeira vez); senão por `email` (linka uma conta
   * que já existia só com senha local, na primeira vez que ela usa
   * Google/reset); senão cria Conta+Usuario novos (equivalente a
   * {@link criarUsuario}, mas sem senha local — `senhaHash: null`).
   *
   * `novaSenha`, quando presente (fluxo de redefinição de senha),
   * também atualiza o hash bcrypt local — sem isso, o `/auth/login`
   * comum ficaria checando uma senha antiga depois de um reset feito
   * pelo Supabase.
   */
  async autenticarViaSupabase(supabaseAccessToken: string, novaSenha?: string): Promise<{ usuario: Usuario; conta: Conta }> {
    const dados = schemaAutenticarViaSupabase.parse({ supabaseAccessToken, novaSenha })

    const { data, error } = await this.client.auth.getUser(dados.supabaseAccessToken)
    if (error || !data.user) throw new ErroNaoAutorizado('Sessão do Supabase inválida ou expirada.')
    const identidade = data.user
    if (!identidade.email) throw new ErroValidacao('Não foi possível obter o email da conta do Supabase.')

    let usuario = await this.usuarios.buscarPorAuthUserId(identidade.id)
    if (!usuario) {
      const credenciais = await this.usuarios.buscarComCredenciaisPorEmail(identidade.email)
      if (credenciais) {
        const { senhaHash: _senhaHashDescartada, ...usuarioExistente } = credenciais
        usuario = await this.usuarios.atualizar(usuarioExistente.id, { authUserId: identidade.id })
      }
    }

    let conta: Conta
    if (usuario) {
      const contaExistente = await this.contas.buscarPorId(usuario.contaId)
      if (!contaExistente) throw new ErroNaoEncontrado('Conta', usuario.contaId)
      conta = contaExistente
    } else {
      const nomeFallback = identidade.email.split('@')[0] ?? 'Minha Empresa'
      const nomeEmpresa = (identidade.user_metadata?.['full_name'] as string | undefined)?.trim() || nomeFallback
      // Mesmo raciocínio de criarUsuario: teste grátis local de 7 dias, sem Stripe.
      // Plano/ciclo nascem no default (Starter/mensal) — dá pra trocar em
      // Configurações a qualquer momento durante o trial, sem precisar de cartão.
      conta = await this.contas.criar({
        nomeEmpresa,
        plano: 'startup',
        configuracoesGerais: {},
        cicloCobranca: 'mensal',
        trialTerminaEm: new Date(Date.now() + DURACAO_TRIAL_MS),
      })
      usuario = await this.usuarios.criar({
        contaId: conta.id,
        authUserId: identidade.id,
        email: identidade.email,
        senhaHash: null,
        nome: nomeEmpresa,
        papel: 'admin' as const,
        status: 'ativo',
        deveTrocarSenha: false,
      })
      logger.info({ contaId: conta.id, usuarioId: usuario.id }, 'Nova conta cadastrada via Supabase Auth (Google/redefinição).')
    }

    if (usuario.status !== 'ativo') throw new ErroProibido('Este usuário está inativo ou suspenso.')

    if (dados.novaSenha) {
      usuario = await this.usuarios.atualizar(usuario.id, { senhaHash: await hashSenha(dados.novaSenha) })
      logger.info({ usuarioId: usuario.id }, 'Senha local sincronizada após redefinição via Supabase.')
    }

    await this.usuarios.atualizar(usuario.id, { ultimoLoginEm: new Date() })
    logger.info({ usuarioId: usuario.id }, 'Login via Supabase Auth realizado.')
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
   * `logoUrl` em {@link atualizarBranding}. `segmentoEscolhido` é o
   * rótulo amigável do card clicado no seletor (ex: "Alimentação &
   * Encomendas") — `tipoNegocio` continua sendo o template técnico
   * (`confeitaria`) que resolve módulos/menu; o rótulo só fica
   * guardado em `configuracoesGerais.segmentoEscolhido` pra referência.
   */
  async selecionarTipoNegocio(
    userId: string,
    tipoNegocio: TipoNegocio,
    descricaoPersonalizada?: string,
    segmentoEscolhido?: string,
  ): Promise<Conta> {
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

    const configuracoesExtras: Record<string, unknown> = {}
    const descricao = descricaoPersonalizada?.trim()
    if (tipoNegocio === 'outro' && descricao) configuracoesExtras.tipoNegocioDescricao = descricao
    const segmento = segmentoEscolhido?.trim()
    if (segmento) configuracoesExtras.segmentoEscolhido = segmento

    if (Object.keys(configuracoesExtras).length > 0) {
      contaComConfiguracoes = await this.contas.atualizar(conta.id, {
        configuracoesGerais: { ...contaComConfiguracoes.configuracoesGerais, ...configuracoesExtras },
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
