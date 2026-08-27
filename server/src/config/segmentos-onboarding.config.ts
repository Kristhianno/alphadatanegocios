/**
 * Cards do seletor de segmento no onboarding — ver formato em
 * models/SegmentoOnboarding.ts. Nunca importado direto por
 * service/rota — sempre via utils/config-factory.ts.
 */
import type { SegmentoOnboarding } from '../models/SegmentoOnboarding.js'

export const SEGMENTOS_ONBOARDING: SegmentoOnboarding[] = [
  {
    id: 'alimentacao-encomendas',
    nome: 'Alimentação & Encomendas',
    subtitulo: 'Confeitaria, Salgados, Marmitas, Padarias Artesanais, Docerias, Restaurantes, Buffet',
    tipoNegocio: 'confeitaria',
  },
  {
    id: 'espacos-locacao-estruturas',
    nome: 'Espaços & Locação de Estruturas',
    subtitulo: 'Salão de Festas, Coworking, Locação de Brinquedos, Equipamentos Diversos, Chácaras, Quadras',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'saude-bem-estar',
    nome: 'Saúde & Bem-Estar',
    subtitulo: 'Clínicas de Estética, Salões de Beleza, Estúdios de Pilates, Spas, Personal Trainers',
    tipoNegocio: 'salao_festas',
  },
  {
    id: 'servicos-criativos-producao',
    nome: 'Serviços Criativos & Produção',
    subtitulo: 'Fotografia e Vídeo, Design Gráfico, Tatuadores, Estúdios',
    tipoNegocio: 'fotografia_video',
  },
  {
    id: 'ordens-servico-manutencao',
    nome: 'Ordens de Serviço & Manutenção',
    subtitulo: 'Manutenções Gerais, Assistência Técnica, Ar Condicionado, Oficinas',
    tipoNegocio: 'manutencao',
  },
  {
    id: 'outro',
    nome: 'Outro tipo de negócio',
    tipoNegocio: 'outro',
  },
]
