import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarPlus, IconMapPin } from '@tabler/icons-react'
import { useBranding } from '../../hooks/useBranding'
import { api, ApiError } from '../../services/api'
import Badge from '../../components/ui/Badge'

export default function Agendamentos() {
  const { nomeExibido } = useBranding()
  const navigate = useNavigate()
  const [agendamentos, setAgendamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Meus Agendamentos {nomeExibido}</h1>
        <button
          onClick={() => navigate('/cliente/agendar')}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium"
        >
          <IconCalendarPlus size={18} /> Novo Agendamento
        </button>
      </div>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agendamentos.map((a) => (
            <div key={a.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge status={a.status} />
              </div>
              <p className="text-body font-semibold text-[#1a1a1a]">{new Date(a.dataHoraInicio).toLocaleString('pt-BR')}</p>
              {a.endereco && (
                <p className="text-label text-[#666] flex items-center gap-1 mt-1">
                  <IconMapPin size={13} /> {a.endereco}
                </p>
              )}
              {a.observacoes && <p className="text-label text-[#666] mt-1">{a.observacoes}</p>}
            </div>
          ))}
          {agendamentos.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhum agendamento encontrado.</p>}
        </div>
      )}
    </div>
  )
}
