import { useMemo, useState } from 'react'
import { IconPlus, IconTrash, IconEye } from '@tabler/icons-react'
import { usePedidosConfeitaria } from '../../hooks/usePedidosConfeitaria'
import { useToast } from '../../hooks/useToast'
import { CLIENTES_CONFEITARIA, PRODUTOS_CONFEITARIA, STATUS_PEDIDO_CONFEITARIA, STATUS_PEDIDO_CONFEITARIA_CORES } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

function StatusBadge({ status }) {
  const cor = STATUS_PEDIDO_CONFEITARIA_CORES[status] ?? STATUS_PEDIDO_CONFEITARIA_CORES.Novo
  return (
    <span className={`inline-flex items-center gap-1.5 text-label font-medium rounded-full px-2.5 py-1 ${cor.bg} ${cor.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cor.dot}`} />
      {status}
    </span>
  )
}

const ITEM_VAZIO = { produtoId: PRODUTOS_CONFEITARIA[0]?.id ?? '', quantidade: 1 }

export default function PedidosConfeitaria() {
  const { pedidos, addPedido, updatePedido, deletePedido } = usePedidosConfeitaria()
  const { showToast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modalCriar, setModalCriar] = useState(false)
  const [pedidoDetalhe, setPedidoDetalhe] = useState(null)
  const [pedidoParaDeletar, setPedidoParaDeletar] = useState(null)

  const [clienteId, setClienteId] = useState(CLIENTES_CONFEITARIA[0]?.id ?? '')
  const [dataEntrega, setDataEntrega] = useState('')
  const [enderecoEntrega, setEnderecoEntrega] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [itens, setItens] = useState([{ ...ITEM_VAZIO }])

  const pedidosFiltrados = useMemo(() => {
    let lista = pedidos.filter((p) => p.clienteNome.toLowerCase().includes(busca.toLowerCase()))
    if (filtroStatus) lista = lista.filter((p) => p.status === filtroStatus)
    return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  }, [pedidos, busca, filtroStatus])

  function resetForm() {
    setClienteId(CLIENTES_CONFEITARIA[0]?.id ?? '')
    setDataEntrega('')
    setEnderecoEntrega('')
    setObservacoes('')
    setItens([{ ...ITEM_VAZIO }])
  }

  function atualizarItem(idx, patch) {
    setItens((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function handleCriar(e) {
    e.preventDefault()
    const cliente = CLIENTES_CONFEITARIA.find((c) => c.id === clienteId)
    const itensCompletos = itens.map((it) => {
      const produto = PRODUTOS_CONFEITARIA.find((p) => p.id === it.produtoId)
      return { produtoNome: produto?.nome ?? '—', quantidade: Number(it.quantidade) || 1, precoUnitario: produto?.precoVenda ?? 0 }
    })
    addPedido({
      clienteId,
      clienteNome: cliente?.nome ?? '—',
      itens: itensCompletos,
      dataEntrega,
      enderecoEntrega,
      observacoes,
    })
    showToast('Pedido criado com sucesso!')
    setModalCriar(false)
    resetForm()
  }

  function handleDeletar() {
    deletePedido(pedidoParaDeletar.id)
    showToast('Pedido removido.')
    setPedidoParaDeletar(null)
  }

  const colunas = [
    { header: 'Pedido', accessorKey: 'id' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Itens', accessorFn: (p) => p.itens.length, cell: (info) => `${info.getValue()} ${info.getValue() === 1 ? 'item' : 'itens'}` },
    { header: 'Entrega', accessorKey: 'dataEntrega' },
    { header: 'Valor', accessorKey: 'valorTotal', cell: (info) => `R$ ${info.getValue().toLocaleString('pt-BR')}` },
    { header: 'Status', accessorKey: 'status', cell: (info) => <StatusBadge status={info.getValue()} /> },
    {
      header: 'Ações', id: 'acoes', cell: (info) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setPedidoDetalhe(info.row.original)} className="p-1.5 rounded-btn hover:bg-muted text-primary" aria-label="Ver detalhes">
            <IconEye size={18} />
          </button>
          <button onClick={() => setPedidoParaDeletar(info.row.original)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Remover">
            <IconTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Pedidos — Confeitaria e Salgados</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo Pedido
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
            {STATUS_PEDIDO_CONFEITARIA.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={pedidosFiltrados} columns={colunas} />
      </div>

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Novo Pedido" size="lg">
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasse}>Cliente *</label>
              <select required className={inputClasse} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                {CLIENTES_CONFEITARIA.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Data de entrega *</label>
              <input required type="date" className={inputClasse} value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasse}>Endereço de entrega</label>
              <input className={inputClasse} value={enderecoEntrega} onChange={(e) => setEnderecoEntrega(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={labelClasse}>Itens do pedido</label>
              <button type="button" onClick={() => setItens((prev) => [...prev, { ...ITEM_VAZIO }])} className="text-label text-primary hover:underline font-medium">
                + Adicionar item
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {itens.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select className={`${inputClasse} flex-1`} value={item.produtoId} onChange={(e) => atualizarItem(idx, { produtoId: e.target.value })}>
                    {PRODUTOS_CONFEITARIA.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {p.precoVenda}</option>)}
                  </select>
                  <input
                    type="number" min={1} className={`${inputClasse} w-24`} value={item.quantidade}
                    onChange={(e) => atualizarItem(idx, { quantidade: e.target.value })}
                  />
                  {itens.length > 1 && (
                    <button type="button" onClick={() => setItens((prev) => prev.filter((_, i) => i !== idx))} className="p-2 text-danger hover:bg-red-50 rounded-btn">
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClasse}>Observações</label>
            <textarea rows={2} className={`${inputClasse} w-full`} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalCriar(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Criar Pedido</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!pedidoDetalhe} onClose={() => setPedidoDetalhe(null)} title={`Pedido ${pedidoDetalhe?.id ?? ''}`} size="md">
        {pedidoDetalhe && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-body"><span className="text-[#666]">Cliente:</span> {pedidoDetalhe.clienteNome}</p>
              <StatusBadge status={pedidoDetalhe.status} />
            </div>
            <p className="text-body"><span className="text-[#666]">Entrega:</span> {pedidoDetalhe.dataEntrega} — {pedidoDetalhe.enderecoEntrega || 'sem endereço'}</p>
            {pedidoDetalhe.observacoes && <p className="text-body"><span className="text-[#666]">Obs.:</span> {pedidoDetalhe.observacoes}</p>}

            <div>
              <p className="text-label text-[#666] mb-2">Itens</p>
              <div className="flex flex-col gap-1.5">
                {pedidoDetalhe.itens.map((it, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-muted-dark pb-1.5">
                    <span className="text-body">{it.quantidade}x {it.produtoNome}</span>
                    <span className="text-body font-medium">R$ {(it.quantidade * it.precoUnitario).toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-muted-dark">
              <span className="text-body font-semibold">Total</span>
              <span className="text-h2 text-primary">R$ {pedidoDetalhe.valorTotal.toLocaleString('pt-BR')}</span>
            </div>

            <div>
              <label className={labelClasse}>Alterar status</label>
              <select
                className={inputClasse}
                value={pedidoDetalhe.status}
                onChange={(e) => {
                  updatePedido(pedidoDetalhe.id, { status: e.target.value })
                  setPedidoDetalhe((p) => ({ ...p, status: e.target.value }))
                }}
              >
                {STATUS_PEDIDO_CONFEITARIA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!pedidoParaDeletar}
        onClose={() => setPedidoParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Remover pedido"
        mensagem={`Tem certeza que deseja remover o pedido ${pedidoParaDeletar?.id}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
