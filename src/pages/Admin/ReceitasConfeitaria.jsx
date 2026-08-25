import { useState } from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { RECEITAS_CONFEITARIA } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'
const CATEGORIAS = ['Bolos', 'Doces', 'Salgados', 'Tortas', 'Sobremesas']

function proximoId(receitas) {
  const max = receitas.reduce((acc, r) => {
    const n = Number(r.id.replace('REC-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `REC-${String(max + 1).padStart(2, '0')}`
}

export default function ReceitasConfeitaria() {
  const [receitas, setReceitas] = usePersisted('alphadata_receitas_confeitaria', RECEITAS_CONFEITARIA)
  const { showToast } = useToast()

  const [modalCriar, setModalCriar] = useState(false)
  const [paraDeletar, setParaDeletar] = useState(null)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState(CATEGORIAS[0])
  const [tempoPreparoMinutos, setTempoPreparoMinutos] = useState(60)
  const [rendimento, setRendimento] = useState('')

  function handleCriar(e) {
    e.preventDefault()
    const nova = { id: proximoId(receitas), nome, categoria, tempoPreparoMinutos: Number(tempoPreparoMinutos) || 0, rendimento }
    setReceitas((prev) => [nova, ...prev])
    showToast('Receita criada com sucesso!')
    setModalCriar(false)
    setNome('')
    setRendimento('')
  }

  function handleDeletar() {
    setReceitas((prev) => prev.filter((r) => r.id !== paraDeletar.id))
    showToast('Receita removida.')
    setParaDeletar(null)
  }

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nome', accessorKey: 'nome' },
    { header: 'Categoria', accessorKey: 'categoria' },
    { header: 'Tempo de preparo', accessorKey: 'tempoPreparoMinutos', cell: (info) => `${info.getValue()} min` },
    { header: 'Rendimento', accessorKey: 'rendimento' },
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
        <h1 className="text-h1 text-primary">Receitas</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Nova Receita
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={receitas} columns={colunas} />
      </div>

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title="Nova Receita" size="sm">
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Nome *</label>
            <input required className={inputClasse} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className={labelClasse}>Categoria</label>
            <select className={inputClasse} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Tempo de preparo (min)</label>
            <input type="number" min={1} className={inputClasse} value={tempoPreparoMinutos} onChange={(e) => setTempoPreparoMinutos(e.target.value)} />
          </div>
          <div>
            <label className={labelClasse}>Rendimento</label>
            <input className={inputClasse} placeholder="Ex: 20 unidades" value={rendimento} onChange={(e) => setRendimento(e.target.value)} />
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
        titulo="Remover receita"
        mensagem={`Tem certeza que deseja remover ${paraDeletar?.nome}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
