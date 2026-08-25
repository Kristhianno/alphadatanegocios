import { useState } from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { PRODUCOES_VIDEO_FOTOGRAFIA, CLIENTES_FOTOGRAFIA, STATUS_PRODUCAO_VIDEO } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

function proximoId(lista) {
  const max = lista.reduce((acc, v) => {
    const n = Number(v.id.replace('VID-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `VID-${String(max + 1).padStart(2, '0')}`
}

export default function ProducoesVideoFotografia() {
  const [producoes, setProducoes] = usePersisted('alphadata_producoes_video', PRODUCOES_VIDEO_FOTOGRAFIA)
  const { showToast } = useToast()

  const [modalCriar, setModalCriar] = useState(false)
  const [paraDeletar, setParaDeletar] = useState(null)
  const [clienteId, setClienteId] = useState(CLIENTES_FOTOGRAFIA[0]?.id ?? '')
  const [titulo, setTitulo] = useState('')
  const [duracaoEstimadaSegundos, setDuracaoEstimadaSegundos] = useState(120)

  function handleCriar(e) {
    e.preventDefault()
    const cliente = CLIENTES_FOTOGRAFIA.find((c) => c.id === clienteId)
    const nova = {
      id: proximoId(producoes), clienteId, clienteNome: cliente?.nome ?? '—', titulo,
      duracaoEstimadaSegundos: Number(duracaoEstimadaSegundos) || 0, editor: '—',
      status: 'Captação', criadoEm: new Date().toISOString().slice(0, 10),
    }
    setProducoes((prev) => [nova, ...prev])
    showToast('Produção de vídeo criada!')
    setModalCriar(false)
    setTitulo('')
  }

  function alterarStatus(id, status) {
    setProducoes((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  function handleDeletar() {
    setProducoes((prev) => prev.filter((p) => p.id !== paraDeletar.id))
    showToast('Produção removida.')
    setParaDeletar(null)
  }

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Título', accessorKey: 'titulo' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Duração est.', accessorKey: 'duracaoEstimadaSegundos', cell: (info) => `${Math.round(info.getValue() / 60)} min` },
    { header: 'Editor', accessorKey: 'editor' },
    {
      header: 'Status', accessorKey: 'status', cell: (info) => (
        <select
          value={info.getValue()}
          onChange={(e) => alterarStatus(info.row.original.id, e.target.value)}
          className="text-label border-none bg-transparent focus:outline-none cursor-pointer"
        >
          {STATUS_PRODUCAO_VIDEO.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      ),
    },
    {
      header: 'Ações', id: 'acoes', cell: (info) => (
        <button onClick={() => setParaDeletar(info.row.original)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Remover">
          <IconTrash size={18} />
        </button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Produções de Vídeo</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Nova Produção
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={producoes} columns={colunas} />
      </div>

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Nova Produção de Vídeo" size="sm">
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Cliente *</label>
            <select required className={inputClasse} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              {CLIENTES_FOTOGRAFIA.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Título *</label>
            <input required className={inputClasse} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className={labelClasse}>Duração estimada (segundos)</label>
            <input type="number" min={1} className={inputClasse} value={duracaoEstimadaSegundos} onChange={(e) => setDuracaoEstimadaSegundos(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalCriar(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Criar</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!paraDeletar}
        onClose={() => setParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Remover produção"
        mensagem={`Tem certeza que deseja remover "${paraDeletar?.titulo}"?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
