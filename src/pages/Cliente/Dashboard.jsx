import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarEvent, IconListCheck, IconStar, IconHeadset, IconCalendarPlus } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import KpiCard from '../../components/ui/KpiCard'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import StarRating from '../../components/ui/StarRating'

export default function Dashboard() {
  const { user } = useAuth()
  const { nomeExibido } = useBranding()
  const { ordens } = useOrdensServico()
  const navigate = useNavigate()
  const [modalSuporte, setModalSuporte] = useState(false)

  const minhasOrdens = useMemo(() => ordens.filter((o) => o.clienteId === user.clienteId), [ordens, user.clienteId])

  const proxima = useMemo(
    () =>
      minhasOrdens
        .filter((o) => o.status !== 'Concluída' && o.status !== 'Cancelada')
        .sort((a, b) => (a.dataAgendada + a.hora).localeCompare(b.dataAgendada + b.hora))[0],
    [minhasOrdens]
  )

  const ultimaAvaliada = useMemo(
    () => [...minhasOrdens].filter((o) => o.avaliacao).sort((a, b) => b.dataAgendada.localeCompare(a.dataAgendada))[0],
    [minhasOrdens]
  )

  const ultimas5 = useMemo(() => [...minhasOrdens].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)).slice(0, 5), [minhasOrdens])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Bem-vindo à {nomeExibido}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={IconCalendarEvent}
          valor={proxima ? proxima.hora : '—'}
          label="Próxima OS"
          sublabel={proxima ? `${proxima.tipoServico} · ${proxima.tecnicoNome ?? 'A definir'}` : 'Nenhuma OS agendada'}
          cor="azul"
        />
        <KpiCard icon={IconListCheck} valor={minhasOrdens.length} label="Total de OS" sublabel="Todas as ordens" cor="verde" />
        <KpiCard
          icon={IconStar}
          valor={ultimaAvaliada ? ultimaAvaliada.avaliacao.estrelas : '—'}
          label="Última Avaliação"
          sublabel={ultimaAvaliada ? ultimaAvaliada.avaliacao.comentario.slice(0, 30) + '…' : 'Sem avaliações'}
          cor="laranja"
        />
        <div onClick={() => setModalSuporte(true)} className="cursor-pointer">
          <KpiCard icon={IconHeadset} valor="Suporte" label="Entrar em contato" sublabel="Telefone / email" cor="roxo" />
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <h2 className="text-h2 text-[#1a1a1a] mb-4">Últimas 5 Ordens</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">ID</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Serviço</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Data</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Status</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Ação</th>
              </tr>
            </thead>
            <tbody>
              {ultimas5.map((o) => (
                <tr key={o.id} className="border-t border-muted-dark hover:bg-primary-light/50">
                  <td className="px-4 py-2">{o.id}</td>
                  <td className="px-4 py-2">{o.tipoServico}</td>
                  <td className="px-4 py-2">{o.dataAgendada}</td>
                  <td className="px-4 py-2"><Badge status={o.status} /></td>
                  <td className="px-4 py-2">
                    <button onClick={() => navigate('/cliente/minhas-ordens')} className="text-primary hover:underline font-medium">Ver</button>
                  </td>
                </tr>
              ))}
              {ultimas5.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-[#999]">Nenhuma ordem registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => navigate('/cliente/agendar')}
        className="self-start flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-6 py-3 text-body font-semibold"
      >
        <IconCalendarPlus size={20} /> Agendar Novo Serviço
      </button>

      <Modal open={modalSuporte} onClose={() => setModalSuporte(false)} title={`Suporte ${nomeExibido}`} size="sm">
        <div className="flex flex-col gap-2 text-body">
          <p><span className="text-[#666]">Telefone:</span> (11) 4002-8922</p>
          <p><span className="text-[#666]">Email:</span> suporte@alphadata.com</p>
          <p><span className="text-[#666]">Horário:</span> Seg–Sex, 8h às 18h</p>
        </div>
      </Modal>
    </div>
  )
}
