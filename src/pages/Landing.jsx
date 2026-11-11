import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowRight, IconBalloon, IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandWhatsapp,
  IconBuildingCommunity, IconCake, IconCalculator, IconCalendarEvent, IconCalendarX, IconCamera, IconCandy,
  IconCategory, IconCheck, IconChevronDown, IconConfetti, IconCrown, IconFileSpreadsheet, IconFileTypePdf,
  IconHeadset, IconHorseToy, IconMasksTheater, IconMoodKid, IconNotes, IconRefresh, IconRocket,
  IconToolsKitchen2, IconTruck, IconUsers, IconWallet, IconX,
} from '@tabler/icons-react'
import { useToast } from '../hooks/useToast'
import { api } from '../services/api'
import AlphaDataLogo from '../components/AlphaDataLogo'
import heroLaptop from '../assets/landing/hero-mockup-laptop.png'
import heroMobileMenu from '../assets/landing/hero-mockup-mobile-menu.png'
import heroMobileDashboard from '../assets/landing/hero-mockup-mobile-dashboard.png'

const AZUL = '#0052CC'
const AZUL_HOVER = '#004AAD'
const AZUL_CLARO = '#E8F0FF'
const CINZA_CLARO = '#F5F5F5'
const CINZA_TEXTO = '#333333'
const VERDE = '#10B981'
const VERDE_HOVER = '#0EA372'
const VERMELHO = '#EF4444'

const DORES = [
  { icon: IconBrandWhatsapp, texto: 'Pedido de orçamento perdido no meio de 50 conversas de WhatsApp' },
  { icon: IconCalendarX, texto: 'Medo de fechar duas festas na mesma data (ou esquecer uma)' },
  { icon: IconNotes, texto: 'Contrato em papel, sinal anotado no caderno e cliente jurando que já pagou' },
  { icon: IconFileSpreadsheet, texto: 'Planilha pra saber se a festa deu lucro, que nunca está atualizada' },
]

const ANTES_DEPOIS = [
  { antes: 'Orçamento (vai e volta no WhatsApp)', depois: 'Orçamento enviado e aprovado pelo cliente online' },
  { antes: 'Agenda de festas (caderno + memória)', depois: 'Calendário de eventos sem choque de data' },
  { antes: 'Contrato e sinal (papel + print de PIX)', depois: 'Contrato digital e controle do que já foi pago' },
  { antes: 'Lucro da festa (planilha)', depois: 'Financeiro de cada evento, sem fazer conta' },
]

const PASSOS = [
  { numero: '01', titulo: 'O cliente pede, você responde na hora', texto: 'Monte o orçamento a partir dos seus pacotes e envie. O cliente aprova online, sem vai e volta.' },
  { numero: '02', titulo: 'Fechou? A data fica travada', texto: 'Contrato digital, sinal registrado e o evento já entra no calendário da equipe.' },
  { numero: '03', titulo: 'Depois da festa, você sabe quanto lucrou', texto: 'Receitas e custos de cada evento num só lugar. No fim do mês, o resultado aparece sozinho.' },
]

/** Nichos atendidos — os mesmos cards do onboarding (server/src/config/segmentos-onboarding.config.ts). */
const NICHOS = [
  { icon: IconBuildingCommunity, label: 'Salão de Festas' },
  { icon: IconBalloon, label: 'Decoração' },
  { icon: IconCamera, label: 'Fotografia e Filmagem' },
  { icon: IconMasksTheater, label: 'Personagens Vivos' },
  { icon: IconMoodKid, label: 'Recreação' },
  { icon: IconHorseToy, label: 'Aluguel de Brinquedos' },
  { icon: IconTruck, label: 'Barracas e Food Truck' },
  { icon: IconCandy, label: 'Doces Personalizados' },
  { icon: IconToolsKitchen2, label: 'Salgados' },
  { icon: IconCake, label: 'Bolos e Doces' },
]

/** Um item de "por segmento" ganha o ícone do grupo de nichos em vez do check padrão. */
const SEGMENTOS_FEATURE = {
  eventos: { icon: IconConfetti, label: 'Espaços, decoração, recreação e locações' },
  doces: { icon: IconCake, label: 'Bolos, doces e salgados' },
  fotografia: { icon: IconCamera, label: 'Fotografia e filmagem' },
}

