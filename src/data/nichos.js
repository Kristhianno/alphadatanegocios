import {
  IconBalloon, IconBuildingCommunity, IconCake, IconCamera, IconCandy, IconGift, IconHorseToy, IconMasksTheater, IconMoodKid,
  IconToolsKitchen2, IconTruck,
} from '@tabler/icons-react'

/**
 * Nichos de Festas & Eventos com o ícone de cada um — `id` igual ao de
 * server/src/config/segmentos-onboarding.config.ts. Usado na landing, no
 * painel da tela de login e no seletor de nicho do onboarding.
 */
export const NICHOS = [
  { id: 'salao-de-festas', label: 'Salão de Festas', icon: IconBuildingCommunity },
  { id: 'decoracao', label: 'Decoração', icon: IconBalloon },
  { id: 'fotografia-filmagem', label: 'Fotografia e Filmagem', icon: IconCamera },
  { id: 'personagens-vivos', label: 'Personagens Vivos', icon: IconMasksTheater },
  { id: 'recreacao', label: 'Recreação', icon: IconMoodKid },
  { id: 'aluguel-brinquedos', label: 'Aluguel de Brinquedos', icon: IconHorseToy },
  { id: 'aluguel-barracas-foodtruck', label: 'Barracas e Food Truck', icon: IconTruck },
  { id: 'lembrancinhas-convites', label: 'Lembrancinhas e Convites', icon: IconGift },
  { id: 'doces-personalizados', label: 'Doces Personalizados', icon: IconCandy },
  { id: 'salgados', label: 'Salgados', icon: IconToolsKitchen2 },
  { id: 'bolos-e-doces', label: 'Bolos e Doces', icon: IconCake },
]

export const ICONE_NICHO = Object.fromEntries(NICHOS.map((n) => [n.id, n.icon]))
