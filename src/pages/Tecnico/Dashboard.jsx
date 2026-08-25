import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { IconCalendarEvent, IconCurrencyReal, IconTarget, IconClock, IconPlayerPlay, IconMapPin } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { STATUS_OS, STATUS_CORES } from '../../data/mock'
import KpiCard from '../../components/ui/KpiCard'
import Badge from '../../components/ui/Badge'

export default function Dashboard() {
  const { user } = useAuth()
  const { ordens } = useOrdensServico()
  const navigate = useNavigate()

  const minhasOrdens = useMemo(() => ordens.filter((o) => o.tecnicoId === user.tecnicoId), [ordens, user.tecnicoId])
  const hoje = new Date().toISOString().slice(0, 10)

  const ordensHoje = minhasOrdens.filter((o) => o.dataAgendada === hoje)
  const ganhoHoje = ordensHoje.reduce((s, o) => s + o.valor, 0)
  const concluidas = minhasOrdens.filter((o) => o.status === 'Concluída').length
  const taxaConclusao = minhasOrdens.length ? Math.round((concluidas / minhasOrdens.length) * 100) : 0

  const proximas = useMemo(
    () =>
      minhasOrdens
        .filter((o) => o.status !== 'Concluída' && o.status !== 'Cancelada')
        .sort((a, b) => (a.dataAgendada + a.hora).localeCompare(b.dataAgendada + b.hora)),
    [minhasOrdens]
  )
  const proximaOrdem = proximas[0]

  const dadosPizza = STATUS_OS.map((status) => ({
    name: status,
    value: minhasOrdens.filter((o) => o.status === status).length,
    hex: STATUS_CORES[status].hex,
  })).filter((d) => d.value > 0)

  return (
    <div className="flex flex-col gap-6 pb-20">
      <h1 className="text-h1 text-primary">Meu Dashboard ALPHADATA</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={IconCalendarEvent} valor={ordensHoje.length} label="Ordens Hoje" sublabel="Programadas para hoje" cor="azul" />
        <KpiCard icon={IconCurrencyReal} valor={`R$ ${ganhoHoje}`} label="Ganho Estimado Hoje" sublabel="Este dia" cor="verde" />
        <KpiCard icon={IconTarget} valor={`${taxaConclusao}%`} label="Taxa de Conclusão" sublabel="Ordens finalizadas" cor="roxo" />
        <KpiCard
          icon={IconClock}
          valor={proximaOrdem ? proximaOrdem.hora : '—'}
          label="Próxima OS"
          sublabel={proximaOrdem ? `${proximaOrdem.clienteNome} · ${proximaOrdem.endereco}` : 'Nenhuma OS pendente'}
          cor="laranja"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface rounded-card shadow-card p-5">
          <h2 className="text-h2 text-[#1a1a1a] mb-4">Suas Ordens por Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={dadosPizza} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label>
                {dadosPizza.map((d) => <Cell key={d.name} fill={d.hex} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-card shadow-card p-5">
          <h2 className="text-h2 text-[#1a1a1a] mb-4">Próximas 5 Ordens</h2>
          <div className="flex flex-col gap-2">
            {proximas.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between border border-muted-dark rounded-card p-3">
                <div className="min-w-0">
                  <p className="text-body font-semibold truncate">{o.clienteNome}</p>
                  <p className="text-label text-[#666] truncate">{o.tipoServico} · {o.dataAgendada} {o.hora}</p>
                  <p className="text-label text-[#999] flex items-center gap-1 truncate"><IconMapPin size={12} /> {o.endereco}</p>
                </div>
                <button onClick={() => navigate(`/tecnico/detalhes/${o.id}`)} className="shrink-0 rounded-btn px-3 py-1.5 text-label font-medium bg-primary text-white hover:bg-primary-dark">
                  Ver Detalhes
                </button>
              </div>
            ))}
            {proximas.length === 0 && <p className="text-body text-[#999]">Nenhuma ordem pendente.</p>}
          </div>
        </div>
      </div>

      {proximaOrdem && (
        <button
          onClick={() => navigate(`/tecnico/detalhes/${proximaOrdem.id}`)}
          className="fixed bottom-6 right-6 flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-full shadow-cardHover px-5 py-3.5 text-body font-semibold z-20"
        >
          <IconPlayerPlay size={20} /> Iniciar Próxima Ordem
        </button>
      )}
    </div>
  )
}
