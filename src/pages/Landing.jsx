import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconCalendarEvent, IconCategory, IconCheck, IconClipboardList, IconFileTypePdf,
  IconMessageCircle, IconRocket, IconUserBolt, IconUsers,
} from '@tabler/icons-react'
import { useToast } from '../hooks/useToast'
import { api } from '../services/api'
import AlphaDataLogo from '../components/AlphaDataLogo'

const BENEFICIOS = [
  { icon: IconClipboardList, titulo: 'Ordens de serviço', texto: 'Abra, acompanhe e feche chamados com checklist, fotos e assinatura do cliente direto pelo celular.' },
  { icon: IconCalendarEvent, titulo: 'Agendamentos', texto: 'Sua equipe vê a agenda em tempo real e evita choque de horário sem trocar mensagem no grupo.' },
  { icon: IconCategory, titulo: 'Catálogo e pacotes', texto: 'Cadastre seus serviços ou pacotes uma vez e reutilize em cada novo atendimento.' },
  { icon: IconUsers, titulo: 'Clientes', texto: 'Histórico completo de cada cliente — o que já foi feito, quando e por quem.' },
  { icon: IconUserBolt, titulo: 'Equipe', texto: 'Cada técnico ou prestador vê só o que é dele, sem bagunça nem retrabalho.' },
  { icon: IconFileTypePdf, titulo: 'Relatórios', texto: 'Exporte em PDF ou planilha pra prestar contas sem perder tempo montando na mão.' },
]

function formatarPreco(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function PricingCard({ config, ciclo, destaque, onEscolher }) {
  const preco = ciclo === 'anual' ? config.precoAnualMensalCentavos : config.precoMensalCentavos
  return (
    <div className={`flex flex-col rounded-card p-6 sm:p-7 ${destaque ? 'bg-primary text-white shadow-cardHover' : 'bg-surface shadow-card border border-muted-dark'}`}>
      {destaque && <span className="self-start text-label font-semibold bg-white/20 rounded-btn px-2 py-0.5 mb-3">Mais popular</span>}
      <p className="text-h2 mb-1">{config.nomeMarketing}</p>
      <p className={`text-body mb-5 ${destaque ? 'text-blue-100' : 'text-[#666]'}`}>
        Agendamentos e ordens de serviço ilimitados
      </p>

      <p className="mb-1">
        <span className="text-h1">{formatarPreco(preco)}</span>
        <span className={destaque ? 'text-blue-100' : 'text-[#999]'}>/mês</span>
      </p>
      <p className={`text-label mb-6 ${destaque ? 'text-blue-100' : 'text-[#999]'}`}>
        {ciclo === 'anual' ? 'cobrado uma vez por ano' : 'cobrança mensal, cancele quando quiser'}
      </p>

      <ul className="flex flex-col gap-2 mb-7 flex-1">
        {config.recursos.map((r) => (
          <li key={r} className={`flex items-start gap-2 text-body ${destaque ? 'text-white' : 'text-[#333]'}`}>
            <IconCheck size={18} className={`shrink-0 mt-0.5 ${destaque ? 'text-white' : 'text-primary'}`} />
            {r}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onEscolher}
        className={`rounded-btn py-2.5 text-body font-semibold transition-colors ${
          destaque ? 'bg-white text-primary hover:bg-blue-50' : 'bg-primary text-white hover:bg-primary-dark'
        }`}
      >
        Testar grátis por 7 dias
      </button>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [planos, setPlanos] = useState(null)
  const [ciclo, setCiclo] = useState('mensal')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [enviandoLead, setEnviandoLead] = useState(false)

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
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur-sm border-b border-muted-dark">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <AlphaDataLogo tagline={null} className="scale-75 origin-left" />
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#precos" className="text-body text-[#333] hover:text-primary hidden sm:block">Planos</a>
            <a href="#contato" className="text-body text-[#333] hover:text-primary hidden sm:block">Fale com a gente</a>
            <a href="/login" className="text-body text-[#333] hover:text-primary">Entrar</a>
            <button
              type="button"
              onClick={() => irParaCadastro('startup')}
              className="rounded-btn bg-primary hover:bg-primary-dark text-white px-4 py-2 text-body font-semibold transition-colors"
            >
              Testar grátis
            </button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-blue-600 to-primary-dark text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 bg-white/15 rounded-btn px-3 py-1 text-label font-medium mb-5">
            <IconRocket size={16} /> 7 dias grátis, sem compromisso
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold max-w-3xl leading-tight mb-4">
            Organize os pedidos, agendamentos e a equipe do seu negócio em um só lugar
          </h1>
          <p className="text-body sm:text-lg text-blue-100 max-w-2xl mb-8">
            A plataforma que substitui a planilha e o grupo de WhatsApp bagunçado — do primeiro contato do cliente até o serviço entregue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => irParaCadastro('startup')}
              className="rounded-btn bg-white text-primary hover:bg-blue-50 px-6 py-3 text-body font-semibold transition-colors"
            >
              Testar grátis por 7 dias
            </button>
            <a
              href="#contato"
              className="rounded-btn border border-white/40 hover:bg-white/10 px-6 py-3 text-body font-semibold transition-colors"
            >
              Falar com a gente
            </a>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-h1 text-center text-[#1a1a1a] mb-2">Tudo que o seu negócio precisa, sem inventar mil planilhas</h2>
        <p className="text-body text-[#666] text-center max-w-xl mx-auto mb-12">Módulos prontos pra confeitaria, salão de festas, fotografia/vídeo, manutenção e outros tipos de negócio.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="rounded-card bg-muted p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
                <Icon size={22} className="text-primary" />
              </div>
              <p className="text-body font-semibold text-[#1a1a1a]">{titulo}</p>
              <p className="text-body text-[#666]">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="bg-muted py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-h1 text-center text-[#1a1a1a] mb-2">Planos simples, sem letra miúda</h2>
          <p className="text-body text-[#666] text-center mb-8">Comece com 7 dias grátis. Cancele quando quiser, direto pelas configurações.</p>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

      {/* Fale com a gente */}
      <section id="contato" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="rounded-card bg-primary-light p-6 sm:p-10 text-center">
          <IconMessageCircle size={32} className="text-primary mx-auto mb-3" />
          <h2 className="text-h1 text-[#1a1a1a] mb-2">Prefere conversar antes?</h2>
          <p className="text-body text-[#666] mb-6">Deixa seu contato que nossa equipe te chama pra tirar dúvidas sobre o plano ideal pro seu negócio.</p>

          <form onSubmit={enviarLead} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="flex-1 rounded-input border border-muted-dark px-3 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 rounded-input border border-muted-dark px-3 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={enviandoLead}
              className="rounded-btn bg-primary hover:bg-primary-dark text-white px-5 py-2.5 text-body font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {enviandoLead ? 'Enviando...' : 'Fale comigo'}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-muted-dark py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center gap-3">
          <AlphaDataLogo />
          <a href="/privacidade" className="text-label text-[#999] hover:text-primary">Política de Privacidade e Cookies</a>
          <p className="text-label text-[#999]">© 2026 ALPHADATA - Negócios</p>
        </div>
      </footer>
    </div>
  )
}