/** O que cada grupo de nichos recebe — seção "um sistema, cada negócio de festa". */
const GRUPOS_NICHO = [
  {
    ...SEGMENTOS_FEATURE.eventos,
    nichos: 'Salão de Festas, Decoração, Personagens Vivos, Recreação, Aluguel de Brinquedos, Barracas e Food Truck',
    recursos: ['Pacotes e agenda de eventos', 'Equipe e equipamentos de cada festa', 'Orçamentos, contratos e financeiro por evento'],
  },
  {
    ...SEGMENTOS_FEATURE.doces,
    nichos: 'Doces Personalizados, Salgados, Bolos e Doces',
    recursos: ['Catálogo de produtos e encomendas', 'Receitas com custo de produção', 'Estoque de ingredientes'],
  },
  {
    ...SEGMENTOS_FEATURE.fotografia,
    nichos: 'Fotografia e Filmagem de festas e eventos',
    recursos: ['Pacotes e agenda de sessões', 'Produções de vídeo e edição', 'Portfólio e galeria do cliente'],
  },
]

/** Carrossel do hero: os nichos + um item final convidando os demais serviços de festa. */
const SEGMENTOS_CARROSSEL = [...NICHOS, { icon: null, label: 'e outros serviços para festas' }]

/**
 * Conteúdo rico da vitrine de planos — mapeado por `Plano` técnico
 * (startup/profissional), os dois únicos planos com checkout self-service.
 */
const VITRINE_PLANOS = {
  startup: {
    subtitulo: 'Ideal para quem está começando a organizar o negócio',
    grupos: [
      {
        titulo: 'Agenda e clientes',
        icon: IconCalendarEvent,
        itens: [
          { texto: 'Calendário de eventos em tempo real, sem choque de data' },
          { texto: 'Catálogo de pacotes e serviços' },
          { texto: 'Cadastro de clientes com histórico de festas' },
        ],
      },
      {
        titulo: 'Recursos do seu segmento',
        icon: IconCategory,
        itens: [
          { segmento: 'eventos', texto: 'Pacotes e agenda de eventos' },
          { segmento: 'doces', texto: 'Catálogo, receitas e encomendas' },
          { segmento: 'fotografia', texto: 'Sessões e portfólio' },
        ],
      },
      {
        titulo: 'Equipe e suporte',
        icon: IconUsers,
        itens: [
          { texto: 'Até 3 pessoas na equipe' },
          { texto: 'Até 200 agendamentos por mês' },
          { texto: 'Até 200 contratos por mês' },
          { texto: 'Suporte por email' },
        ],
      },
    ],
  },
  profissional: {
    subtitulo: 'Para quem quer crescer sem esbarrar em limite',
    tudoDoAnterior: 'Tudo do Starter, para equipes maiores, e mais:',
    grupos: [
      {
        titulo: 'Gestão financeira completa',
        icon: IconWallet,
        itens: [
          { texto: 'Financeiro com contas a pagar e a receber', novo: true },
          { texto: 'Orçamentos com aprovação do cliente' },
          { texto: 'Contratos com assinatura digital', novo: true },
        ],
      },
      {
        titulo: 'Recursos avançados por segmento',
        icon: IconCalculator,
        itens: [
          { segmento: 'eventos', texto: 'Equipe, equipamentos e financeiro de cada evento' },
          { segmento: 'doces', texto: 'Controle de produção e estoque de ingredientes' },
          { segmento: 'fotografia', texto: 'Produções de vídeo, edição e galeria do cliente' },
        ],
      },
      {
        titulo: 'Relatórios, portal e suporte',
        icon: IconFileTypePdf,
        itens: [
          { texto: 'Relatórios com exportação em PDF e planilha' },
          { texto: 'Portal do cliente para acompanhar tudo online' },
          { texto: 'Suporte via email e WhatsApp', novo: true },
          { texto: 'Até 15 pessoas na equipe' },
          { texto: 'Agendamentos e contratos ilimitados', novo: true },
        ],
      },
    ],
  },
}

