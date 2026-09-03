import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconArrowRight, IconBrandFacebook, IconBrandInstagram, IconBrandLinkedin, IconBrandWhatsapp,
  IconCheck, IconChevronDown, IconCrown, IconFileSpreadsheet, IconMicrophone, IconNotes, IconX,
} from '@tabler/icons-react'
import { useToast } from '../hooks/useToast'
import { api } from '../services/api'
import AlphaDataLogo from '../components/AlphaDataLogo'
import heroMockup from '../assets/landing/hero-mockup.jpeg'

const AZUL = '#0052CC'
const AZUL_HOVER = '#004AAD'
const AZUL_CLARO = '#E8F0FF'
const CINZA_CLARO = '#F5F5F5'
const CINZA_TEXTO = '#333333'
const VERDE = '#10B981'
const VERDE_HOVER = '#0EA372'
const VERMELHO = '#EF4444'

const DORES = [
  { icon: IconBrandWhatsapp, texto: 'WhatsApp pra confirmar agendamento (e fica perdido em 50 conversas)' },
  { icon: IconFileSpreadsheet, texto: 'Planilha pra saber quanto ganhou (e fica confuso se fechou ou não)' },
  { icon: IconNotes, texto: 'Papel pra lembrar que o cliente pediu aquilo mês passado' },
  { icon: IconMicrophone, texto: 'Mensagem de voz pra avisar o time o que fazer' },
]

const ANTES_DEPOIS = [
  { antes: 'Agendamento (WhatsApp + ligação)', depois: 'Cliente agenda online + aviso automático' },
  { antes: 'Histórico do cliente (anotação + memória)', depois: 'Histórico completo, sempre à mão' },
  { antes: 'Faturamento (planilha)', depois: 'Dashboard automático no final do dia' },
  { antes: 'Equipe (grupos de WhatsApp)', depois: 'Tarefas automáticas, todos sabem o que fazer' },
]

const PASSOS = [
  { numero: '01', titulo: 'Seus clientes agora marcam sozinhos', texto: 'Eles veem horários livres, escolhem um, e você recebe aviso automático + número do cliente.' },
  { numero: '02', titulo: 'Quando voltam, você sabe tudo', texto: 'Histórico de todos os serviços dele, quanto pagou, do que reclamou. Atendimento perfeito.' },
  { numero: '03', titulo: 'No final do mês, sabe exatamente quanto lucrou', texto: 'Relatório automático mostra receita por serviço, por dia, por funcionário. Sem planilha.' },
]

const PLANOS_LANDING = [
  {
    nome: 'Starter',
    preco: 'R$ 49,90',
    plano: 'startup',
    paraQuem: 'Você sozinho ou com 1-2 pessoas',
    itens: ['Agendamento online 24/7', 'Histórico de cliente', 'Aviso via WhatsApp', 'Relatório básico'],
    cta: 'COMEÇAR GRÁTIS',
  },
  {
    nome: 'Profissional',
    preco: 'R$ 119,90',
    plano: 'profissional',
    recomendado: true,
    paraQuem: 'Negócio com 3-10 pessoas',
    itens: ['Tudo do Starter +', 'Gestão de equipe', 'Comissão automática', 'Relatório avançado', 'Suporte via WhatsApp'],
    cta: 'COMEÇAR GRÁTIS',
  },
  {
    nome: 'Enterprise',
    preco: 'Sob Consulta',
    paraQuem: '10+ pessoas ou múltiplas unidades',
    itens: ['Tudo do Profissional +', 'Integrações custom', 'API', 'Gestor de conta dedicado'],
    cta: 'FALAR COM VENDAS',
  },
]

const FAQ = [
  { pergunta: 'Quanto tempo demora pra migrar meus dados?', resposta: 'Sem migração complicada. Você adiciona clientes aos poucos enquanto usa. Começa hoje, migra no seu ritmo.' },
  { pergunta: 'Meu time vai conseguir usar sem treinamento?', resposta: 'Sim. A interface é tão simples que gerente de salão sem email usa. Enviamos 1 vídeo de 5 min se quiser.' },
  { pergunta: 'Integra com meu app de nota fiscal?', resposta: 'Integra com principais apps do mercado. E você exporta dados em Excel quando quiser.' },
  { pergunta: 'E se depois de 3 meses não quiser mais?', resposta: 'Seus dados saem com você em 1 clique. Sem punição, sem aviso prévio. Isso é teu.' },
  { pergunta: 'Meus dados ficam seguros?', resposta: 'Sim. Criptografia de ponta a ponta, backup automático diário, certificação de segurança.' },
]

