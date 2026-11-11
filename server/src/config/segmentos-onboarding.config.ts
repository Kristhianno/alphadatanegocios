/**
 * Cards do seletor de tipo de negócio no onboarding — ver formato em
 * models/SegmentoOnboarding.ts. Nunca importado direto por
 * service/rota — sempre via utils/config-factory.ts.
 *
 * Desde o pivô de 2026-11 a plataforma atende só o segmento
 * **Festas & Eventos**: cada card é um nicho desse segmento, mapeado
 * para o template técnico (`tipoNegocio`) cujos módulos mais se
 * encaixam:
 * - salao_festas → pacotes, agenda de eventos, equipe/equipamentos,
 *   orçamentos, contratos, financeiro (serve espaços, decoração,
 *   recreação, personagens e locações);
 * - fotografia_video → sessões, produções de vídeo, portfólio;
 * - confeitaria → catálogo, receitas, pedidos, estoque.
 * O nome do card fica gravado em `configuracoesGerais.segmentoEscolhido`
 * (ver UserService.selecionarTipoNegocio) — é o "nicho" da conta.
 */
import type { SegmentoOnboarding } from '../models/SegmentoOnboarding.js'

/** Nome do único segmento atendido — exibido como título do seletor. */
export const SEGMENTO_ATENDIDO = 'Festas & Eventos'

export const SEGMENTOS_ONBOARDING: SegmentoOnboarding[] = [
  {
    id: 'salao-de-festas',
    nome: 'Salão de Festas',
    subtitulo: 'Espaços para festas, chácaras e buffets com salão próprio',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'decoracao',
    nome: 'Decoração',
    subtitulo: 'Decoração de festas, mesas temáticas, balões e cenografia',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'fotografia-filmagem',
    nome: 'Fotografia e Filmagem',
    subtitulo: 'Cobertura de festas e eventos, ensaios, vídeos e drone',
    tipoNegocio: 'fotografia_video',
  },
  {
    id: 'personagens-vivos',
    nome: 'Personagens Vivos',
    subtitulo: 'Personagens, cosplays e animadores para festas',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'recreacao',
    nome: 'Recreação',
    subtitulo: 'Recreadores, monitores e animação infantil',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'aluguel-brinquedos',
    nome: 'Aluguel de Brinquedos',
    subtitulo: 'Pula-pula, infláveis, piscina de bolinhas e jogos',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'aluguel-barracas-foodtruck',
    nome: 'Aluguel de Barracas e Food Truck',
    subtitulo: 'Barracas, tendas, carrinhos de comida e food trucks',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'doces-personalizados',
    nome: 'Doces Personalizados',
    subtitulo: 'Doces finos, temáticos e lembrancinhas comestíveis',
    tipoNegocio: 'confeitaria',
  },
  {
    id: 'salgados',
    nome: 'Salgados',
    subtitulo: 'Salgados para festas, coxinhas, mini lanches e encomendas',
    tipoNegocio: 'confeitaria',
  },
  {
    id: 'bolos-e-doces',
    nome: 'Bolos e Doces',
    subtitulo: 'Bolos decorados, bolos de festa e docinhos',
    tipoNegocio: 'confeitaria',
  },
  {
    id: 'outro',
    nome: 'Outro serviço para festas e eventos',
    tipoNegocio: 'outro',
  },
]
