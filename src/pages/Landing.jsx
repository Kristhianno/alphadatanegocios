import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowRight, IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandWhatsapp, IconCake,
  IconCalendarEvent, IconCalendarX, IconCamera, IconCheck, IconChevronDown, IconConfetti, IconCrown,
  IconFileSpreadsheet, IconHeadset, IconNotes, IconPuzzle, IconRefresh, IconRocket, IconUsers, IconX,
} from '@tabler/icons-react'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../hooks/useAuth'
import { destinoDoUsuario } from '../utils/destino'
import { api } from '../services/api'
import AlphaDataLogo from '../components/AlphaDataLogo'
import { CICLO_PADRAO, OPCOES_CICLO, ROTULO_CICLO, formatarPreco, precoMensalDoCiclo } from '../data/planos'
import { NICHOS } from '../data/nichos'
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
  { antes: 'Atendimento (você respondendo WhatsApp até de madrugada)', depois: 'IA responde 24h no WhatsApp, com texto e áudio' },
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

/** Um item de "por segmento" ganha o ícone do grupo de nichos em vez do check padrão. */
const SEGMENTOS_FEATURE = {
  eventos: { icon: IconConfetti, label: 'Espaços, decoração, animação e personalizados' },
  doces: { icon: IconCake, label: 'Bolos, doces e salgados' },
  fotografia: { icon: IconCamera, label: 'Fotografia e filmagem' },
}

