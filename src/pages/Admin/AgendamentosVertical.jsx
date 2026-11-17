import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconPlus, IconTrash, IconMapPin, IconList, IconCalendar, IconLock } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { api } from '../../services/api'
import { temCrm } from '../../data/planos'
import {
  AGENDAMENTOS_CONFEITARIA, AGENDAMENTOS_SALAO, AGENDAMENTOS_FOTOGRAFIA,
  CLIENTES_CONFEITARIA, CLIENTES_SALAO, CLIENTES_FOTOGRAFIA,
  PRODUTOS_CONFEITARIA, PACOTES_SALAO, PACOTES_FOTOGRAFIA,
  STATUS_AGENDAMENTO, STATUS_AGENDAMENTO_CORES,
} from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import CalendarioMensal from '../../components/ui/CalendarioMensal'
import Selecao from '../../components/ui/Selecao'
import SeletorStatus from '../../components/ui/SeletorStatus'

// Festa fechada no CRM (contrato assinado + sinal pago): entra no calendário travada.
const STATUS_FESTA_FECHADA = 'Festa fechada'
const CORES_STATUS = { ...STATUS_AGENDAMENTO_CORES, [STATUS_FESTA_FECHADA]: { bg: 'bg-emerald-600', text: 'text-white', dot: 'bg-emerald-600' } }

function festaFechadaDoLead(lead) {
  return {
    id: `crm-${lead.id}`, fechada: true, clienteNome: lead.nome, tipoServico: lead.tipoEvento || 'Festa fechada',
    data: lead.dataEvento, hora: '', endereco: null, status: STATUS_FESTA_FECHADA,
  }
}

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

// Mesma tela pros 3 verticais que ainda não têm agenda própria — só o
// dataset/rótulos mudam, a forma do agendamento é genérica de verdade
// (cliente, tipo de serviço, data/hora, status).
const CONFIG_POR_VERTICAL = {
  confeitaria: { storageKey: 'alphadata_agendamentos_confeitaria', mock: AGENDAMENTOS_CONFEITARIA, clientes: CLIENTES_CONFEITARIA, servicos: PRODUTOS_CONFEITARIA.map((p) => p.nome) },
  salao_festas: { storageKey: 'alphadata_agendamentos_salao', mock: AGENDAMENTOS_SALAO, clientes: CLIENTES_SALAO, servicos: PACOTES_SALAO.map((p) => p.nome) },
  fotografia_video: { storageKey: 'alphadata_agendamentos_fotografia', mock: AGENDAMENTOS_FOTOGRAFIA, clientes: CLIENTES_FOTOGRAFIA, servicos: PACOTES_FOTOGRAFIA.map((p) => p.nome) },
}

