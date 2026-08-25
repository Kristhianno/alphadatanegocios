import { useMemo, useState } from 'react'
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import {
  CONTRATOS_CONFEITARIA, CONTRATOS_SALAO, CONTRATOS_FOTOGRAFIA,
  CLIENTES_CONFEITARIA, CLIENTES_SALAO, CLIENTES_FOTOGRAFIA,
  PRODUTOS_CONFEITARIA, PACOTES_SALAO, PACOTES_FOTOGRAFIA,
  STATUS_CONTRATO,
} from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import CameraCapture from '../../components/CameraCapture'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

// Tela genérica pros 3 verticais (mesma ideia de AgendamentosVertical/
// CatalogoVertical): cliente + pacote/produto contratado + data do
// evento + status de assinatura. `tituloItem` só muda o rótulo do
// select (confeitaria vende "produto", os outros dois vendem "pacote").
const CONFIG_POR_VERTICAL = {
  confeitaria: {
    storageKey: 'alphadata_contratos_confeitaria', mock: CONTRATOS_CONFEITARIA, prefixoId: 'CTR-CF',
    clientes: CLIENTES_CONFEITARIA, pacotes: PRODUTOS_CONFEITARIA, campoPreco: 'precoVenda', tituloItem: 'Produto',
  },
  salao_festas: {
    storageKey: 'alphadata_contratos_salao', mock: CONTRATOS_SALAO, prefixoId: 'CTR-SL',
    clientes: CLIENTES_SALAO, pacotes: PACOTES_SALAO, campoPreco: 'precoBase', tituloItem: 'Pacote',
  },
  fotografia_video: {
    storageKey: 'alphadata_contratos_fotografia', mock: CONTRATOS_FOTOGRAFIA, prefixoId: 'CTR-FT',
    clientes: CLIENTES_FOTOGRAFIA, pacotes: PACOTES_FOTOGRAFIA, campoPreco: 'precoBase', tituloItem: 'Pacote',
  },
}

function proximoId(lista, prefixo) {
  const max = lista.reduce((acc, c) => {
    const n = Number(c.id.replace(`${prefixo}-`, ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `${prefixo}-${String(max + 1).padStart(3, '0')}`
}

export default function ContratosVertical() {
  const { user } = useAuth()
  const config = CONFIG_POR_VERTICAL[user?.tipoNegocio] ?? CONFIG_POR_VERTICAL.confeitaria

  const [contratos, setContratos] = usePersisted(config.storageKey, config.mock)
  const { showToast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [form, setForm] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [paraDeletar, setParaDeletar] = useState(null)

  const filtrados = useMemo(() => {
    let lista = contratos.filter((c) => c.clienteNome.toLowerCase().includes(busca.toLowerCase()))
    if (filtroStatus) lista = lista.filter((c) => c.status === filtroStatus)
    return [...lista].sort((a, b) => b.dataEvento.localeCompare(a.dataEvento))
  }, [contratos, busca, filtroStatus])

  function estadoVazio() {
    return { clienteId: config.clientes[0]?.id ?? '', pacoteId: config.pacotes[0]?.id ?? '', dataEvento: '', status: 'Pendente Assinatura', arquivo: null }
  }

  function contratoParaForm(c) {
    return { clienteId: c.clienteId, pacoteId: c.pacoteId, dataEvento: c.dataEvento, status: c.status, arquivo: c.arquivo ?? null }
  }

  function abrirCriar() {
    setEditandoId(null)
    setForm(estadoVazio())
  }

  function abrirEditar(c) {
    setEditandoId(c.id)
    setForm(contratoParaForm(c))
  }

  function handleSalvar(e) {
    e.preventDefault()
    const cliente = config.clientes.find((c) => c.id === form.clienteId)
    const pacote = config.pacotes.find((p) => p.id === form.pacoteId)
    const dados = {
      clienteId: form.clienteId,
      clienteNome: cliente?.nome ?? '—',
      pacoteId: form.pacoteId,
      pacoteNome: pacote?.nome ?? '—',
      dataEvento: form.dataEvento,
      valorTotal: pacote?.[config.campoPreco] ?? 0,
      status: form.status,
      arquivo: form.arquivo,
    }

    if (editandoId) {
      setContratos((prev) => prev.map((c) => (c.id === editandoId ? { ...c, ...dados } : c)))
      showToast('Contrato atualizado com sucesso!')
    } else {
      setContratos((prev) => [{ id: proximoId(prev, config.prefixoId), ...dados, criadoEm: new Date().toISOString().slice(0, 10) }, ...prev])
      showToast('Contrato criado com sucesso!')
    }
    setForm(null)
    setEditandoId(null)
  }

  function alterarStatus(id, status) {
    setContratos((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  function handleDeletar() {
    setContratos((prev) => prev.filter((c) => c.id !== paraDeletar.id))
    showToast('Contrato removido.')
    setParaDeletar(null)
  }

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: config.tituloItem, accessorKey: 'pacoteNome' },
    { header: 'Evento (data)', accessorKey: 'dataEvento' },
    { header: 'Valor', accessorKey: 'valorTotal', cell: (info) => `R$ ${Number(info.getValue() ?? 0).toLocaleString('pt-BR')}` },
    {
      header: 'Status', accessorKey: 'status', cell: (info) => (
        <select
          value={info.getValue()}
          onChange={(e) => alterarStatus(info.row.original.id, e.target.value)}
          className="text-label border-none bg-transparent focus:outline-none cursor-pointer"
        >
          {STATUS_CONTRATO.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
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

  const pacoteSelecionado = form ? config.pacotes.find((p) => p.id === form.pacoteId) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Contratos</h1>
        <button onClick={abrirCriar} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo Contrato
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
            {STATUS_CONTRATO.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={filtrados} columns={colunas} />
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title={editandoId ? 'Editar Contrato' : 'Novo Contrato'} size="md">
        {form && (
          <form onSubmit={handleSalvar} className="flex flex-col gap-4">
            <div>
              <label className={labelClasse}>Cliente *</label>
              <select required className={inputClasse} value={form.clienteId} onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}>
                {config.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasse}>{config.tituloItem} *</label>
              <select required className={inputClasse} value={form.pacoteId} onChange={(e) => setForm((f) => ({ ...f, pacoteId: e.target.value }))}>
                {config.pacotes.map((p) => <option key={p.id} value={p.id}>{p.nome} — R$ {Number(p[config.campoPreco] ?? 0).toLocaleString('pt-BR')}</option>)}
              </select>
              {pacoteSelecionado && (
                <p className="text-label text-[#666] mt-1">Valor do contrato: R$ {Number(pacoteSelecionado[config.campoPreco] ?? 0).toLocaleString('pt-BR')}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasse}>Data do evento *</label>
                <input required type="date" className={inputClasse} value={form.dataEvento} onChange={(e) => setForm((f) => ({ ...f, dataEvento: e.target.value }))} />
              </div>
              <div>
                <label className={labelClasse}>Status</label>
                <select className={inputClasse} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  {STATUS_CONTRATO.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <CameraCapture
              titulo="Anexar contrato assinado (foto/scan)"
              fotos={form.arquivo ? [form.arquivo] : []}
              onChange={(fotos) => setForm((f) => ({ ...f, arquivo: fotos[fotos.length - 1] ?? null }))}
              max={1}
            />

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
        titulo="Remover contrato"
        mensagem={`Tem certeza que deseja remover o contrato de ${paraDeletar?.clienteNome}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