function formatarPreco(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PricingCard({ config, ciclo, destaque, onEscolher }) {
  const preco = ciclo === 'anual' ? config.precoAnualMensalCentavos : config.precoMensalCentavos
  const economiaPercentual = config.precoAnualMensalCentavos
    ? Math.round((1 - config.precoAnualMensalCentavos / config.precoMensalCentavos) * 100)
    : 0
  const vitrine = VITRINE_PLANOS[config.plano]

  return (
    <div
      className={`relative flex flex-col rounded-card p-6 sm:p-8 ${
        destaque
          ? 'bg-primary text-white shadow-cardHover ring-4 ring-primary-light md:scale-105 z-10'
          : 'bg-surface shadow-card border border-muted-dark'
      }`}
    >
      {ciclo === 'anual' && economiaPercentual > 0 && (
        <span
          className={`absolute -top-3 right-5 text-label font-bold rounded-btn px-2.5 py-1 shadow-cardHover ${
            destaque ? 'bg-white text-primary' : 'bg-success text-white'
          }`}
        >
          -{economiaPercentual}% no anual
        </span>
      )}

      {destaque && (
        <span className="self-start inline-flex items-center gap-1 text-label font-semibold bg-white/20 rounded-btn px-2.5 py-1 mb-3">
          <IconCrown size={14} /> Mais popular
        </span>
      )}

      <p className="text-h2 mb-1">{config.nomeMarketing}</p>
      <p className={`text-body mb-5 ${destaque ? 'text-blue-100' : 'text-[#666]'}`}>{vitrine.subtitulo}</p>

      <p className="mb-1 flex items-baseline gap-2 flex-wrap">
        {ciclo === 'anual' && (
          <span className={`text-body line-through ${destaque ? 'text-blue-200' : 'text-muted-text'}`}>
            {formatarPreco(config.precoMensalCentavos)}
          </span>
        )}
        <span className="text-h1">{formatarPreco(preco)}</span>
        <span className={destaque ? 'text-blue-100' : 'text-[#999]'}>/mês</span>
      </p>
      <p className={`text-label mb-6 ${destaque ? 'text-blue-100' : 'text-[#999]'}`}>
        {ciclo === 'anual' ? `cobrado uma vez por ano — ${formatarPreco(config.precoAnualTotalCentavos)}/ano` : 'cobrança mensal, cancele quando quiser'}
      </p>

      {vitrine.tudoDoAnterior && (
        <p className={`text-label font-semibold uppercase tracking-wide mb-4 ${destaque ? 'text-blue-100' : 'text-primary'}`}>
          {vitrine.tudoDoAnterior}
        </p>
      )}

      <div className="flex flex-col gap-5 mb-7 flex-1">
        {vitrine.grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <p className={`flex items-center gap-1.5 text-label font-bold uppercase tracking-wide mb-2 ${destaque ? 'text-blue-100' : 'text-[#999]'}`}>
              <grupo.icon size={15} />
              {grupo.titulo}
            </p>
            <ul className="flex flex-col gap-2">
              {grupo.itens.map((item) => {
                const seg = item.segmento ? SEGMENTOS_FEATURE[item.segmento] : null
                const ItemIcon = seg ? seg.icon : IconCheck
                return (
                  <li key={item.texto} className={`flex items-start gap-2 text-body ${destaque ? 'text-white' : 'text-[#333]'}`}>
                    <ItemIcon size={18} className={`shrink-0 mt-0.5 ${destaque ? 'text-white' : 'text-primary'}`} />
                    <span>
                      {seg && <span className="font-semibold">{seg.label}: </span>}
                      {item.texto}
                      {item.novo && (
                        <span className={`ml-1.5 align-middle text-[10px] font-bold uppercase rounded-btn px-1.5 py-0.5 ${destaque ? 'bg-white/25 text-white' : 'bg-primary-light text-primary'}`}>
                          Novo
                        </span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onEscolher}
        className={`rounded-btn py-2.5 text-body font-semibold transition-colors ${
          destaque ? 'bg-white text-primary hover:bg-blue-50' : 'bg-primary text-white hover:bg-primary-dark'
        }`}
      >
        Testar grátis por 7 dias
      </button>
      <p className={`text-label text-center mt-2 ${destaque ? 'text-blue-100' : 'text-[#999]'}`}>7 dias grátis, sem cartão de crédito</p>
    </div>
  )
}

const FAQ = [
  {
    pergunta: 'Serve pro meu tipo de negócio?',
    resposta: 'Se você trabalha com festas e eventos, sim: salão de festas, decoração, fotografia e filmagem, personagens vivos, recreação, aluguel de brinquedos, barracas e food truck, doces personalizados, salgados, bolos e doces. Na hora do cadastro você escolhe o seu, e o sistema monta o menu certo pra ele.',
  },
  { pergunta: 'Meu cliente consegue ver o orçamento e o contrato?', resposta: 'Sim. Ele recebe acesso ao portal do cliente, onde aprova orçamentos, vê os contratos e acompanha a festa dele.' },
  { pergunta: 'Consigo organizar a equipe e os equipamentos de cada festa?', resposta: 'Sim. Em cada evento você define quem trabalha e quais equipamentos vão, e vê tudo no calendário.' },
  { pergunta: 'Quanto tempo demora pra começar?', resposta: 'Uns 10 minutos. Você cadastra seus pacotes e clientes aos poucos, enquanto usa. Sem migração complicada.' },
  { pergunta: 'E se eu não quiser mais?', resposta: 'Você cancela direto pelas configurações, sem multa e sem aviso prévio. E pode exportar seus relatórios em PDF e planilha quando quiser.' },
  { pergunta: 'Meus dados ficam seguros?', resposta: 'Sim. A conexão é sempre criptografada (HTTPS) e cada empresa só enxerga os próprios dados.' },
]

function FaqItem({ item, aberta, onToggle }) {
  return (
    <div className="border-b border-[#E5E5E5]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base sm:text-lg font-semibold" style={{ color: CINZA_TEXTO }}>{item.pergunta}</span>
        <IconChevronDown
          size={20}
          className={`shrink-0 transition-transform duration-300 ${aberta ? 'rotate-180' : ''}`}
          style={{ color: AZUL }}
        />
      </button>
      {aberta && (
        <p className="pb-5 text-base leading-relaxed" style={{ color: '#555555' }}>{item.resposta}</p>
      )}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [faqAberta, setFaqAberta] = useState(0)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [enviandoLead, setEnviandoLead] = useState(false)

  const [planos, setPlanos] = useState(null)
  const [ciclo, setCiclo] = useState('mensal')

  useEffect(() => {
    api.get('/config/planos-disponiveis', { comAuth: false }).then(setPlanos).catch(() => setPlanos([]))
  }, [])

  function irParaCadastro(plano) {
    navigate('/cadastro', { state: { plano, ciclo } })
  }

  async function enviarLead(e) {
    e.preventDefault()
    setEnviandoLead(true)
    try {
      await api.post('/leads', { nome, email }, { comAuth: false })
      showToast('Recebemos seu contato — nossa equipe fala com você em breve!')
      setNome('')
      setEmail('')
    } catch {
      showToast('Não foi possível enviar. Tente novamente.', 'erro')
    } finally {
      setEnviandoLead(false)
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ color: CINZA_TEXTO }}>
      {/* 1. HEADER */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <AlphaDataLogo tagline={null} className="scale-75 origin-left" />
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#precos" className="hidden sm:block text-base font-medium hover:opacity-70 transition-opacity">Preços</a>
            <a href="#contato" className="hidden sm:block text-base font-medium hover:opacity-70 transition-opacity">Fale com a gente</a>
            <button
              type="button"
              onClick={() => irParaCadastro('startup')}
              className="rounded-[8px] text-white px-4 sm:px-5 py-2.5 text-base font-semibold transition-colors duration-300"
              style={{ backgroundColor: AZUL }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = AZUL_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = AZUL)}
            >
              Entrar grátis
            </button>
          </nav>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${AZUL} 0%, #003A94 60%, #002A6B 100%)` }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-5 text-white">
              O sistema de quem vive de festas e eventos: orçamento, agenda, contrato e lucro de cada festa num só lugar,{' '}
              <span style={{ color: VERDE }}>sem planilha</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: '#CFE0FF' }}>
              Chega de perder orçamento no WhatsApp, fechar festa sem contrato e descobrir só no fim do mês que o evento deu prejuízo.
            </p>

            <div className="flex flex-col gap-2.5 mb-8">
              <span className="text-sm font-semibold uppercase tracking-wide text-center lg:text-left" style={{ color: '#9FC1FA' }}>
                Feito sob medida pro seu tipo de negócio
              </span>
              <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                <div className="flex w-max gap-3 motion-safe:animate-marquee hover:[animation-play-state:paused]">
                  {[...SEGMENTOS_CARROSSEL, ...SEGMENTOS_CARROSSEL].map(({ icon: Icon, label }, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3.5 py-1.5 text-sm font-medium text-white bg-white/10 border border-white/25 whitespace-nowrap"
                    >
                      {Icon && <Icon size={16} />} {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-start gap-3">
              <button
                type="button"
                onClick={() => irParaCadastro('startup')}
                className="rounded-[8px] text-white px-8 py-4 text-lg font-semibold transition-colors duration-300 shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                style={{ backgroundColor: VERDE }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = VERDE_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = VERDE)}
              >
                COMECE GRÁTIS — SEM CARTÃO
              </button>
              <p className="text-sm" style={{ color: '#9FC1FA' }}>Setup em 10 minutos. Cancele quando quiser.</p>
              <a href="#contato" className="text-base font-semibold text-white underline underline-offset-2 hover:opacity-80">
                Ou agendar uma demo com seus dados
              </a>
            </div>
          </div>

          {/* Mobile: laptop em destaque + celulares lado a lado abaixo (evita sobreposição apertada em telas pequenas) */}
          <div className="sm:hidden flex flex-col items-center gap-5">
            <img src={heroLaptop} alt="Dashboard da AlphaData aberto num notebook" className="w-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.3)]" />
            <div className="flex justify-center gap-6">
              <img src={heroMobileMenu} alt="Menu do app AlphaData num celular" className="w-[38%] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]" />
              <img src={heroMobileDashboard} alt="Dashboard do app AlphaData num celular" className="w-[38%] drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]" />
            </div>
          </div>

          {/* sm+: composição em camadas — notebook em destaque com os dois celulares "apoiados" nos cantos de baixo */}
          <div className="hidden sm:block relative w-full max-w-[560px] mx-auto lg:mx-0 pb-10 lg:pb-12">
            <img src={heroLaptop} alt="Dashboard da AlphaData aberto num notebook" className="w-full drop-shadow-[0_25px_45px_rgba(0,0,0,0.35)]" />
            <img
              src={heroMobileMenu}
              alt="Menu do app AlphaData num celular"
              className="absolute z-10 w-[28%] -left-[5%] bottom-[-6%] rotate-[-7deg] drop-shadow-[0_16px_28px_rgba(0,0,0,0.35)]"
            />
            <img
              src={heroMobileDashboard}
              alt="Dashboard do app AlphaData num celular"
              className="absolute z-10 w-[28%] -right-[5%] bottom-[-2%] rotate-[7deg] drop-shadow-[0_16px_28px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>
      </section>

      {/* 4. O PROBLEMA */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-4xl font-bold text-center mb-12" style={{ color: CINZA_TEXTO }}>Você tá vivendo isso?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-12">
          {DORES.map(({ icon: Icon, texto }) => (
            <div key={texto} className="flex items-start gap-3 rounded-[8px] p-5" style={{ backgroundColor: CINZA_CLARO }}>
              <div className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
                <Icon size={18} style={{ color: VERMELHO }} />
              </div>
              <p className="text-base leading-relaxed" style={{ color: CINZA_TEXTO }}>{texto}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-lg font-semibold max-w-2xl mx-auto" style={{ color: CINZA_TEXTO }}>
          Resultado: <span style={{ color: VERMELHO }}>horas toda semana</span> perdidas em conversa, data confirmada errado e festa que fecha no prejuízo sem você perceber
        </p>
      </section>

      {/* 5. SOLUÇÃO (ANTES vs DEPOIS) */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: AZUL_CLARO }}>
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-12" style={{ color: CINZA_TEXTO }}>
            Tudo que você fazia em 5 lugares, agora funciona em um
          </h2>

          <div className="flex flex-col gap-4">
            {ANTES_DEPOIS.map((linha) => (
              <div
                key={linha.antes}
                className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center"
              >
                <div className="flex items-start gap-2.5">
                  <IconX size={20} className="shrink-0 mt-0.5" style={{ color: VERMELHO }} />
                  <p className="text-base" style={{ color: '#666666' }}>{linha.antes}</p>
                </div>
                <IconArrowRight size={22} className="hidden sm:block mx-auto rotate-90 sm:rotate-0" style={{ color: AZUL }} />
                <div className="flex items-start gap-2.5">
                  <IconCheck size={20} className="shrink-0 mt-0.5" style={{ color: VERDE }} />
                  <p className="text-base font-semibold" style={{ color: CINZA_TEXTO }}>{linha.depois}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COMO FUNCIONA */}
      <section id="como-funciona" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-4xl font-bold text-center mb-14" style={{ color: CINZA_TEXTO }}>Como funciona</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {PASSOS.map((passo) => (
            <div key={passo.numero} className="text-center sm:text-left">
              <p className="text-5xl font-bold mb-4" style={{ color: AZUL, opacity: 0.35 }}>{passo.numero}</p>
              <p className="text-xl font-bold mb-2" style={{ color: CINZA_TEXTO }}>{passo.titulo}</p>
              <p className="text-base leading-relaxed" style={{ color: '#666666' }}>{passo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. UM SISTEMA, CADA NEGÓCIO DE FESTA */}
      <section className="py-16 sm:py-24 text-white" style={{ backgroundColor: AZUL }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-3">Um sistema, cada negócio de festa do seu jeito</h2>
          <p className="text-base sm:text-lg text-center mb-12 max-w-2xl mx-auto" style={{ color: '#CFE0FF' }}>
            No cadastro você escolhe o que faz, e o menu já vem com as ferramentas certas pro seu dia a dia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {GRUPOS_NICHO.map(({ icon: Icon, label, nichos, recursos }) => (
              <div key={label} className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 flex flex-col">
                <div className="w-11 h-11 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: AZUL_CLARO }}>
                  <Icon size={22} style={{ color: AZUL }} />
                </div>
                <p className="text-lg font-bold mb-1" style={{ color: CINZA_TEXTO }}>{label}</p>
                <p className="text-sm mb-4" style={{ color: '#999999' }}>{nichos}</p>
                <ul className="flex flex-col gap-2 mt-auto">
                  {recursos.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-base" style={{ color: CINZA_TEXTO }}>
                      <IconCheck size={18} className="shrink-0 mt-0.5" style={{ color: VERDE }} /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. PLANOS & PRICING */}
      <section id="precos" className="bg-muted py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-h1 text-center text-[#1a1a1a] mb-2">Planos simples, sem letra miúda</h2>
          <p className="text-body text-[#666] text-center mb-5">Comece com 7 dias grátis. Cancele quando quiser, direto pelas configurações.</p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
            {[
              [IconRocket, '7 dias grátis para testar'],
              [IconRefresh, 'Cancele quando quiser'],
              [IconHeadset, 'Suporte incluso em todos os planos'],
            ].map(([Icon, texto]) => (
              <span key={texto} className="inline-flex items-center gap-1.5 text-label text-[#666]">
                <Icon size={16} className="text-primary" /> {texto}
              </span>
            ))}
          </div>

          <div className="flex justify-center mb-10">
            <div className="flex rounded-btn bg-surface shadow-card p-1">
              {[
                ['mensal', 'Mensal'],
                ['anual', 'Anual — economize'],
              ].map(([valor, rotulo]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setCiclo(valor)}
                  className={`rounded-btn px-4 py-2 text-body font-medium transition-colors ${
                    ciclo === valor ? 'bg-primary text-white' : 'text-[#666]'
                  }`}
                >
                  {rotulo}
                </button>
              ))}
            </div>
          </div>

          {planos === null ? (
            <p className="text-body text-[#999] text-center">Carregando planos...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-start pt-4">
              {planos.map((config) => (
                <PricingCard
                  key={config.plano}
                  config={config}
                  ciclo={ciclo}
                  destaque={config.plano === 'profissional'}
                  onEscolher={() => irParaCadastro(config.plano)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="max-w-[800px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <h2 className="text-2xl sm:text-4xl font-bold text-center mb-10" style={{ color: CINZA_TEXTO }}>Perguntas frequentes</h2>
        <div>
          {FAQ.map((item, i) => (
            <FaqItem key={item.pergunta} item={item} aberta={faqAberta === i} onToggle={() => setFaqAberta(faqAberta === i ? null : i)} />
          ))}
        </div>
      </section>

      {/* 10. CTA FINAL */}
      <section className="py-16 sm:py-24 text-white text-center" style={{ backgroundColor: AZUL }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold mb-8">Pronto pra organizar suas festas sem planilha e sem WhatsApp perdido?</h2>
          <button
            type="button"
            onClick={() => irParaCadastro('startup')}
            className="rounded-[8px] text-white px-8 py-4 text-lg font-semibold transition-colors duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)] mb-4"
            style={{ backgroundColor: VERDE }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = VERDE_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = VERDE)}
          >
            COMECE AGORA — SEM CARTÃO, SEM RISCO
          </button>
          <p className="text-sm" style={{ color: '#CFE0FF' }}>Teste 7 dias. Se não gostar, seus dados saem com você. Sem pergunta.</p>
        </div>
      </section>

      {/* Fale com a gente (destino de "Fale com a gente" no header e "Falar com vendas" do Enterprise) */}
      <section id="contato" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-[8px] p-6 sm:p-10 text-center" style={{ backgroundColor: AZUL_CLARO }}>
          <h2 className="text-2xl font-bold mb-2" style={{ color: CINZA_TEXTO }}>Prefere conversar antes?</h2>
          <p className="text-base mb-6" style={{ color: '#666666' }}>Deixa seu contato que nossa equipe te chama pra tirar dúvidas ou mostrar o sistema funcionando pro seu tipo de festa.</p>

          <form onSubmit={enviarLead} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="flex-1 rounded-[4px] border border-[#E5E5E5] px-3 py-2.5 text-base focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': AZUL }}
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 rounded-[4px] border border-[#E5E5E5] px-3 py-2.5 text-base focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': AZUL }}
            />
            <button
              type="submit"
              disabled={enviandoLead}
              className="rounded-[8px] text-white px-5 py-2.5 text-base font-semibold transition-colors duration-300 disabled:opacity-60 whitespace-nowrap"
              style={{ backgroundColor: AZUL }}
            >
              {enviandoLead ? 'Enviando...' : 'Fale comigo'}
            </button>
          </form>
        </div>
      </section>

      {/* 11. RODAPÉ */}
      <footer className="text-white" style={{ backgroundColor: CINZA_TEXTO }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 flex flex-col items-center gap-6">
          <AlphaDataLogo variant="branco" tagline={null} />

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <a href="#como-funciona" className="hover:opacity-70 transition-opacity">Produto</a>
            <a href="#precos" className="hover:opacity-70 transition-opacity">Preços</a>
            <a href="/privacidade" className="hover:opacity-70 transition-opacity">Segurança</a>
            <a href="#" className="hover:opacity-70 transition-opacity">Blog</a>
            <a href="#contato" className="hover:opacity-70 transition-opacity">Contato</a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="hover:opacity-70 transition-opacity"><IconBrandInstagram size={20} /></a>
            <a href="#" aria-label="LinkedIn" className="hover:opacity-70 transition-opacity"><IconBrandLinkedin size={20} /></a>
            <a href="#" aria-label="Facebook" className="hover:opacity-70 transition-opacity"><IconBrandFacebook size={20} /></a>
          </div>

          <p className="text-xs text-center" style={{ color: '#999999' }}>
            AlphaData® | CNPJ [CNPJ] | Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
