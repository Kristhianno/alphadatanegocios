import { useState } from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { PRODUTOS_CONFEITARIA, PACOTES_SALAO, PACOTES_FOTOGRAFIA } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

// Confeitaria chama de "Catálogo", Salão e Fotografia chamam de
// "Pacotes" — mesma ideia (o que a conta vende), forma um pouco
// diferente por vertical (produto simples x pacote com capacidade/
// fotos/horas inclusas), então cada um tem suas próprias colunas.
const CONFIG_POR_VERTICAL = {
  confeitaria: {
    titulo: 'Catálogo', storageKey: 'alphadata_catalogo_confeitaria', mock: PRODUTOS_CONFEITARIA, prefixoId: 'PRD',
    campoPreco: 'precoVenda', camposExtra: [],
  },
  salao_festas: {
    titulo: 'Pacotes', storageKey: 'alphadata_catalogo_salao', mock: PACOTES_SALAO, prefixoId: 'PCT',
    campoPreco: 'precoBase', camposExtra: [{ chave: 'capacidade', label: 'Capacidade' }],
  },
  fotografia_video: {
    titulo: 'Pacotes', storageKey: 'alphadata_catalogo_fotografia', mock: PACOTES_FOTOGRAFIA, prefixoId: 'PCF',
    campoPreco: 'precoBase', camposExtra: [{ chave: 'horasInclusas', label: 'Horas inclusas' }],
  },
}

function proximoId(lista, prefixo) {
  const max = lista.reduce((acc, item) => {
    const n = Number(String(item.id).replace(`${prefixo}-`, ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `${prefixo}-${String(max + 1).padStart(2, '0')}`
}

export default function CatalogoVertical() {
  const { user } = useAuth()
  const config = CONFIG_POR_VERTICAL[user?.tipoNegocio] ?? CONFIG_POR_VERTICAL.confeitaria

  const [itens, setItens] = usePersisted(config.storageKey, config.mock)
  const { showToast } = useToast()

  const [modalCriar, setModalCriar] = useState(false)
  const [paraDeletar, setParaDeletar] = useState(null)
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')

  function handleCriar(e) {
    e.preventDefault()
    const novo = { id: proximoId(itens, config.prefixoId), nome, [config.campoPreco]: Number(preco) || 0, ativo: true }
    setItens((prev) => [novo, ...prev])
    showToast(`${config.titulo === 'Catálogo' ? 'Produto' : 'Pacote'} criado com sucesso!`)
    setModalCriar(false)
    setNome('')
    setPreco('')
  }

  function alternarAtivo(id) {
    setItens((prev) => prev.map((item) => (item.id === id ? { ...item, ativo: !item.ativo } : item)))
  }

  function handleDeletar() {
    setItens((prev) => prev.filter((item) => item.id !== paraDeletar.id))
    showToast('Removido do catálogo.')
    setParaDeletar(null)
  }

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nome', accessorKey: 'nome' },
    { header: 'Preço', accessorKey: config.campoPreco, cell: (info) => `R$ ${Number(info.getValue() ?? 0).toLocaleString('pt-BR')}` },
    ...config.camposExtra.map((c) => ({ header: c.label, accessorKey: c.chave })),
    {
      header: 'Status', id: 'ativo', cell: (info) => (
        <button
          onClick={() => alternarAtivo(info.row.original.id)}
          className={`text-label font-medium rounded-full px-2.5 py-1 ${info.row.original.ativo !== false ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
        >
          {info.row.original.ativo !== false ? 'Ativo' : 'Inativo'}
        </button>
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
        <h1 className="text-h1 text-primary">{config.titulo}</h1>
        <button onClick={() => setModalCriar(true)} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> {config.titulo === 'Catálogo' ? 'Novo Produto' : 'Novo Pacote'}
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={itens} columns={colunas} />
      </div>

      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title={config.titulo === 'Catálogo' ? 'Novo Produto' : 'Novo Pacote'} size="sm">
        <form onSubmit={handleCriar} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Nome *</label>
            <input required className={inputClasse} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label className={labelClasse}>Preço (R$) *</label>
            <input required type="number" min={0} step="0.01" className={inputClasse} value={preco} onChange={(e) => setPreco(e.target.value)} />
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
        titulo="Remover item"
        mensagem={`Tem certeza que deseja remover ${paraDeletar?.nome}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
