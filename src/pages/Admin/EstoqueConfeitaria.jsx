import { useState } from 'react'
import { IconPlus, IconTrash, IconAlertTriangle } from '@tabler/icons-react'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { INGREDIENTES_CONFEITARIA } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

function proximoId(ingredientes) {
  const max = ingredientes.reduce((acc, i) => {
    const n = Number(i.id.replace('ING-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `ING-${String(max + 1).padStart(2, '0')}`
}

export default function EstoqueConfeitaria() {
  const [ingredientes, setIngredientes] = usePersisted('alphadata_estoque_confeitaria', INGREDIENTES_CONFEITARIA)
  const { showToast } = useToast()

  const [modalCriar, setModalCriar] = useState(false)
  const [paraDeletar, setParaDeletar] = useState(null)
  const [nome, setNome] = useState('')
  const [unidadeMedida, setUnidadeMedida] = useState('kg')
  const [quantidadeAtual, setQuantidadeAtual] = useState(10)
  const [quantidadeMinima, setQuantidadeMinima] = useState(5)
  const [custoUnitario, setCustoUnitario] = useState(0)

  const emAlerta = ingredientes.filter((i) => i.quantidadeAtual < i.quantidadeMinima)

  function handleCriar(e) {
    e.preventDefault()
    const novo = {
      id: proximoId(ingredientes), nome, unidadeMedida,
      quantidadeAtual: Number(quantidadeAtual) || 0, quantidadeMinima: Number(quantidadeMinima) || 0,
      custoUnitario: Number(custoUnitario) || 0,
    }
    setIngredientes((prev) => [novo, ...prev])
    showToast('Ingrediente adicionado ao estoque!')
    setModalCriar(false)
    setNome('')
  }

  function ajustarQuantidade(id, delta) {
    setIngredientes((prev) => prev.map((i) => (i.id === id ? { ...i, quantidadeAtual: Math.max(0, i.quantidadeAtual + delta) } : i)))
  }

  function handleDeletar() {
    setIngredientes((prev) => prev.filter((i) => i.id !== paraDeletar.id))
    showToast('Ingrediente removido.')
    setParaDeletar(null)
  }

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Ingrediente', accessorKey: 'nome' },
    {
      header: 'Quantidade', accessorKey: 'quantidadeAtual', cell: (info) => (
        <div className="flex items-center gap-2">
          <button onClick={() => ajustarQuantidade(info.row.original.id, -1)} className="w-6 h-6 rounded-btn bg-muted hover:bg-muted-dark text-body">−</button>
          <span className={info.row.original.quantidadeAtual < info.row.original.quantidadeMinima ? 'text-danger font-semibold' : ''}>
            {info.getValue()} {info.row.original.unidadeMedida}
          </span>
          <button onClick={() => ajustarQuantidade(info.row.original.id, 1)} className="w-6 h-6 rounded-btn bg-muted hover:bg-muted-dark text-body">+</button>
        </div>
      ),
    },
    { header: 'Mínimo', accessorKey: 'quantidadeMinima', cell: (info) => `${info.getValue()} ${info.row.original.unidadeMedida}` },
    { header: 'Custo unit.', accessorKey: 'custoUnitario', cell: (info) => `R$ ${Number(info.getValue()).toFixed(2)}` },
    {
      header: 'Status', id: 'status', cell: (info) => info.row.original.quantidadeAtual < info.row.original.quantidadeMinima
        ? <span className="inline-flex items-center gap-1 text-label font-medium text-danger"><IconAlertTriangle size={14} /> Estoque baixo</span>
        : <span className="text-label text-success font-medium">OK</span>,
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
        <h1 className="text-h1 text-primary">Estoque de Ingredientes</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo Ingrediente
        </button>
      </div>

      {emAlerta.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-card p-4 flex items-center gap-3">
          <IconAlertTriangle size={22} className="text-danger shrink-0" />
          <p className="text-body text-[#333]">
            <span className="font-semibold">{emAlerta.length} {emAlerta.length === 1 ? 'ingrediente está' : 'ingredientes estão'} abaixo do estoque mínimo:</span>{' '}
            {emAlerta.map((i) => i.nome).join(', ')}
          </p>
        </div>
      )}

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={ingredientes} columns={colunas} />
      </div>

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Novo Ingrediente" size="sm">
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Nome *</label>
            <input required className={inputClasse} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasse}>Unidade</label>
              <select className={inputClasse} value={unidadeMedida} onChange={(e) => setUnidadeMedida(e.target.value)}>
                {['kg', 'g', 'l', 'ml', 'unidade', 'dúzia', 'lata'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Custo unitário (R$)</label>
              <input type="number" min={0} step="0.01" className={inputClasse} value={custoUnitario} onChange={(e) => setCustoUnitario(e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Quantidade atual</label>
              <input type="number" min={0} className={inputClasse} value={quantidadeAtual} onChange={(e) => setQuantidadeAtual(e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Quantidade mínima</label>
              <input type="number" min={0} className={inputClasse} value={quantidadeMinima} onChange={(e) => setQuantidadeMinima(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalCriar(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!paraDeletar}
        onClose={() => setParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Remover ingrediente"
        mensagem={`Tem certeza que deseja remover ${paraDeletar?.nome} do estoque?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