function proximoId(lista, prefixo) {
  const max = lista.reduce((acc, a) => {
    const n = Number(a.id.replace(`${prefixo}-`, ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `${prefixo}-${String(max + 1).padStart(3, '0')}`
}

export default function AgendamentosVertical() {
  const { user } = useAuth()
  const config = CONFIG_POR_VERTICAL[user?.tipoNegocio] ?? CONFIG_POR_VERTICAL.confeitaria
  const prefixoId = config.storageKey.includes('confeitaria') ? 'AGD-CF' : config.storageKey.includes('salao') ? 'AGD-SL' : 'AGD-FT'

  const [agendamentos, setAgendamentos] = usePersisted(config.storageKey, config.mock)
  const { showToast } = useToast()
  const [festasFechadas, setFestasFechadas] = useState([])

  useEffect(() => {
    if (!temCrm(user)) return
    let cancelado = false
    api
      .get('/crm/leads')
      .then((leads) => {
        if (!cancelado) setFestasFechadas(leads.filter((l) => l.etapa === 'concluido' && l.dataEvento).map(festaFechadaDoLead))
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [user])

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [visualizacao, setVisualizacao] = useState('calendario')
  const [modalCriar, setModalCriar] = useState(false)
  const [paraDeletar, setParaDeletar] = useState(null)
  const [detalhe, setDetalhe] = useState(null)

  const [clienteId, setClienteId] = useState(config.clientes[0]?.id ?? '')
  const [tipoServico, setTipoServico] = useState(config.servicos[0] ?? '')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('09:00')
  const [endereco, setEndereco] = useState('')

  const filtrados = useMemo(() => {
    let lista = [...festasFechadas, ...agendamentos].filter((a) => a.clienteNome.toLowerCase().includes(busca.toLowerCase()))
    if (filtroStatus) lista = lista.filter((a) => a.status === filtroStatus)
    return [...lista].sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora))
  }, [agendamentos, festasFechadas, busca, filtroStatus])

  function handleCriar(e) {
    e.preventDefault()
    const cliente = config.clientes.find((c) => c.id === clienteId)
    const novo = {
      id: proximoId(agendamentos, prefixoId),
      clienteId, clienteNome: cliente?.nome ?? '—', tipoServico, data, hora, endereco,
      status: 'Agendado', criadoEm: new Date().toISOString().slice(0, 10),
    }
    setAgendamentos((prev) => [novo, ...prev])
    showToast('Agendamento criado com sucesso!')
    setModalCriar(false)
    setData('')
    setEndereco('')
  }

  function alterarStatus(id, status) {
    setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  function handleDeletar() {
    setAgendamentos((prev) => prev.filter((a) => a.id !== paraDeletar.id))
    showToast('Agendamento removido.')
    setParaDeletar(null)
  }

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Serviço', accessorKey: 'tipoServico' },
    { header: 'Data', accessorKey: 'data' },
    { header: 'Hora', accessorKey: 'hora' },
    {
      header: 'Status', accessorKey: 'status', cell: (info) => info.row.original.fechada ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-label font-semibold text-emerald-700"><IconLock size={13} /> Festa fechada</span>
      ) : (
        <SeletorStatus
          value={info.getValue()}
          onChange={(e) => alterarStatus(info.row.original.id, e.target.value)}
          opcoes={STATUS_AGENDAMENTO}
        />
      ),
    },
    {
      header: 'Ações', id: 'acoes', cell: (info) => info.row.original.fechada ? (
        <Link to="/admin/crm" className="text-label font-medium text-primary hover:underline">Ver no CRM</Link>
      ) : (
        <button onClick={() => setParaDeletar(info.row.original)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Remover">
          <IconTrash size={18} />
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Agendamentos</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo Agendamento
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClasse}>Buscar por cliente</label>
          <input className={inputClasse} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome..." />
        </div>
        <div>
          <label className={labelClasse}>Status</label>
          <Selecao className={inputClasse} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_AGENDAMENTO.map((s) => <option key={s} value={s}>{s}</option>)}
            {festasFechadas.length > 0 && <option value={STATUS_FESTA_FECHADA}>{STATUS_FESTA_FECHADA}</option>}
          </Selecao>
        </div>
        <div className="flex items-center rounded-btn border border-muted-dark overflow-hidden self-end">
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
      </div>

      {visualizacao === 'calendario' ? (
        <CalendarioMensal eventos={filtrados} corStatus={CORES_STATUS} onSelecionarEvento={setDetalhe} />
      ) : (
        <div className="bg-surface rounded-card shadow-card p-5">
          <DataTable data={filtrados} columns={colunas} />
        </div>
      )}

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Novo Agendamento" size="md">
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Cliente *</label>
            <Selecao required className={inputClasse} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              {config.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Selecao>
          </div>
          <div>
            <label className={labelClasse}>Serviço *</label>
            <Selecao required className={inputClasse} value={tipoServico} onChange={(e) => setTipoServico(e.target.value)}>
              {config.servicos.map((s) => <option key={s} value={s}>{s}</option>)}
            </Selecao>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasse}>Data *</label>
              <input required type="date" className={inputClasse} value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Hora *</label>
              <input required type="time" className={inputClasse} value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClasse}><IconMapPin size={13} className="inline mr-1" />Endereço</label>
            <input className={inputClasse} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalCriar(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Criar</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detalhe} onClose={() => setDetalhe(null)} title={detalhe?.tipoServico ?? ''} size="sm">
        {detalhe && (
          <div className="flex flex-col gap-4">
            <p className="text-body"><span className="text-[#666]">Cliente:</span> {detalhe.clienteNome}</p>
            <p className="text-body"><span className="text-[#666]">Data:</span> {detalhe.data.split('-').reverse().join('/')}{detalhe.hora ? ` às ${detalhe.hora}` : ''}</p>
            {detalhe.endereco && (
              <p className="text-body"><IconMapPin size={13} className="inline mr-1 text-[#666]" />{detalhe.endereco}</p>
            )}
            {detalhe.fechada ? (
              <div className="rounded-card border border-emerald-200 bg-emerald-50 p-3 text-body text-emerald-800">
                <p className="flex items-center gap-1.5 font-semibold"><IconLock size={16} /> Festa fechada</p>
                <p className="mt-1 text-label">Contrato assinado e sinal pago. A data está travada: para mudar, reabra o lead no CRM.</p>
                <Link to="/admin/crm" className="mt-2 inline-block text-label font-semibold text-primary hover:underline">Abrir o CRM de Leads</Link>
              </div>
            ) : (
            <>
            <div>
              <label className={labelClasse}>Status</label>
              <Selecao
                className={inputClasse}
                value={detalhe.status}
                onChange={(e) => {
                  alterarStatus(detalhe.id, e.target.value)
                  setDetalhe((d) => ({ ...d, status: e.target.value }))
                }}
              >
                {STATUS_AGENDAMENTO.map((s) => <option key={s} value={s}>{s}</option>)}
              </Selecao>
            </div>
            <div className="flex justify-end pt-2 border-t border-muted-dark">
              <button
                onClick={() => {
                  setParaDeletar(detalhe)
                  setDetalhe(null)
                }}
                className="flex items-center gap-1.5 rounded-btn px-4 py-2 text-body font-medium text-danger hover:bg-red-50"
              >
                <IconTrash size={16} /> Remover agendamento
              </button>
            </div>
            </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!paraDeletar}
        onClose={() => setParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Remover agendamento"
        mensagem={`Tem certeza que deseja remover o agendamento de ${paraDeletar?.clienteNome}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
