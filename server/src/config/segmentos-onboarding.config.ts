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
 *   recreação, personagens, locações e lembrancinhas/convites — pedido
 *   com data de festa, orçamento e sinal);
 * - fotografia_video → sessões, produções de vídeo, portfólio;
 * - confeitaria → catálogo, receitas, pedidos, estoque.
 * O nome do card fica gravado em `configuracoesGerais.segmentoEscolhido`
 * (ver UserService.selecionarTipoNegocio) — é o "nicho" da conta.
 */
import type { SegmentoOnboarding } from '../models/SegmentoOnboarding.js'

/** Nome do único segmento atendido — exibido como título do seletor. */
export const SEGMENTO_ATENDIDO = 'Festas & Eventos'

const ESPACO = 'Espaço e estrutura'
const ANIMACAO = 'Decoração e animação'
const PERSONALIZADOS = 'Papelaria e personalizados'
const COMIDA = 'Comida e doces'
const FOTO = 'Foto e vídeo'

/** Ordem = ordem de exibição (os grupos aparecem na ordem do primeiro card de cada um). */
export const SEGMENTOS_ONBOARDING: SegmentoOnboarding[] = [
  { id: 'salao-de-festas', grupo: ESPACO, nome: 'Salão de Festas', subtitulo: 'Espaços para festas, chácaras e buffets com salão próprio', tipoNegocio: 'salao_festas' },
  { id: 'aluguel-brinquedos', grupo: ESPACO, nome: 'Aluguel de Brinquedos', subtitulo: 'Pula-pula, infláveis, piscina de bolinhas e jogos', tipoNegocio: 'salao_festas' },
  { id: 'aluguel-barracas-foodtruck', grupo: ESPACO, nome: 'Barracas e Food Truck', subtitulo: 'Aluguel de barracas, tendas, carrinhos de comida e food trucks', tipoNegocio: 'salao_festas' },
  { id: 'decoracao', grupo: ANIMACAO, nome: 'Decoração', subtitulo: 'Mesas temáticas, balões e cenografia', tipoNegocio: 'salao_festas' },
  { id: 'personagens-vivos', grupo: ANIMACAO, nome: 'Personagens Vivos', subtitulo: 'Personagens, cosplays e animadores', tipoNegocio: 'salao_festas' },
  { id: 'recreacao', grupo: ANIMACAO, nome: 'Recreação', subtitulo: 'Recreadores, monitores e animação infantil', tipoNegocio: 'salao_festas' },
  { id: 'lembrancinhas-convites', grupo: PERSONALIZADOS, nome: 'Lembrancinhas e Convites', subtitulo: 'Lembrancinhas personalizadas, convites impressos e digitais, kits de festa', tipoNegocio: 'salao_festas' },
  { id: 'doces-personalizados', grupo: COMIDA, nome: 'Doces Personalizados', subtitulo: 'Doces finos, temáticos e lembrancinhas comestíveis', tipoNegocio: 'confeitaria' },
  { id: 'bolos-e-doces', grupo: COMIDA, nome: 'Bolos e Doces', subtitulo: 'Bolos decorados, bolos de festa e docinhos', tipoNegocio: 'confeitaria' },
  { id: 'salgados', grupo: COMIDA, nome: 'Salgados', subtitulo: 'Salgados para festas, mini lanches e encomendas', tipoNegocio: 'confeitaria' },
  { id: 'fotografia-filmagem', grupo: FOTO, nome: 'Fotografia e Filmagem', subtitulo: 'Cobertura de festas, ensaios, vídeos e drone', tipoNegocio: 'fotografia_video' },
  { id: 'outro', nome: 'Outro serviço para festas e eventos', subtitulo: 'Buffet, DJ, cerimonial, convites…', tipoNegocio: 'outro' },
]
