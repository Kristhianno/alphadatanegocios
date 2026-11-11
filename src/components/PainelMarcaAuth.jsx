import { IconBrandWhatsapp, IconCalendarCheck, IconConfetti, IconFileDollar } from '@tabler/icons-react'
import { NICHOS } from '../data/nichos'

const DESTAQUES = [
  { icon: IconBrandWhatsapp, titulo: 'IA no WhatsApp, 24h', texto: 'Responde com texto e áudio, manda orçamento em PDF e reserva a data.' },
  { icon: IconCalendarCheck, titulo: 'Agenda sem choque de data', texto: 'Cada festa fechada já entra no calendário da equipe.' },
  { icon: IconFileDollar, titulo: 'Contrato e lucro de cada evento', texto: 'Orçamentos, contratos e financeiro num só lugar.' },
]

/**
 * Lado direito da tela de entrar/criar conta (só em telas largas): a
 * proposta de Festas & Eventos e os nichos atendidos — substitui as
 * fotos genéricas de outros tipos de comércio que ficavam aqui.
 */
export default function PainelMarcaAuth({ className = '' }) {
  return (
    <aside
      className={`relative overflow-hidden flex-col justify-between gap-10 text-white p-10 xl:p-14 ${className}`}
      style={{ background: 'linear-gradient(140deg, #0052CC 0%, #003A94 55%, #002A6B 100%)' }}
    >
      {/* Formas decorativas */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-10 -left-16 h-56 w-56 rounded-full bg-[#10B981]/20 blur-3xl" aria-hidden="true" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-label font-semibold uppercase tracking-wide">
          <IconConfetti size={14} /> Festas & Eventos
        </span>
        <h2 className="mt-6 max-w-lg text-[28px] xl:text-[34px] font-bold leading-tight">
          Seu WhatsApp atendendo 24h com IA, e cada festa organizada do orçamento ao lucro.
        </h2>

        <ul className="mt-9 flex max-w-lg flex-col gap-5">
          {DESTAQUES.map(({ icon: Icon, titulo, texto }) => (
            <li key={titulo} className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-white/15">
                <Icon size={22} />
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{titulo}</span>
                <span className="block text-body text-blue-100">{texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-blue-200">Feito para</p>
        <div className="flex flex-wrap gap-2">
          {NICHOS.map(({ id, label, icon: Icon }) => (
            <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-label text-white/90">
              <Icon size={14} /> {label}
            </span>
          ))}
        </div>
      </div>
    </aside>
  )
}
