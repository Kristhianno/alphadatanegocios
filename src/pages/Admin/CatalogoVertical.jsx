import { useState } from 'react'
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { PRODUTOS_CONFEITARIA, PACOTES_SALAO, PACOTES_FOTOGRAFIA } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import CameraCapture from '../../components/CameraCapture'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

// Confeitaria chama de "Catálogo", Salão e Fotografia chamam de
// "Pacotes" — mesma ideia (o que a conta vende), forma um pouco
// diferente por vertical (produto simples x pacote com capacidade/
// fotos/horas inclusas), então cada um tem suas próprias colunas.
// `camposExtra` alimenta ao mesmo tempo a tabela e o formulário de
// criar/editar — 'lista' vira textarea (um item por linha) e não
// aparece como coluna própria (só a contagem).
const CONFIG_POR_VERTICAL = {
  confeitaria: {
    titulo: 'Catálogo', storageKey: 'alphadata_catalogo_confeitaria', mock: PRODUTOS_CONFEITARIA, prefixoId: 'PRD',
    campoPreco: 'precoVenda',
    camposExtra: [{ chave: 'categoria', label: 'Categoria', tipo: 'texto' }],
  },
  salao_festas: {
    titulo: 'Pacotes', storageKey: 'alphadata_catalogo_salao', mock: PACOTES_SALAO, prefixoId: 'PCT',
    campoPreco: 'precoBase',
    camposExtra: [
      { chave: 'capacidade', label: 'Capacidade', tipo: 'numero' },
      { chave: 'itensInclusos', label: 'Itens inclusos', tipo: 'lista' },
    ],
  },
  fotografia_video: {
    titulo: 'Pacotes', storageKey: 'alphadata_catalogo_fotografia', mock: PACOTES_FOTOGRAFIA, prefixoId: 'PCF',
    campoPreco: 'precoBase',
    camposExtra: [
      { chave: 'horasInclusas', label: 'Horas inclusas', tipo: 'numero' },
      { chave: 'fotosInclusas', label: 'Fotos inclusas', tipo: 'numero' },
    ],
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
  const tituloSingular = config.titulo === 'Catálogo' ? 'Produto' : 'Pacote'

  const [itens, setItens] = usePersisted(config.storageKey, config.mock)
  const { showToast } = useToast()

  const [paraDeletar, setParaDeletar] = useState(null)
  const [form, setForm] = useState(null)
  const [editandoId, setEditandoId] = useState(null)

  function estadoVazio() {
    return {
      nome: '', preco: '', descricao: '', fotos: [], ativo: true,
      extra: Object.fromEntries(config.camposExtra.map((c) => [c.chave, ''])),
    }
  }

  function itemParaForm(item) {
    return {
      nome: item.nome ?? '',
      preco: item[config.campoPreco] ?? '',
      descricao: item.descricao ?? '',
      fotos: item.fotos ?? [],
      ativo: item.ativo !== false,
      extra: Object.fromEntries(config.camposExtra.map((c) => [
        c.chave,
        c.tipo === 'lista' ? (item[c.chave] ?? []).join('\n') : (item[c.chave] ?? ''),
      ])),
    }
  }

  function abrirCriar() {
    setEditandoId(null)
    setForm(estadoVazio())
  }

  function abrirEditar(item) {
    setEditandoId(item.id)
    setForm(itemParaForm(item))
  }

  function handleSalvar(e) {
    e.preventDefault()
    const extraConvertido = {}
    for (const c of config.camposExtra) {
      const bruto = form.extra[c.chave]
      if (c.tipo === 'lista') extraConvertido[c.chave] = bruto.split('\n').map((s) => s.trim()).filter(Boolean)
      else if (c.tipo === 'numero') extraConvertido[c.chave] = Number(bruto) || 0
      else extraConvertido[c.chave] = bruto
    }
    const dados = {
      nome: form.nome,
      [config.campoPreco]: Number(form.preco) || 0,
      descricao: form.descricao,
      fotos: form.fotos,
      ativo: form.ativo,
      ...extraConvertido,
    }

    if (editandoId) {
      setItens((prev) => prev.map((item) => (item.id === editandoId ? { ...item, ...dados } : item)))
      showToast(`${tituloSingular} atualizado com sucesso!`)
    } else {
      setItens((prev) => [{ id: proximoId(prev, config.prefixoId), ...dados }, ...prev])
      showToast(`${tituloSingular} criado com sucesso!`)
    }
    setForm(null)
    setEditandoId(null)
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
    ...config.camposExtra
      .filter((c) => c.tipo !== 'lista')
      .map((c) => ({ header: c.label, accessorKey: c.chave })),
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
        <div className="flex items-center gap-2">
          <button onClick={() => abrirEditar(info.row.original)} className="p-1.5 rounded-btn hover:bg-muted text-primary" aria-label="Editar">
            <IconEdit size={18} />
          </button>
          <button onClick={() => setParaDeletar(info.row.original)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Remover">
            <IconTrash size={18} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">{config.titulo}</h1>
        <button onClick={abrirCriar} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo {tituloSingular}
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={itens} columns={colunas} />
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={editandoId ? `Editar ${tituloSingular}` : `Novo ${tituloSingular}`} size="lg">
        {form && (
          <form onSubmit={handleSalvar} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClasse}>Nome *</label>
                <input required className={inputClasse} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <label className={labelClasse}>Preço (R$) *</label>
                <input required type="number" min={0} step="0.01" className={inputClasse} value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input id="ativo" type="checkbox" checked={form.ativo} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="ativo" className="text-body text-[#333]">Ativo</label>
              </div>
              {config.camposExtra.map((c) => (
                <div key={c.chave} className={c.tipo === 'lista' ? 'sm:col-span-2' : ''}>
                  <label className={labelClasse}>{c.label}{c.tipo === 'lista' ? ' (um por linha)' : ''}</label>
                  {c.tipo === 'lista' ? (
                    <textarea
                      rows={3}
                      className={inputClasse}
                      value={form.extra[c.chave]}
                      onChange={(e) => setForm((f) => ({ ...f, extra: { ...f.extra, [c.chave]: e.target.value } }))}
                    />
                  ) : (
                    <input
                      type={c.tipo === 'numero' ? 'number' : 'text'}
                      min={c.tipo === 'numero' ? 0 : undefined}
                      className={inputClasse}
                      value={form.extra[c.chave]}
                      onChange={(e) => setForm((f) => ({ ...f, extra: { ...f.extra, [c.chave]: e.target.value } }))}
                    />
                  )}
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className={labelClasse}>Descrição</label>
                <textarea rows={3} className={inputClasse} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
              </div>
            </div>

            <CameraCapture titulo="Fotos" fotos={form.fotos} onChange={(fotos) => setForm((f) => ({ ...f, fotos }))} max={6} />

            <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
              <button type="button" onClick={() => setForm(null)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
              <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar</button>
            </div>
          </form>
        )}
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