const CLIENTES_PLACEHOLDER = ['Cliente 1', 'Cliente 2', 'Cliente 3', 'Cliente 4', 'Cliente 5', 'Cliente 6']

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

  function irParaCadastro(plano) {
    navigate('/cadastro', { state: { plano, ciclo: 'mensal' } })
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
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="text-center lg:text-left">
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-5" style={{ color: CINZA_TEXTO }}>
            Agendamento, histórico de cliente e faturamento — tudo que seu negócio de serviço precisa, num só lugar, sem planilha
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: '#555555' }}>
            Parou de ficar 2h digitando cliente em planilha, achando contato velho, e descobrindo no mês que lucrou menos que esperava.
          </p>

          <div className="flex flex-col items-center lg:items-start gap-3">
            <button
              type="button"
              onClick={() => irParaCadastro('startup')}
              className="rounded-[8px] text-white px-8 py-4 text-lg font-semibold transition-colors duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
              style={{ backgroundColor: VERDE }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = VERDE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = VERDE)}
            >
              COMECE GRÁTIS — SEM CARTÃO
            </button>
            <p className="text-sm" style={{ color: '#999999' }}>Setup em 10 minutos. Cancele quando quiser.</p>
            <a href="#contato" className="text-base font-semibold hover:underline" style={{ color: AZUL }}>
              Ou agendar uma demo com seus dados
            </a>
          </div>
        </div>

        <img
          src={heroMockup}
          alt="Donos de negócios de serviço usando a AlphaData para organizar agendamento, clientes e faturamento"
          className="w-full rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        />
      </section>

      {/* 3. PROVA SOCIAL */}
      <section className="py-14 sm:py-16" style={{ backgroundColor: CINZA_CLARO }}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-base font-semibold uppercase tracking-wide mb-8" style={{ color: '#999999' }}>
            Empresas que já usam e cresceram
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            {CLIENTES_PLACEHOLDER.map((cliente) => (
              <div
                key={cliente}
                className="bg-white rounded-[8px] h-16 flex items-center justify-center text-sm font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                style={{ color: '#999999' }}
              >
                {cliente}
              </div>
            ))}
          </div>
          <p className="text-2xl sm:text-3xl font-bold" style={{ color: AZUL }}>500+ negócios de serviço já confiam</p>
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

        <blockquote className="max-w-2xl mx-auto text-center border-l-4 pl-6 py-2 mb-10" style={{ borderColor: AZUL }}>
          <p className="text-xl sm:text-2xl italic font-medium mb-2" style={{ color: CINZA_TEXTO }}>
            "A gente só descobre que o mês não vai fechar na semana 3"
          </p>
          <cite className="text-sm not-italic" style={{ color: '#999999' }}>— Gerente de salão</cite>
        </blockquote>

        <p className="text-center text-lg font-semibold max-w-2xl mx-auto" style={{ color: CINZA_TEXTO }}>
          Resultado: <span style={{ color: VERMELHO }}>2-3 horas por dia</span> viram perda, confusão com cliente, receita que escapa
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

      {/* 7. CASE / RESULTADO */}
      <section className="py-16 sm:py-24 text-white" style={{ backgroundColor: AZUL }}>
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 text-center">
          <p className="text-5xl sm:text-6xl font-bold mb-3">25% mais faturamento</p>
          <p className="text-base sm:text-lg mb-12" style={{ color: '#CFE0FF' }}>
            Em média, clientes aumentam faturamento em 25% no primeiro trimestre
          </p>

          <div className="bg-white rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] p-6 sm:p-10 max-w-xl mx-auto">
            <p className="text-lg sm:text-xl italic font-medium mb-4" style={{ color: CINZA_TEXTO }}>
              "Florista em SP reduziu tempo de atendimento de 1h/dia pra 15 minutos. Faturamento subiu 25%."
            </p>
            <cite className="text-sm not-italic font-semibold" style={{ color: '#999999' }}>— Mariana, Dona da Flor Linda</cite>
          </div>
        </div>
      </section>

      {/* 8. PLANOS & PRICING */}
      <section id="precos" className="py-16 sm:py-24" style={{ backgroundColor: CINZA_CLARO }}>
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-bold text-center mb-2" style={{ color: CINZA_TEXTO }}>Planos simples, sem letra miúda</h2>
          <p className="text-base text-center mb-12" style={{ color: '#666666' }}>Comece grátis, sem cartão de crédito.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANOS_LANDING.map((p) => (
              <div
                key={p.nome}
                className={`relative flex flex-col rounded-[8px] p-6 sm:p-8 bg-white ${p.recomendado ? 'md:scale-105 z-10' : ''}`}
                style={{
                  boxShadow: p.recomendado ? '0 4px 12px rgba(0,0,0,0.16)' : '0 4px 12px rgba(0,0,0,0.08)',
                  border: p.recomendado ? `2px solid ${AZUL}` : '1px solid #E5E5E5',
                }}
              >
                {p.recomendado && (
                  <span
                    className="self-start inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide rounded-[6px] px-2.5 py-1 mb-4 text-white"
                    style={{ backgroundColor: AZUL }}
                  >
                    <IconCrown size={14} /> Recomendado
                  </span>
                )}

                <p className="text-xl font-bold mb-1" style={{ color: CINZA_TEXTO }}>{p.nome}</p>
                <p className="text-sm mb-5" style={{ color: '#999999' }}>{p.paraQuem}</p>

                <p className="mb-6 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold" style={{ color: CINZA_TEXTO }}>{p.preco}</span>
                  {p.plano && <span className="text-sm" style={{ color: '#999999' }}>/mês</span>}
                </p>

                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {p.itens.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm sm:text-base">
                      <IconCheck size={18} className="shrink-0 mt-0.5" style={{ color: VERDE }} />
                      <span style={{ color: CINZA_TEXTO }}>{item}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => (p.plano ? irParaCadastro(p.plano) : document.getElementById('contato')?.scrollIntoView({ behavior: 'smooth' }))}
                  className="rounded-[8px] py-3 text-base font-semibold transition-colors duration-300 text-white"
                  style={{ backgroundColor: p.recomendado ? VERDE : AZUL }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = p.recomendado ? VERDE_HOVER : AZUL_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = p.recomendado ? VERDE : AZUL)}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
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
          <h2 className="text-2xl sm:text-4xl font-bold mb-8">Pronto pra sair dessa rotina de planilha e WhatsApp?</h2>
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
          <p className="text-base mb-6" style={{ color: '#666666' }}>Deixa seu contato que nossa equipe te chama pra tirar dúvidas ou agendar uma demo com seus dados.</p>

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
