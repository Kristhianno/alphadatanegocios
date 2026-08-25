import { useMemo, useState } from 'react'
import { IconPlus, IconTrash, IconEye } from '@tabler/icons-react'
import { useEventosSalao } from '../../hooks/useEventosSalao'
import { useToast } from '../../hooks/useToast'
import { CLIENTES_SALAO, PACOTES_SALAO, STATUS_EVENTO, STATUS_EVENTO_CORES } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Checklist from '../../components/Checklist'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

const CHECKLIST_PADRAO = [
  'Contrato assinado', 'Sinal recebido', 'Equipe confirmada', 'Equipamentos separados',
  'Decoração montada', 'Som e iluminação testados', 'Espaço limpo pós-evento',
].map((label, id) => ({ id, label, concluido: false, observacao: '' }))

function StatusBadge({ status }) {
  const cor = STATUS_EVENTO_CORES[status] ?? STATUS_EVENTO_CORES['Orçamento']
  return (
    <span className={`inline-flex items-center gap-1.5 text-label font-medium rounded-full px-2.5 py-1 ${cor.bg} ${cor.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cor.dot}`} />
      {status}
    </span>
  )
}

export default function EventosSalao() {
  const { eventos, addEvento, updateEvento, deleteEvento } = useEventosSalao()
  const { showToast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalCriar, setModalCriar] = useState(false)
  const [eventoDetalhe, setEventoDetalhe] = useState(null)
  const [eventoParaDeletar, setEventoParaDeletar] = useState(null)

  const [clienteId, setClienteId] = useState(CLIENTES_SALAO[0]?.id ?? '')
  const [nomeEvento, setNomeEvento] = useState('')
  const [tipoEvento, setTipoEvento] = useState('Aniversário')
  const [pacoteId, setPacoteId] = useState(PACOTES_SALAO[0]?.id ?? '')
  const [dataEvento, setDataEvento] = useState('')
  const [numeroConvidados, setNumeroConvidados] = useState(80)

  const eventosFiltrados = useMemo(() => {
    let lista = eventos.filter((e) => e.clienteNome.toLowerCase().includes(busca.toLowerCase()) || e.nomeEvento.toLowerCase().includes(busca.toLowerCase()))
    if (filtroStatus) lista = lista.filter((e) => e.status === filtroStatus)
    return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }, [eventos, busca, filtroStatus])

  function resetForm() {
    setClienteId(CLIENTES_SALAO[0]?.id ?? '')
    setNomeEvento('')
    setTipoEvento('Aniversário')
    setPacoteId(PACOTES_SALAO[0]?.id ?? '')
    setDataEvento('')
    setNumeroConvidados(80)
  }

  function handleCriar(e) {
    e.preventDefault()
    const cliente = CLIENTES_SALAO.find((c) => c.id === clienteId)
    const pacote = PACOTES_SALAO.find((p) => p.id === pacoteId)
    addEvento({
      clienteId,
      clienteNome: cliente?.nome ?? '—',
      nomeEvento: nomeEvento || `${tipoEvento} de ${cliente?.nome ?? ''}`,
      tipoEvento,
      pacoteId,
      pacoteNome: pacote?.nome ?? '—',
      dataEvento,
      numeroConvidados: Number(numeroConvidados) || 0,
      valorTotal: pacote?.precoBase ?? 0,
    })
    showToast('Evento criado com sucesso!')
    setModalCriar(false)
    resetForm()
  }

  function handleDeletar() {
    deleteEvento(eventoParaDeletar.id)
    showToast('Evento removido.')
    setEventoParaDeletar(null)
  }

  function alterarChecklist(novoChecklist) {
    updateEvento(eventoDetalhe.id, { checklist: novoChecklist })
    setEventoDetalhe((ev) => ({ ...ev, checklist: novoChecklist }))
  }

  const colunas = [
    { header: 'Evento', accessorKey: 'id' },
    { header: 'Nome', accessorKey: 'nomeEvento' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Tipo', accessorKey: 'tipoEvento' },
    { header: 'Data', accessorKey: 'dataEvento' },
    { header: 'Valor', accessorKey: 'valorTotal', cell: (info) => `R$ ${info.getValue().toLocaleString('pt-BR')}` },
    { header: 'Status', accessorKey: 'status', cell: (info) => <StatusBadge status={info.getValue()} /> },
    {
      header: 'Ações', id: 'acoes', cell: (info) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEventoDetalhe(info.row.original)} className="p-1.5 rounded-btn hover:bg-muted text-primary" aria-label="Ver detalhes">
            <IconEye size={18} />
          </button>
          <button onClick={() => setEventoParaDeletar(info.row.original)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Remover">
            <IconTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Eventos — Salão de Festas</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo Evento
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClasse}>Buscar por cliente ou evento</label>
          <input className={inputClasse} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite para buscar..." />
        </div>
        <div>
          <label className={labelClasse}>Status</label>
          <select className={inputClasse} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_EVENTO.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={eventosFiltrados} columns={colunas} />
      </div>

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Novo Evento" size="lg">
        <form onSubmit={handleCriar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasse}>Cliente *</label>
            <select required className={inputClasse} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              {CLIENTES_SALAO.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Tipo de evento *</label>
            <select required className={inputClasse} value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)}>
              {['Aniversário', 'Casamento', 'Corporativo', 'Formatura', 'Confraternização', 'Outro'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClasse}>Nome do evento</label>
            <input className={inputClasse} value={nomeEvento} onChange={(e) => setNomeEvento(e.target.value)} placeholder="Deixe em branco para gerar automaticamente" />
          </div>
          <div>
            <label className={labelClasse}>Pacote *</label>
            <select required className={inputClasse} value={pacoteId} onChange={(e) => setPacoteId(e.target.value)}>
              {PACOTES_SALAO.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {p.precoBase.toLocaleString('pt-BR')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Data do evento *</label>
            <input required type="date" className={inputClasse} value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} />
          </div>
          <div>
            <label className={labelClasse}>Número de convidados</label>
            <input type="number" min={1} className={inputClasse} value={numeroConvidados} onChange={(e) => setNumeroConvidados(e.target.value)} />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalCriar(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Criar Evento</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!eventoDetalhe} onClose={() => setEventoDetalhe(null)} title={eventoDetalhe?.nomeEvento ?? ''} size="md">
        {eventoDetalhe && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-body"><span className="text-[#666]">Cliente:</span> {eventoDetalhe.clienteNome}</p>
              <StatusBadge status={eventoDetalhe.status} />
            </div>
            <p className="text-body"><span className="text-[#666]">Data:</span> {eventoDetalhe.dataEvento} · <span className="text-[#666]">Convidados:</span> {eventoDetalhe.numeroConvidados}</p>
            <p className="text-body"><span className="text-[#666]">Pacote:</span> {eventoDetalhe.pacoteNome} — R$ {eventoDetalhe.valorTotal.toLocaleString('pt-BR')}</p>

            <div>
              <p className="text-label text-[#666] mb-2">Checklist operacional</p>
              <Checklist
                itens={eventoDetalhe.checklist?.length ? eventoDetalhe.checklist : CHECKLIST_PADRAO}
                onChange={alterarChecklist}
              />
            </div>

            <div>
              <label className={labelClasse}>Alterar status</label>
              <select
                className={inputClasse}
                value={eventoDetalhe.status}
                onChange={(e) => {
                  updateEvento(eventoDetalhe.id, { status: e.target.value })
                  setEventoDetalhe((ev) => ({ ...ev, status: e.target.value }))
                }}
              >
                {STATUS_EVENTO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!eventoParaDeletar}
        onClose={() => setEventoParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Remover evento"
        mensagem={`Tem certeza que deseja remover ${eventoParaDeletar?.nomeEvento}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
