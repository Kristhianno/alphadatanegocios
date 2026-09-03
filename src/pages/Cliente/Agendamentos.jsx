import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarPlus, IconMapPin, IconList, IconCalendar } from '@tabler/icons-react'
import { useBranding } from '../../hooks/useBranding'
import { api, ApiError } from '../../services/api'
import Badge from '../../components/ui/Badge'
import CalendarioMensal from '../../components/ui/CalendarioMensal'

// Vocabulário real de StatusAgendamento (server/src/models/Agendamento.ts) —
// em snake_case, não bate com STATUS_CORES (data/mock.js), que é do
// vocabulário em português das telas mockadas de Ordens de Serviço.
const CORES_STATUS_AGENDAMENTO = {
  agendado: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  confirmado: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  em_andamento: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  concluido: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  cancelado: { bg: 'bg-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
}
const ROTULOS_STATUS_AGENDAMENTO = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

function paraChaveData(dataIso) {
  const d = new Date(dataIso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function paraHora(dataIso) {
  return new Date(dataIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Agendamentos() {
  const { nomeExibido } = useBranding()
  const navigate = useNavigate()
  const [agendamentos, setAgendamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [visualizacao, setVisualizacao] = useState('calendario')
  const [detalhe, setDetalhe] = useState(null)

  useEffect(() => {
    let cancelado = false
    api
      .get('/agendamentos')
      .then((lista) => {
        if (!cancelado) setAgendamentos(lista)
      })
      .catch((e) => {
        if (!cancelado) setErro(e instanceof ApiError ? e.message : 'Falha ao carregar agendamentos.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const eventosCalendario = useMemo(
    () =>
      agendamentos.map((a) => ({
        id: a.id,
        data: paraChaveData(a.dataHoraInicio),
        hora: paraHora(a.dataHoraInicio),
        titulo: ROTULOS_STATUS_AGENDAMENTO[a.status] ?? a.status,
        status: a.status,
        original: a,
      })),
    [agendamentos]
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Meus Agendamentos {nomeExibido}</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-btn border border-muted-dark overflow-hidden">
            <button
              onClick={() => setVisualizacao('calendario')}
              className={`flex items-center gap-1.5 px-3 py-2 text-label font-medium ${visualizacao === 'calendario' ? 'bg-primary text-white' : 'text-[#666] hover:bg-muted'}`}
            >
              <IconCalendar size={16} /> Calendário
            </button>
            <button
              onClick={() => setVisualizacao('lista')}
              className={`flex items-center gap-1.5 px-3 py-2 text-label font-medium ${visualizacao === 'lista' ? 'bg-primary text-white' : 'text-[#666] hover:bg-muted'}`}
            >
              <IconList size={16} /> Lista
            </button>
          </div>
          <button
            onClick={() => navigate('/cliente/agendar')}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium"
          >
            <IconCalendarPlus size={18} /> Novo Agendamento
          </button>
        </div>
      </div>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && agendamentos.length === 0 && <p className="text-body text-[#999]">Nenhum agendamento encontrado.</p>}

      {!carregando && !erro && agendamentos.length > 0 && (
        <>
          {visualizacao === 'calendario' ? (
            <CalendarioMensal
              eventos={eventosCalendario}
              corStatus={CORES_STATUS_AGENDAMENTO}
              tituloAccessor="titulo"
              onSelecionarEvento={(ev) => setDetalhe(ev.original)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agendamentos.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setDetalhe(a)}
                  className="text-left bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge status={a.status} cores={CORES_STATUS_AGENDAMENTO} label={ROTULOS_STATUS_AGENDAMENTO[a.status]} />
                  </div>
                  <p className="text-body font-semibold text-[#1a1a1a]">{new Date(a.dataHoraInicio).toLocaleString('pt-BR')}</p>
                  {a.endereco && (
                    <p className="text-label text-[#666] flex items-center gap-1 mt-1">
                      <IconMapPin size={13} /> {a.endereco}
                    </p>
                  )}
                  {a.observacoes && <p className="text-label text-[#666] mt-1">{a.observacoes}</p>}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetalhe(null)}>
          <div className="bg-surface w-full max-w-md rounded-card shadow-cardHover p-6 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <Badge status={detalhe.status} cores={CORES_STATUS_AGENDAMENTO} label={ROTULOS_STATUS_AGENDAMENTO[detalhe.status]} />
            </div>
            <p className="text-body font-semibold text-[#1a1a1a]">{new Date(detalhe.dataHoraInicio).toLocaleString('pt-BR')}</p>
            {detalhe.endereco && (
              <p className="text-body text-[#666] flex items-center gap-1">
                <IconMapPin size={14} /> {detalhe.endereco}
              </p>
            )}
            {detalhe.observacoes && <p className="text-body text-[#666]">{detalhe.observacoes}</p>}
            <button
              onClick={() => setDetalhe(null)}
              className="self-end rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300 mt-2"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
