/**
 * Valores de configuração por vertical — o formato é definido em
 * models/TipoNegocioConfig.ts (Tarefa 2); aqui só os dados. Nunca
 * importado direto por service/rota — sempre via
 * utils/config-factory.ts (Tarefa 6), a única porta de entrada.
 *
 * `rota` em cada MenuItem aponta pra um endpoint que já existe de
 * verdade (routes/*.routes.ts, Tarefa 4) — não são placeholders.
 * `metadadosOrdem` é o mais especulativo dos campos: `ordens_servico`
 * (a tabela genérica do schema_shared) ainda não tem um service próprio
 * que a escreva — só os "ordens" específicos de cada vertical
 * (ordens_producao, ordens_manutencao) têm. Os campos abaixo descrevem
 * a intenção, não uma API que já existe.
 */
import type { CampoMetadado, MenuItem, TipoNegocioConfig } from '../models/TipoNegocioConfig.js'
import type { TipoNegocio } from '../models/User.js'

const EQUIPE_INTERNA = ['admin', 'gestor', 'tecnico'] as const

function itemDashboard(rota = '/dashboard'): MenuItem {
  return { id: 'dashboard', label: 'Dashboard', icone: '📊', rota }
}

function itemAgendamentos(): MenuItem {
  return { id: 'agendamentos', label: 'Agendamentos', icone: '📅', rota: '/agendamentos' }
}

function itemClientes(): MenuItem {
  return { id: 'clientes', label: 'Clientes', icone: '👥', rota: '/clientes', papeis: [...EQUIPE_INTERNA] }
}

function itemContratos(): MenuItem {
  return { id: 'contratos', label: 'Contratos', icone: '📜', rota: '/contratos' }
}

function itemServicos(label: string): MenuItem {
  return { id: 'servicos', label, icone: '🗂️', rota: '/servicos' }
}

const CONFEITARIA: TipoNegocioConfig = {
  tipo: 'confeitaria',
  nome: 'Confeitaria e Salgados',
  icone: '🧁',
  modulos: ['catalogo', 'receitas', 'pedidos', 'producao', 'estoque'],
  menuItems: [
    itemDashboard(),
    itemAgendamentos(),
    itemServicos('Catálogo'),
    { id: 'receitas', label: 'Receitas', icone: '📖', rota: '/confeitaria/receitas', papeis: [...EQUIPE_INTERNA] },
    { id: 'pedidos', label: 'Pedidos', icone: '🧾', rota: '/confeitaria/pedidos' },
    { id: 'estoque', label: 'Estoque', icone: '📦', rota: '/confeitaria/ingredientes', papeis: [...EQUIPE_INTERNA] },
    itemContratos(),
    itemClientes(),
  ],
  relatorios: ['custo-por-receita', 'margem-por-produto'],
  metadadosServico: {
    sabor: { tipo: 'texto', label: 'Sabor' },
    recheio: { tipo: 'texto', label: 'Recheio' },
    tamanho: { tipo: 'selecao', label: 'Tamanho', opcoes: ['P', 'M', 'G', 'Personalizado'] },
    tempoPreparacaoMinutos: { tipo: 'numero', label: 'Tempo de preparo (min)' },
    custoProducaoEstimado: { tipo: 'numero', label: 'Custo de produção estimado' },
  },
  metadadosOrdem: {
    observacoesProducao: { tipo: 'texto', label: 'Observações de produção' },
  },
}

const SALAO_FESTAS: TipoNegocioConfig = {
  tipo: 'salao_festas',
  nome: 'Salão de Festas / Eventos',
  icone: '🎉',
  modulos: ['pacotes', 'eventos', 'equipe', 'equipamentos', 'financeiro'],
  menuItems: [
    itemDashboard(),
    itemAgendamentos(),
    itemServicos('Pacotes'),
    { id: 'eventos', label: 'Eventos', icone: '🎪', rota: '/salao-festas/eventos' },
    { id: 'equipe-equipamentos', label: 'Equipe e Equipamentos', icone: '🧰', rota: '/salao-festas/eventos', papeis: [...EQUIPE_INTERNA] },
    itemContratos(),
    itemClientes(),
  ],
  relatorios: ['lucro-por-evento'],
  metadadosServico: {
    tipoEvento: {
      tipo: 'selecao',
      label: 'Tipo de evento',
      opcoes: ['aniversario', 'casamento', 'corporativo', 'formatura', 'confraternizacao', 'outro'],
    },
    capacidadeConvidados: { tipo: 'numero', label: 'Capacidade de convidados' },
    itensInclusos: { tipo: 'texto', label: 'Itens inclusos' },
  },
  metadadosOrdem: {
    equipeConfirmada: { tipo: 'booleano', label: 'Equipe confirmada' },
  },
}

