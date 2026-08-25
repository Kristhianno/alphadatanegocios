import { useMemo, useState } from 'react'
import { IconPlus, IconTrash, IconEye } from '@tabler/icons-react'
import { useSessoesFotografia } from '../../hooks/useSessoesFotografia'
import { useToast } from '../../hooks/useToast'
import { CLIENTES_FOTOGRAFIA, PACOTES_FOTOGRAFIA, STATUS_SESSAO, STATUS_SESSAO_CORES } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'
const LOCAIS_SESSAO = ['Estúdio principal', 'Externa — Parque da Cidade', 'Externa — Praia', 'Local do cliente']

function StatusBadge({ status }) {
  const cor = STATUS_SESSAO_CORES[status] ?? STATUS_SESSAO_CORES.Agendada
  return (
    <span className={`inline-flex items-center gap-1.5 text-label font-medium rounded-full px-2.5 py-1 ${cor.bg} ${cor.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cor.dot}`} />
      {status}
    </span>
  )
}

export default function SessoesFotografia() {
  const { sessoes, addSessao, updateSessao, deleteSessao } = useSessoesFotografia()
  const { showToast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalCriar, setModalCriar] = useState(false)
  const [sessaoDetalhe, setSessaoDetalhe] = useState(null)
  const [sessaoParaDeletar, setSessaoParaDeletar] = useState(null)

  const [clienteId, setClienteId] = useState(CLIENTES_FOTOGRAFIA[0]?.id ?? '')
  const [tipoSessao, setTipoSessao] = useState('Ensaio')
  const [pacoteId, setPacoteId] = useState(PACOTES_FOTOGRAFIA[0]?.id ?? '')
  const [dataSessao, setDataSessao] = useState('')
  const [local, setLocal] = useState(LOCAIS_SESSAO[0])

  const sessoesFiltradas = useMemo(() => {
    let lista = sessoes.filter((s) => s.clienteNome.toLowerCase().includes(busca.toLowerCase()))
    if (filtroStatus) lista = lista.filter((s) => s.status === filtroStatus)
    return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }, [sessoes, busca, filtroStatus])

  function resetForm() {
    setClienteId(CLIENTES_FOTOGRAFIA[0]?.id ?? '')
    setTipoSessao('Ensaio')
    setPacoteId(PACOTES_FOTOGRAFIA[0]?.id ?? '')
    setDataSessao('')
    setLocal(LOCAIS_SESSAO[0])
  }

  function handleCriar(e) {
    e.preventDefault()
    const cliente = CLIENTES_FOTOGRAFIA.find((c) => c.id === clienteId)
    const pacote = PACOTES_FOTOGRAFIA.find((p) => p.id === pacoteId)
    addSessao({
      clienteId,
      clienteNome: cliente?.nome ?? '—',
      tipoSessao,
      pacoteId,
      pacoteNome: pacote?.nome ?? '—',
      dataSessao,
      local,
      valorTotal: pacote?.precoBase ?? 0,
      quantidadeFotos: pacote?.fotosInclusas ?? 0,
    })
    showToast('Sessão criada com sucesso!')
    setModalCriar(false)
    resetForm()
  }

  function handleDeletar() {
    deleteSessao(sessaoParaDeletar.id)
    showToast('Sessão removida.')
    setSessaoParaDeletar(null)
  }

  const colunas = [
    { header: 'Sessão', accessorKey: 'id' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Tipo', accessorKey: 'tipoSessao' },
    { header: 'Data', accessorKey: 'dataSessao' },
    { header: 'Edição', accessorKey: 'percentualEdicaoConcluida', cell: (info) => `${info.getValue()}%` },
    { header: 'Status', accessorKey: 'status', cell: (info) => <StatusBadge status={info.getValue()} /> },
    {
      header: 'Ações', id: 'acoes', cell: (info) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSessaoDetalhe(info.row.original)} className="p-1.5 rounded-btn hover:bg-muted text-primary" aria-label="Ver detalhes">
            <IconEye size={18} />
          </button>
          <button onClick={() => setSessaoParaDeletar(info.row.original)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Remover">
            <IconTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Sessões — Fotografia e Vídeo</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Nova Sessão
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClasse}>Buscar por cliente</label>
          <input className={inputClasse} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome..." />
        </div>
        <div>
          <label className={labelClasse}>Status</label>
          <select className={inputClasse} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            {STATUS_SESSAO.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={sessoesFiltradas} columns={colunas} />
      </div>

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Nova Sessão" size="lg">
        <form onSubmit={handleCriar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasse}>Cliente *</label>
            <select required className={inputClasse} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              {CLIENTES_FOTOGRAFIA.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Tipo de sessão *</label>
            <select required className={inputClasse} value={tipoSessao} onChange={(e) => setTipoSessao(e.target.value)}>
              {['Ensaio', 'Casamento', 'Evento', 'Produto', 'Institucional', 'Outro'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Pacote *</label>
            <select required className={inputClasse} value={pacoteId} onChange={(e) => setPacoteId(e.target.value)}>
              {PACOTES_FOTOGRAFIA.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {p.precoBase.toLocaleString('pt-BR')}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Data da sessão *</label>
            <input required type="date" className={inputClasse} value={dataSessao} onChange={(e) => setDataSessao(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasse}>Local</label>
            <select className={inputClasse} value={local} onChange={(e) => setLocal(e.target.value)}>
              {LOCAIS_SESSAO.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalCriar(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Criar Sessão</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!sessaoDetalhe} onClose={() => setSessaoDetalhe(null)} title={`Sessão ${sessaoDetalhe?.id ?? ''}`} size="md">
        {sessaoDetalhe && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-body"><span className="text-[#666]">Cliente:</span> {sessaoDetalhe.clienteNome}</p>
              <StatusBadge status={sessaoDetalhe.status} />
            </div>
            <p className="text-body"><span className="text-[#666]">Tipo:</span> {sessaoDetalhe.tipoSessao} · <span className="text-[#666]">Local:</span> {sessaoDetalhe.local}</p>
            <p className="text-body"><span className="text-[#666]">Data:</span> {sessaoDetalhe.dataSessao}</p>
            <p className="text-body"><span className="text-[#666]">Pacote:</span> {sessaoDetalhe.pacoteNome} — R$ {sessaoDetalhe.valorTotal.toLocaleString('pt-BR')}</p>
            {sessaoDetalhe.quantidadeFotos > 0 && <p className="text-body"><span className="text-[#666]">Fotos inclusas:</span> {sessaoDetalhe.quantidadeFotos}</p>}

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-body font-semibold text-[#333]">Progresso de edição</span>
                <span className="text-body font-bold text-primary">{sessaoDetalhe.percentualEdicaoConcluida}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={sessaoDetalhe.percentualEdicaoConcluida}
                onChange={(e) => {
                  const valor = Number(e.target.value)
                  updateSessao(sessaoDetalhe.id, { percentualEdicaoConcluida: valor })
                  setSessaoDetalhe((s) => ({ ...s, percentualEdicaoConcluida: valor }))
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className={labelClasse}>Alterar status</label>
              <select
                className={inputClasse}
                value={sessaoDetalhe.status}
                onChange={(e) => {
                  updateSessao(sessaoDetalhe.id, { status: e.target.value })
                  setSessaoDetalhe((s) => ({ ...s, status: e.target.value }))
                }}
              >
                {STATUS_SESSAO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!sessaoParaDeletar}
        onClose={() => setSessaoParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Remover sessão"
        mensagem={`Tem certeza que deseja remover a sessão ${sessaoParaDeletar?.id}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
