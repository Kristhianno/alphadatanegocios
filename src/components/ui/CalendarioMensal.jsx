import { useMemo, useState } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import Modal from './Modal'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const MAX_VISIVEIS = 3

function formatarChave(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function diasDoGrid(ano, mes) {
  const primeiroDia = new Date(ano, mes, 1)
  const inicio = new Date(primeiroDia)
  inicio.setDate(inicio.getDate() - primeiroDia.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return d
  })
}

// Calendário mensal estilo Google Agenda: grid de dias com os eventos do
// dia como chips coloridos por status; clicar num chip abre o detalhe,
// e dias com muitos eventos ganham um "+N mais" que abre a lista completa.
export default function CalendarioMensal({ eventos, corStatus, onSelecionarEvento, dataAccessor = 'data', horaAccessor = 'hora', tituloAccessor = 'clienteNome' }) {
  const hoje = new Date()
  const [cursor, setCursor] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  const [diaExpandido, setDiaExpandido] = useState(null)

  const porDia = useMemo(() => {
    const mapa = {}
    for (const ev of eventos) {
      const chave = ev[dataAccessor]
      if (!mapa[chave]) mapa[chave] = []
      mapa[chave].push(ev)
    }
    for (const chave in mapa) mapa[chave].sort((a, b) => a[horaAccessor].localeCompare(b[horaAccessor]))
    return mapa
  }, [eventos, dataAccessor, horaAccessor])

  const dias = useMemo(() => diasDoGrid(cursor.getFullYear(), cursor.getMonth()), [cursor])
  const chaveHoje = formatarChave(hoje)
  const eventosDiaExpandido = diaExpandido ? (porDia[diaExpandido] ?? []) : []

  function corDoStatus(ev) {
    return corStatus?.[ev.status] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
  }

  return (
    <div className="bg-surface rounded-card shadow-card p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-h2 text-[#1a1a1a]">{MESES[cursor.getMonth()]} de {cursor.getFullYear()}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(hoje.getFullYear(), hoje.getMonth(), 1))}
            className="text-label font-medium rounded-btn px-3 py-1.5 border border-muted-dark hover:bg-muted"
          >
            Hoje
          </button>
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="p-1.5 rounded-btn border border-muted-dark hover:bg-muted"
            aria-label="Mês anterior"
          >
            <IconChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="p-1.5 rounded-btn border border-muted-dark hover:bg-muted"
            aria-label="Próximo mês"
          >
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-label font-semibold text-[#666]">
        {DIAS_SEMANA.map((d) => <div key={d} className="px-2 py-2 text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px bg-muted-dark border border-muted-dark rounded-input overflow-hidden">
        {dias.map((d) => {
          const chave = formatarChave(d)
          const doMes = d.getMonth() === cursor.getMonth()
          const eventosDoDia = porDia[chave] ?? []
          const eEhHoje = chave === chaveHoje
          return (
            <div key={chave} className={`min-h-[104px] p-1.5 flex flex-col gap-1 ${doMes ? 'bg-surface' : 'bg-muted/60'}`}>
              <span
                className={`text-label w-5 h-5 inline-flex items-center justify-center rounded-full ${
                  eEhHoje ? 'bg-primary text-white font-semibold' : doMes ? 'text-[#333]' : 'text-[#bbb]'
                }`}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-1">
                {eventosDoDia.slice(0, MAX_VISIVEIS).map((ev) => {
                  const cor = corDoStatus(ev)
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelecionarEvento(ev)}
                      title={`${ev[horaAccessor]} — ${ev[tituloAccessor]}`}
                      className={`text-left text-[11px] leading-tight truncate rounded px-1.5 py-1 ${cor.bg} ${cor.text} hover:opacity-80`}
                    >
                      {ev[horaAccessor]} {ev[tituloAccessor]}
                    </button>
                  )
                })}
                {eventosDoDia.length > MAX_VISIVEIS && (
                  <button
                    onClick={() => setDiaExpandido(chave)}
                    className="text-[11px] text-primary hover:underline text-left px-1.5"
                  >
                    +{eventosDoDia.length - MAX_VISIVEIS} mais
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={!!diaExpandido} onClose={() => setDiaExpandido(null)} title={diaExpandido ?? ''} size="sm">
        <div className="flex flex-col gap-2">
          {eventosDiaExpandido.map((ev) => {
            const cor = corDoStatus(ev)
            return (
              <button
                key={ev.id}
                onClick={() => {
                  setDiaExpandido(null)
                  onSelecionarEvento(ev)
                }}
                className="flex items-center justify-between gap-3 rounded-btn border border-muted-dark px-3 py-2 hover:bg-muted text-left"
              >
                <span className="text-body">
                  <span className="font-medium">{ev[horaAccessor]}</span> · {ev[tituloAccessor]}
                </span>
                <span className={`text-label font-medium rounded-full px-2 py-0.5 shrink-0 ${cor.bg} ${cor.text}`}>{ev.status}</span>
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
