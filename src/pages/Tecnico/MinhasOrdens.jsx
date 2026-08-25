import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconMapPin, IconLayoutGrid, IconList, IconSearch } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { STATUS_OS } from '../../data/mock'
import Badge from '../../components/ui/Badge'

function tempoRestante(dataAgendada, hora) {
  const alvo = new Date(`${dataAgendada}T${hora || '00:00'}`)
  const diffMs = alvo - new Date()
  if (diffMs <= 0) return null
  const horas = Math.floor(diffMs / 3600000)
  if (horas >= 24) return `Faltam ${Math.floor(horas / 24)} dia(s)`
  if (horas >= 1) return `Faltam ${horas}h`
  return `Faltam ${Math.max(1, Math.floor(diffMs / 60000))} min`
}

const inputClasse = 'rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function MinhasOrdens() {
  const { user } = useAuth()
  const { ordens } = useOrdensServico()
  const navigate = useNavigate()

  const [status, setStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [busca, setBusca] = useState('')
  const [visualizacao, setVisualizacao] = useState('grid')

  const filtradas = useMemo(() => {
    return ordens.filter((o) => {
      if (o.tecnicoId !== user.tecnicoId) return false
      if (status && o.status !== status) return false
      if (dataInicio && o.dataAgendada < dataInicio) return false
      if (dataFim && o.dataAgendada > dataFim) return false
      if (busca && !`${o.id} ${o.clienteNome}`.toLowerCase().includes(busca.toLowerCase())) return false
      return true
    })
  }, [ordens, user.tecnicoId, status, dataInicio, dataFim, busca])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Minhas Ordens ALPHADATA</h1>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className={labelClasse}>Buscar (ID ou Cliente)</label>
          <div className="relative">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input className={`${inputClasse} pl-9 w-full`} value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClasse}>Status</label>
          <select className={inputClasse} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_OS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClasse}>De</label>
          <input type="date" className={inputClasse} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Até</label>
          <input type="date" className={inputClasse} value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-muted rounded-btn p-1">
          <button onClick={() => setVisualizacao('grid')} className={`p-1.5 rounded-btn ${visualizacao === 'grid' ? 'bg-white shadow-card' : ''}`}><IconLayoutGrid size={18} /></button>
          <button onClick={() => setVisualizacao('lista')} className={`p-1.5 rounded-btn ${visualizacao === 'lista' ? 'bg-white shadow-card' : ''}`}><IconList size={18} /></button>
        </div>
      </div>

      <div className={visualizacao === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
        {filtradas.map((o) => {
          const restante = o.status === 'Agendada' ? tempoRestante(o.dataAgendada, o.hora) : null
          return (
            <div key={o.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge>{o.id}</Badge>
                <Badge status={o.status} />
              </div>
              <p className="text-body font-semibold text-[#1a1a1a]">{o.clienteNome}</p>
              <p className="text-label text-[#666] mb-1">{o.tipoServico}</p>
              <p className="text-label text-[#666] flex items-center gap-1"><IconMapPin size={13} /> {o.endereco}</p>
              <p className="text-label text-[#999] mt-1">{o.dataAgendada} · {o.hora}</p>
              {restante && <p className="text-label text-primary font-medium mt-1">{restante}</p>}
              <button
                onClick={() => navigate(`/tecnico/detalhes/${o.id}`)}
                className="w-full mt-3 rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark"
              >
                Ver Detalhes
              </button>
            </div>
          )
        })}
        {filtradas.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhuma ordem encontrada.</p>}
      </div>
    </div>
  )
}