const FOTOGRAFIA_VIDEO: TipoNegocioConfig = {
  tipo: 'fotografia_video',
  nome: 'Fotografia e Vídeo',
  icone: '📷',
  modulos: ['pacotes', 'sessoes', 'edicao', 'portfolio', 'galeria'],
  menuItems: [
    itemDashboard(),
    itemAgendamentos(),
    itemServicos('Pacotes'),
    { id: 'sessoes', label: 'Sessões', icone: '🖼️', rota: '/fotografia/sessoes' },
    { id: 'producoes-video', label: 'Produções de Vídeo', icone: '🎬', rota: '/fotografia/producoes-video', papeis: [...EQUIPE_INTERNA] },
    { id: 'portfolio', label: 'Portfólio', icone: '✨', rota: '/fotografia/sessoes', papeis: [...EQUIPE_INTERNA] },
    itemContratos(),
    itemClientes(),
  ],
  relatorios: ['sessoes-por-status'],
  metadadosServico: {
    tipoSessao: { tipo: 'selecao', label: 'Tipo de sessão', opcoes: ['ensaio', 'casamento', 'evento', 'produto', 'institucional', 'outro'] },
    quantidadeFotosInclusas: { tipo: 'numero', label: 'Quantidade de fotos inclusas' },
    horasInclusas: { tipo: 'numero', label: 'Horas inclusas' },
  },
  metadadosOrdem: {
    percentualEdicao: { tipo: 'numero', label: 'Percentual de edição concluído' },
  },
}

const MANUTENCAO: TipoNegocioConfig = {
  tipo: 'manutencao',
  nome: 'Manutenções Gerais',
  icone: '🔧',
  modulos: ['chamados', 'orcamentos', 'ordens', 'tecnicos', 'preventivas'],
  menuItems: [
    itemDashboard(),
    itemAgendamentos(),
    itemServicos('Tipos de Serviço'),
    { id: 'chamados', label: 'Chamados', icone: '🛎️', rota: '/manutencao/chamados' },
    { id: 'preventivas', label: 'Manutenções Preventivas', icone: '🗓️', rota: '/manutencao/preventivas', papeis: [...EQUIPE_INTERNA] },
    itemClientes(),
  ],
  relatorios: ['chamados-por-prioridade', 'valor-orcamentos'],
  metadadosServico: {
    categoriaManutencao: { tipo: 'selecao', label: 'Categoria', opcoes: ['preventiva', 'corretiva', 'emergencia'] },
    tempoEstimadoHoras: { tipo: 'numero', label: 'Tempo estimado (horas)' },
  },
  metadadosOrdem: {
    diagnostico: { tipo: 'texto', label: 'Diagnóstico' },
    recomendacoes: { tipo: 'texto', label: 'Recomendações' },
  },
}

const OUTRO: TipoNegocioConfig = {
  tipo: 'outro',
  nome: 'Outro tipo de negócio',
  icone: '🧩',
  modulos: ['catalogo'],
  menuItems: [itemDashboard(), itemAgendamentos(), itemServicos('Serviços'), itemClientes()],
  relatorios: [],
  metadadosServico: {} satisfies Record<string, CampoMetadado>,
  metadadosOrdem: {} satisfies Record<string, CampoMetadado>,
}

export const TIPOS_NEGOCIO_CONFIG: Record<TipoNegocio, TipoNegocioConfig> = {
  confeitaria: CONFEITARIA,
  salao_festas: SALAO_FESTAS,
  fotografia_video: FOTOGRAFIA_VIDEO,
  manutencao: MANUTENCAO,
  outro: OUTRO,
}