/** O que cada grupo de nichos recebe — seção "um sistema, cada negócio de festa". */
const GRUPOS_NICHO = [
  {
    ...SEGMENTOS_FEATURE.eventos,
    nichos: 'Salão de Festas, Decoração, Personagens Vivos, Recreação, Aluguel de Brinquedos, Barracas e Food Truck, Lembrancinhas e Convites',
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
 * Conteúdo da vitrine de planos (proposta comercial de 2026-11) — mapeado
 * por `Plano` técnico (startup = Essencial, profissional = Completo).
 * Preços vêm da API (/config/planos-disponiveis); só os textos ficam aqui.
 * IA no WhatsApp, CRM em kanban e follow-up rodam na ferramenta externa
 * implantada pela ALPHADATA — este sistema é a parte de gestão do pacote.
 */
const VITRINE_PLANOS = {
  startup: {
    subtitulo: 'IA atendendo no WhatsApp, integrada ao sistema',
    grupos: [
      {
        titulo: 'IA no WhatsApp',
        icon: IconBrandWhatsapp,
        itens: [
          'Atendimento 24h com texto e áudio',
          'Orçamento e pacotes em PDF na conversa',
          'Agenda: consulta e reserva de datas',
          'Coleta dos dados do contrato',
        ],
      },
      {
        titulo: 'Sistema ALPHADATA',
        icon: IconCalendarEvent,
        itens: ['Integrado com a IA do WhatsApp', 'Agenda de eventos, orçamentos, contratos e financeiro', 'Módulos do seu tipo de negócio de festa'],
      },
    ],
    suporte: 'Suporte em horário comercial, resposta em até 48h úteis.',
  },
  profissional: {
    subtitulo: 'Pra não deixar nenhum cliente esfriar',
    tudoDoAnterior: 'Tudo do Essencial, e mais:',
    grupos: [
      {
        titulo: 'Vendas e acompanhamento',
        icon: IconUsers,
        itens: [
          'CRM em kanban com todos os contatos',
          'Follow-up: alerta após 3 dias sem resposta, com o resumo da conversa',
          'Reunião mensal de resultados',
        ],
      },
    ],
    suporte: 'Suporte prioritário, resposta em até 24h úteis.',
  },
}

function PricingCard({ config, ciclo, destaque, onEscolher }) {
  const preco = precoMensalDoCiclo(config, ciclo)
  const outroCiclo = ciclo === 'anual' ? 'mensal' : 'anual'
  const economiaMensal = config.precoMensalCentavos - config.precoAnualMensalCentavos
  const vitrine = VITRINE_PLANOS[config.plano]

  return (
    <div
      className={`relative flex flex-col rounded-card p-6 sm:p-8 ${
        destaque
          ? 'bg-primary text-white shadow-cardHover ring-4 ring-primary-light lg:scale-105 z-10'
          : 'bg-surface shadow-card border border-muted-dark'
      }`}
    >
      {ciclo === 'anual' && economiaMensal > 0 && (
        <span
          className={`absolute -top-3 right-5 text-label font-bold rounded-btn px-2.5 py-1 shadow-cardHover ${
            destaque ? 'bg-white text-primary' : 'bg-success text-white'
          }`}
        >
          economize {formatarPreco(economiaMensal)}/mês
        </span>
      )}

      {destaque && (
        <span className="self-start inline-flex items-center gap-1 text-label font-semibold bg-white/20 rounded-btn px-2.5 py-1 mb-3">
          <IconCrown size={14} /> Mais completo
        </span>
      )}

      <p className={`text-label font-bold uppercase tracking-widest mb-1 ${destaque ? 'text-blue-100' : 'text-primary'}`}>
        {config.nomeMarketing} · {config.descricaoCurta}
      </p>
      <p className={`text-body mb-5 ${destaque ? 'text-blue-100' : 'text-[#666]'}`}>{vitrine.subtitulo}</p>

      <p className="mb-1 flex items-baseline gap-2 flex-wrap">
        <span className="text-h1">{formatarPreco(preco)}</span>
        <span className={destaque ? 'text-blue-100' : 'text-[#999]'}>/mês</span>
      </p>
      <p className={`text-label mb-6 ${destaque ? 'text-blue-100' : 'text-[#999]'}`}>
        {ROTULO_CICLO[ciclo]} · {ROTULO_CICLO[outroCiclo]}: {formatarPreco(precoMensalDoCiclo(config, outroCiclo))}/mês
      </p>

      {vitrine.tudoDoAnterior && (
        <p className={`text-label font-semibold uppercase tracking-wide mb-4 ${destaque ? 'text-blue-100' : 'text-primary'}`}>
          {vitrine.tudoDoAnterior}
        </p>
      )}

      <div className="flex flex-col gap-5 mb-5 flex-1">
        {vitrine.grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <p className={`flex items-center gap-1.5 text-label font-bold uppercase tracking-wide mb-2 ${destaque ? 'text-blue-100' : 'text-[#999]'}`}>
              <grupo.icon size={15} />
              {grupo.titulo}
            </p>
            <ul className="flex flex-col gap-2">
              {grupo.itens.map((texto) => (
                <li key={texto} className={`flex items-start gap-2 text-body ${destaque ? 'text-white' : 'text-[#333]'}`}>
                  <IconCheck size={18} className={`shrink-0 mt-0.5 ${destaque ? 'text-white' : 'text-primary'}`} />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className={`flex items-start gap-2 text-label mb-6 ${destaque ? 'text-blue-100' : 'text-[#666]'}`}>
        <IconHeadset size={16} className="shrink-0 mt-0.5" /> {vitrine.suporte}
      </p>

      <button
        type="button"
        onClick={onEscolher}
        className={`rounded-btn py-2.5 text-body font-semibold transition-colors ${
          destaque ? 'bg-white text-primary hover:bg-blue-50' : 'bg-primary text-white hover:bg-primary-dark'
        }`}
      >
        Começar com o {config.nomeMarketing}
      </button>
      <p className={`text-label text-center mt-2 ${destaque ? 'text-blue-100' : 'text-[#999]'}`}>
        7 dias grátis no sistema, sem cartão. Implementação cobrada só ao assinar.
      </p>
    </div>
  )
}

/** "Monte seu plano" — sem checkout: leva pro formulário de contato. */
function CardPlanoEspecial() {
  return (
    <div className="flex flex-col rounded-card p-6 sm:p-8 bg-surface shadow-card border-2 border-dashed border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]">
      <p className="text-label font-bold uppercase tracking-widest mb-1 text-primary">Plano Especial · monte seu plano</p>
      <p className="text-body mb-5 text-[#666]">Precisa de algo diferente? A gente monta com você.</p>

      <p className="mb-1 flex items-center gap-2">
        <IconPuzzle size={28} className="text-primary" />
        <span className="text-h2 text-[#1a1a1a]">Sob consulta</span>
      </p>
      <p className="text-label mb-6 text-[#999]">valores de acordo com o que você escolher</p>

      <ul className="flex flex-col gap-2 mb-6 flex-1">
        {[
          'Combine os recursos do Essencial e do Completo do seu jeito',
          'Pensado pra operações com necessidades específicas',
          'Condições combinadas direto com o nosso time',
        ].map((texto) => (
          <li key={texto} className="flex items-start gap-2 text-body text-[#333]">
            <IconCheck size={18} className="shrink-0 mt-0.5 text-primary" />
            <span>{texto}</span>
          </li>
        ))}
      </ul>

      <a
        href="#contato"
        className="rounded-btn py-2.5 text-body font-semibold text-center border-2 border-primary text-primary hover:bg-primary-light transition-colors"
      >
        Falar com a gente
      </a>
      <p className="text-label text-center mt-2 text-[#999]">Respondemos e montamos a proposta com você.</p>
    </div>
  )
}

const FAQ = [
  {
    pergunta: 'Serve pro meu tipo de negócio?',
    resposta: 'Se você trabalha com festas e eventos, sim: salão de festas, decoração, fotografia e filmagem, personagens vivos, recreação, aluguel de brinquedos, barracas e food truck, lembrancinhas e convites, doces personalizados, salgados, bolos e doces. Na hora do cadastro você escolhe o seu, e o sistema monta o menu certo pra ele.',
  },
  {
    pergunta: 'Como funciona a IA no WhatsApp?',
    resposta: 'Ela atende seus clientes 24h com texto e áudio, envia orçamento e pacotes em PDF na conversa, consulta e reserva datas na agenda e coleta os dados do contrato, tudo integrado ao sistema ALPHADATA.',
  },
  {
    pergunta: 'O que está incluso na implementação?',
    resposta: 'A gente configura a IA no WhatsApp com os seus pacotes e preços e integra tudo ao sistema. É um investimento único de R$ 1.997, cobrado junto da primeira mensalidade.',
  },
  {
    pergunta: 'Qual a diferença entre o plano de 12 meses e o sem fidelidade?',
    resposta: 'No plano de 12 meses a mensalidade é menor e você fica com a gente por 12 meses. No sem fidelidade a mensalidade é um pouco maior e você pode cancelar quando quiser.',
  },
  { pergunta: 'Meu cliente consegue ver o orçamento e o contrato?', resposta: 'Sim. Ele recebe acesso ao portal do cliente, onde aprova orçamentos, vê os contratos e acompanha a festa dele.' },
  { pergunta: 'Consigo organizar a equipe e os equipamentos de cada festa?', resposta: 'Sim. Em cada evento você define quem trabalha e quais equipamentos vão, e vê tudo no calendário.' },
  { pergunta: 'Quanto tempo demora pra começar?', resposta: 'Uns 10 minutos. Você cadastra seus pacotes e clientes aos poucos, enquanto usa. Sem migração complicada.' },
  { pergunta: 'E se eu não quiser mais?', resposta: 'No plano sem fidelidade você cancela direto pelas configurações, sem multa. No plano de 12 meses vale o período contratado. Em ambos, você exporta seus relatórios em PDF e planilha quando quiser.' },
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
  const { isAuthenticated, user } = useAuth()

  function irParaPainel() {
    const { para, state } = destinoDoUsuario(user)
    navigate(para, state ? { state } : undefined)
  }

  const [faqAberta, setFaqAberta] = useState(0)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [enviandoLead, setEnviandoLead] = useState(false)

  const [planos, setPlanos] = useState(null)
  const [ciclo, setCiclo] = useState(CICLO_PADRAO)

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
            {!isAuthenticated && (
              <button type="button" onClick={() => navigate('/login')} className="text-base font-medium hover:opacity-70 transition-opacity">
                Entrar
              </button>
            )}
            <button
              type="button"
              onClick={isAuthenticated ? irParaPainel : () => irParaCadastro('startup')}
              className="rounded-[8px] text-white px-4 sm:px-5 py-2.5 text-base font-semibold transition-colors duration-300"
              style={{ backgroundColor: AZUL }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = AZUL_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = AZUL)}
            >
              {isAuthenticated ? 'Ir para o meu painel' : 'Testar grátis'}
            </button>
          </nav>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${AZUL} 0%, #003A94 60%, #002A6B 100%)` }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-5 text-white">
              Seu WhatsApp atendendo 24h com IA, e cada festa organizada do orçamento ao lucro,{' '}
              <span style={{ color: VERDE }}>sem planilha</span>
            </h1>
            <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: '#CFE0FF' }}>
              A IA responde seus clientes com texto e áudio, manda orçamento em PDF e reserva a data. O sistema ALPHADATA cuida da agenda, dos contratos e do financeiro de cada evento.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-h1 text-center text-[#1a1a1a] mb-2">Escolha o seu plano</h2>
          <p className="text-body text-[#666] text-center mb-5">IA atendendo no WhatsApp + o sistema ALPHADATA organizando cada festa.</p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
            {[
              [IconRocket, '7 dias grátis para testar o sistema'],
              [IconRefresh, 'Plano sem fidelidade disponível'],
              [IconHeadset, 'Suporte incluso em todos os planos'],
            ].map(([Icon, texto]) => (
              <span key={texto} className="inline-flex items-center gap-1.5 text-label text-[#666]">
                <Icon size={16} className="text-primary" /> {texto}
              </span>
            ))}
          </div>

          <div className="flex justify-center mb-10">
            <div className="flex rounded-btn bg-surface shadow-card p-1">
              {OPCOES_CICLO.map(([valor, rotulo]) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch pt-4">
              {planos.map((config) => (
                <PricingCard
                  key={config.plano}
                  config={config}
                  ciclo={ciclo}
                  destaque={config.plano === 'profissional'}
                  onEscolher={() => irParaCadastro(config.plano)}
                />
              ))}
              <CardPlanoEspecial />
            </div>
          )}

          {planos?.[0] && (
            <div className="mt-10 rounded-card bg-surface shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
              <div className="md:w-1/3">
                <p className="text-label font-bold uppercase tracking-widest text-primary mb-1">Implementação · investimento único</p>
                <p className="text-h1 text-[#1a1a1a]">{formatarPreco(planos[0].taxaImplementacaoCentavos)}</p>
              </div>
              <p className="text-body text-[#666] md:flex-1">
                A gente configura a IA no WhatsApp com os seus pacotes e preços e integra tudo ao sistema ALPHADATA. Vale para o Essencial e o
                Completo, e é cobrada uma única vez, junto da primeira mensalidade.
              </p>
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
