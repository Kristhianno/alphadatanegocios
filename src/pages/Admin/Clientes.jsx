import { useMemo, useState } from 'react'
import { IconPlus, IconDotsVertical, IconHistory, IconEdit, IconTrash, IconMessage, IconLink, IconCopy, IconCheck } from '@tabler/icons-react'
import { useClientes } from '../../hooks/useClientes'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useToast } from '../../hooks/useToast'
import { useBranding } from '../../hooks/useBranding'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Badge from '../../components/ui/Badge'

const CAMPOS_INICIAIS = { nome: '', telefone: '', email: '', endereco: '', cidade: '', estado: '', cnpj: '', ativo: true }
const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

function AcoesDropdown({ cliente, onHistorico, onEditar, onDeletar, onMensagem }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="relative inline-block">
      <button onClick={() => setAberto((v) => !v)} className="p-1.5 rounded-btn hover:bg-muted" aria-label="Ações">
        <IconDotsVertical size={18} />
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-surface rounded-card shadow-cardHover z-20 overflow-hidden border border-muted-dark">
            <button onClick={() => { onHistorico(cliente); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-primary-light text-left">
              <IconHistory size={16} /> Histórico
            </button>
            <button onClick={() => { onEditar(cliente); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-primary-light text-left">
              <IconEdit size={16} /> Editar
            </button>
            <button onClick={() => { onMensagem(cliente); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-primary-light text-left">
              <IconMessage size={16} /> Enviar mensagem
            </button>
            <button onClick={() => { onDeletar(cliente); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-red-50 text-danger text-left border-t border-muted-dark">
              <IconTrash size={16} /> Desativar
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Clientes() {
  const { clientes, addCliente, updateCliente, deleteCliente, gerarConviteCliente } = useClientes()
  const { ordens } = useOrdensServico()
  const { showToast } = useToast()
  const { nomeExibido } = useBranding()

  const [busca, setBusca] = useState('')
  const [ordenarPor, setOrdenarPor] = useState('nome')
  const [filtroAtivo, setFiltroAtivo] = useState('')
  const [modalForm, setModalForm] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const [dados, setDados] = useState(CAMPOS_INICIAIS)
  const [historicoCliente, setHistoricoCliente] = useState(null)
  const [clienteParaDeletar, setClienteParaDeletar] = useState(null)
  const [linkConvite, setLinkConvite] = useState(null)
  const [gerandoConvite, setGerandoConvite] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const clientesFiltrados = useMemo(() => {
    let lista = clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()))
    if (filtroAtivo) lista = lista.filter((c) => (filtroAtivo === 'ativo' ? c.ativo : !c.ativo))
    lista = [...lista].sort((a, b) => {
      if (ordenarPor === 'nome') return a.nome.localeCompare(b.nome)
      if (ordenarPor === 'totalOS') return b.totalOS - a.totalOS
      if (ordenarPor === 'ultimaOS') return (b.ultimaOS ?? '').localeCompare(a.ultimaOS ?? '')
      return 0
    })
    return lista
  }, [clientes, busca, filtroAtivo, ordenarPor])

  function abrirNovo() {
    setClienteEditando(null)
    setDados(CAMPOS_INICIAIS)
    setModalForm(true)
  }

  function abrirEdicao(cliente) {
    setClienteEditando(cliente)
    setDados(cliente)
    setModalForm(true)
  }

  async function handleSalvar(e) {
    e.preventDefault()
    try {
      if (clienteEditando) {
        await updateCliente(clienteEditando.id, dados)
        showToast('Cliente atualizado com sucesso!')
      } else {
        await addCliente(dados)
        showToast('Cliente criado com sucesso!')
      }
      setModalForm(false)
    } catch (erro) {
      showToast(erro.message ?? 'Falha ao salvar cliente.', 'erro')
    }
  }

  async function handleDeletar() {
    try {
      await deleteCliente(clienteParaDeletar.id)
      showToast('Cliente desativado.')
    } catch (erro) {
      showToast(erro.message ?? 'Falha ao desativar cliente.', 'erro')
    } finally {
      setClienteParaDeletar(null)
    }
  }

  async function handleGerarConvite() {
    setGerandoConvite(true)
    setLinkCopiado(false)
    try {
      const link = await gerarConviteCliente()
      setLinkConvite(link)
    } catch (erro) {
      showToast(erro.message ?? 'Falha ao gerar o convite.', 'erro')
    } finally {
      setGerandoConvite(false)
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkConvite)
      setLinkCopiado(true)
      setTimeout(() => setLinkCopiado(false), 2000)
    } catch {
      showToast('Não foi possível copiar automaticamente — selecione e copie manualmente.', 'erro')
    }
  }

  const colunas = [
    { header: 'Nome', accessorKey: 'nome' },
    { header: 'Telefone', accessorKey: 'telefone' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Cidade/UF', accessorFn: (c) => `${c.cidade}/${c.estado}` },
    { header: 'Total OS', accessorKey: 'totalOS' },
    { header: 'Última OS', accessorKey: 'ultimaOS', cell: (info) => info.getValue() ?? '—' },
    { header: 'Status', accessorKey: 'ativo', cell: (info) => (
        <span className={`text-label font-medium rounded-full px-2.5 py-1 ${info.getValue() ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {info.getValue() ? 'Ativo' : 'Inativo'}
        </span>
      ) },
    { header: 'Ações', id: 'acoes', cell: (info) => (
        <AcoesDropdown
          cliente={info.row.original}
          onHistorico={setHistoricoCliente}
          onEditar={abrirEdicao}
          onDeletar={setClienteParaDeletar}
          onMensagem={(c) => showToast(`Mensagem enviada para ${c.nome}.`)}
        />
      ) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Clientes {nomeExibido}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGerarConvite}
            disabled={gerandoConvite}
            className="flex items-center gap-2 bg-surface border border-primary text-primary hover:bg-primary-light rounded-btn px-4 py-2 text-body font-medium disabled:opacity-60"
          >
            <IconLink size={18} /> {gerandoConvite ? 'Gerando link...' : 'Convidar Cliente'}
          </button>
          <button onClick={abrirNovo} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
            <IconPlus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className={labelClasse}>Buscar por nome</label>
          <input className={inputClasse} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite o nome..." />
        </div>
        <div>
          <label className={labelClasse}>Ordenar por</label>
          <select className={inputClasse} value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
            <option value="nome">Nome</option>
            <option value="totalOS">Total OS</option>
            <option value="ultimaOS">Últimas OS</option>
          </select>
        </div>
        <div>
          <label className={labelClasse}>Status</label>
          <select className={inputClasse} value={filtroAtivo} onChange={(e) => setFiltroAtivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={clientesFiltrados} columns={colunas} />
      </div>

      <Modal open={modalForm} onClose={() => setModalForm(false)} title={clienteEditando ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClasse}>Nome *</label><input required className={inputClasse} value={dados.nome} onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))} /></div>
          <div><label className={labelClasse}>Telefone</label><input className={inputClasse} value={dados.telefone} onChange={(e) => setDados((d) => ({ ...d, telefone: e.target.value }))} /></div>
          <div><label className={labelClasse}>Email</label><input type="email" className={inputClasse} value={dados.email} onChange={(e) => setDados((d) => ({ ...d, email: e.target.value }))} /></div>
          <div><label className={labelClasse}>CNPJ</label><input className={inputClasse} value={dados.cnpj} onChange={(e) => setDados((d) => ({ ...d, cnpj: e.target.value }))} /></div>
          <div className="md:col-span-2"><label className={labelClasse}>Endereço</label><input className={inputClasse} value={dados.endereco} onChange={(e) => setDados((d) => ({ ...d, endereco: e.target.value }))} /></div>
          <div><label className={labelClasse}>Cidade</label><input className={inputClasse} value={dados.cidade} onChange={(e) => setDados((d) => ({ ...d, cidade: e.target.value }))} /></div>
          <div><label className={labelClasse}>Estado</label><input className={inputClasse} value={dados.estado} onChange={(e) => setDados((d) => ({ ...d, estado: e.target.value }))} /></div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" id="ativo" checked={dados.ativo} onChange={(e) => setDados((d) => ({ ...d, ativo: e.target.checked }))} />
            <label htmlFor="ativo" className="text-body">Cliente ativo</label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalForm(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!linkConvite} onClose={() => setLinkConvite(null)} title="Convite de Cliente" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-body text-[#666]">
            Envie este link para o futuro cliente. Ele preenche o próprio cadastro e já recebe login e senha temporária
            para acessar a plataforma. O link expira em 7 dias.
          </p>
          <div className="flex items-center gap-2">
            <input readOnly value={linkConvite ?? ''} className="flex-1 rounded-input border border-muted-dark px-3 py-2 text-body bg-muted" onFocus={(e) => e.target.select()} />
            <button
              onClick={copiarLink}
              className="flex items-center gap-1.5 shrink-0 rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark"
            >
              {linkCopiado ? <IconCheck size={18} /> : <IconCopy size={18} />}
              {linkCopiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!historicoCliente} onClose={() => setHistoricoCliente(null)} title={`Histórico — ${historicoCliente?.nome ?? ''}`} size="lg">
        <div className="flex flex-col gap-2">
          {ordens.filter((o) => o.clienteId === historicoCliente?.id).length === 0 && <p className="text-body text-[#999]">Nenhuma ordem registrada.</p>}
          {ordens.filter((o) => o.clienteId === historicoCliente?.id).map((o) => (
            <div key={o.id} className="flex items-center justify-between border border-muted-dark rounded-card p-3">
              <div>
                <p className="text-body font-semibold">{o.id} — {o.tipoServico}</p>
                <p className="text-label text-[#666]">{o.dataAgendada} · R$ {o.valor}</p>
              </div>
              <Badge status={o.status} />
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        open={!!clienteParaDeletar}
        onClose={() => setClienteParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Desativar cliente"
        mensagem={`Tem certeza que deseja desativar ${clienteParaDeletar?.nome}? O cadastro é mantido, só deixa de aparecer como ativo.`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Desativar"
      />
    </div>
  )
}
