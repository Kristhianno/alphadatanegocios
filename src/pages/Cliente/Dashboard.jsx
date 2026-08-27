import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarEvent, IconListCheck, IconHeadset, IconCalendarPlus } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
import { api, ApiError } from '../../services/api'
import { CONFIG_POR_VERTICAL } from './MeusRegistros'
import KpiCard from '../../components/ui/KpiCard'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

export default function Dashboard() {
  const { user } = useAuth()
  const { nomeExibido } = useBranding()
  const navigate = useNavigate()
  const [modalSuporte, setModalSuporte] = useState(false)

  const ehManutencao = user.tipoNegocio === 'manutencao'
  const configVertical = CONFIG_POR_VERTICAL[user.tipoNegocio]

  const [chamados, setChamados] = useState([])
  const [agendamentos, setAgendamentos] = useState([])
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false
    const pedidos = [ehManutencao ? api.get('/manutencao/chamados') : Promise.resolve([]), api.get('/agendamentos')]
    if (!ehManutencao && configVertical) pedidos.push(api.get(configVertical.recurso))

    Promise.all(pedidos)
      .then(([listaChamados, listaAgendamentos, listaRegistros]) => {
        if (cancelado) return
        setChamados(listaChamados)
        setAgendamentos(listaAgendamentos)
        setRegistros(listaRegistros ?? [])
      })
      .catch((e) => {
        if (!cancelado) setErro(e instanceof ApiError ? e.message : 'Falha ao carregar o dashboard.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [ehManutencao, configVertical])

  const chamadosAbertos = useMemo(() => chamados.filter((c) => c.status !== 'concluida' && c.status !== 'cancelado'), [chamados])
  const proximoAgendamento = useMemo(
    () => [...agendamentos].sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio))[0],
    [agendamentos]
  )
  const ultimosChamados = useMemo(() => [...chamados].sort((a, b) => b.criado_em?.localeCompare(a.criado_em)).slice(0, 5), [chamados])

  if (carregando) return <p className="text-body text-[#999]">Carregando...</p>
  if (erro) return <p className="text-body text-danger">{erro}</p>

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Bem-vindo à {nomeExibido}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={IconCalendarEvent}
          valor={proximoAgendamento ? new Date(proximoAgendamento.dataHoraInicio).toLocaleDateString('pt-BR') : '—'}
          label="Próximo agendamento"
          sublabel={proximoAgendamento ? proximoAgendamento.status : 'Nenhum agendamento'}
          cor="azul"
        />
        {ehManutencao ? (
          <>
            <KpiCard icon={IconListCheck} valor={chamados.length} label="Total de chamados" sublabel="Todos os chamados" cor="verde" />
            <KpiCard icon={IconListCheck} valor={chamadosAbertos.length} label="Em aberto" sublabel="Aguardando atendimento" cor="laranja" />
          </>
        ) : (
          <KpiCard icon={IconListCheck} valor={registros.length} label={configVertical?.titulo ?? 'Meus registros'} sublabel="Total" cor="verde" />
        )}
        <div onClick={() => setModalSuporte(true)} className="cursor-pointer">
          <KpiCard icon={IconHeadset} valor="Suporte" label="Entrar em contato" sublabel="Telefone / email" cor="roxo" />
        </div>
      </div>

      {ehManutencao && (
        <div className="bg-surface rounded-card shadow-card p-5">
          <h2 className="text-h2 text-[#1a1a1a] mb-4">Últimos Chamados</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Categoria</th>
                  <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Descrição</th>
                  <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Status</th>
                  <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {ultimosChamados.map((c) => (
                  <tr key={c.id} className="border-t border-muted-dark hover:bg-primary-light/50">
                    <td className="px-4 py-2 capitalize">{c.categoria_manutencao}</td>
                    <td className="px-4 py-2">{c.descricao}</td>
                    <td className="px-4 py-2"><Badge status={c.status} /></td>
                    <td className="px-4 py-2">
                      <button onClick={() => navigate('/cliente/minhas-ordens')} className="text-primary hover:underline font-medium">Ver</button>
                    </td>
                  </tr>
                ))}
                {ultimosChamados.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-[#999]">Nenhum chamado registrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/cliente/agendar')}
        className="self-start flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-6 py-3 text-body font-semibold"
      >
        <IconCalendarPlus size={20} /> {ehManutencao ? 'Abrir Novo Chamado' : 'Agendar Novo Serviço'}
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
