import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { IconPlus, IconDotsVertical, IconHistory, IconEdit, IconTrash, IconStar } from '@tabler/icons-react'
import { usePrestadores } from '../../hooks/usePrestadores'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useToast } from '../../hooks/useToast'
import { ESPECIALIDADES } from '../../data/mock'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import StarRating from '../../components/ui/StarRating'
import Badge from '../../components/ui/Badge'

const CAMPOS_INICIAIS = { nome: '', especialidade: ESPECIALIDADES[0], telefone: '', email: '', ativo: true }
const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

function AcoesDropdown({ prestador, onHistorico, onAvaliacoes, onEditar, onDeletar }) {
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
            <button onClick={() => { onHistorico(prestador); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-primary-light text-left"><IconHistory size={16} /> Histórico</button>
            <button onClick={() => { onAvaliacoes(prestador); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-primary-light text-left"><IconStar size={16} /> Ver avaliações</button>
            <button onClick={() => { onEditar(prestador); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-primary-light text-left"><IconEdit size={16} /> Editar</button>
            <button onClick={() => { onDeletar(prestador); setAberto(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-body hover:bg-red-50 text-danger text-left border-t border-muted-dark"><IconTrash size={16} /> Deletar</button>
          </div>
        </>
      )}
    </div>
  )
}

export default function Prestadores() {
  const { prestadores, addPrestador, updatePrestador, deletePrestador } = usePrestadores()
  const { ordens } = useOrdensServico()
  const { showToast } = useToast()

  const [filtroEspecialidade, setFiltroEspecialidade] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [ordenarPor, setOrdenarPor] = useState('nome')
  const [modalForm, setModalForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [dados, setDados] = useState(CAMPOS_INICIAIS)
  const [historicoPrestador, setHistoricoPrestador] = useState(null)
  const [avaliacoesPrestador, setAvaliacoesPrestador] = useState(null)
  const [paraDeletar, setParaDeletar] = useState(null)

  const prestadoresFiltrados = useMemo(() => {
    let lista = prestadores.filter((p) => {
      if (filtroEspecialidade && p.especialidade !== filtroEspecialidade) return false
      if (filtroStatus && (filtroStatus === 'ativo' ? !p.ativo : p.ativo)) return false
      return true
    })
    lista = [...lista].sort((a, b) => {
      if (ordenarPor === 'nome') return a.nome.localeCompare(b.nome)
      if (ordenarPor === 'avaliacao') return b.avaliacao - a.avaliacao
      if (ordenarPor === 'totalOS') return b.totalOS - a.totalOS
      return 0
    })
    return lista
  }, [prestadores, filtroEspecialidade, filtroStatus, ordenarPor])

  const dadosProducao = useMemo(() => {
    const limite = new Date()
    limite.setDate(limite.getDate() - 30)
    return prestadores.map((p) => ({
      nome: p.nome.split(' ')[0],
      quantidade: ordens.filter((o) => o.tecnicoId === p.id && new Date(o.dataAgendada) >= limite).length,
    }))
  }, [prestadores, ordens])

  function abrirNovo() {
    setEditando(null)
    setDados(CAMPOS_INICIAIS)
    setModalForm(true)
  }
  function abrirEdicao(p) {
    setEditando(p)
    setDados(p)
    setModalForm(true)
  }
  function handleSalvar(e) {
    e.preventDefault()
    if (editando) {
      updatePrestador(editando.id, dados)
      showToast('Prestador atualizado com sucesso!')
    } else {
      addPrestador(dados)
      showToast('Prestador cadastrado com sucesso!')
    }
    setModalForm(false)
  }
  function handleDeletar() {
    deletePrestador(paraDeletar.id)
    showToast('Prestador removido.')
    setParaDeletar(null)
  }

  const colunas = [
    { header: 'Nome', accessorKey: 'nome' },
    { header: 'Especialidade', accessorKey: 'especialidade' },
    { header: 'Telefone', accessorKey: 'telefone' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'OS Concluídas', accessorKey: 'totalOS' },
    { header: 'Avaliação', accessorKey: 'avaliacao', cell: (info) => <StarRating value={info.getValue()} /> },
    { header: 'Status', accessorKey: 'ativo', cell: (info) => (
        <span className={`text-label font-medium rounded-full px-2.5 py-1 ${info.getValue() ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
          {info.getValue() ? 'Ativo' : 'Inativo'}
        </span>
      ) },
    { header: 'Ações', id: 'acoes', cell: (info) => (
        <AcoesDropdown prestador={info.row.original} onHistorico={setHistoricoPrestador} onAvaliacoes={setAvaliacoesPrestador} onEditar={abrirEdicao} onDeletar={setParaDeletar} />
      ) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Prestadores ALPHADATA</h1>
        <button onClick={abrirNovo} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo Prestador
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClasse}>Especialidade</label>
          <select className={inputClasse} value={filtroEspecialidade} onChange={(e) => setFiltroEspecialidade(e.target.value)}>
            <option value="">Todas</option>
            {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClasse}>Status</label>
          <select className={inputClasse} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <div>
          <label className={labelClasse}>Ordenar por</label>
          <select className={inputClasse} value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
            <option value="nome">Nome</option>
            <option value="avaliacao">Avaliação</option>
            <option value="totalOS">OS Concluídas</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={prestadoresFiltrados} columns={colunas} />
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <h2 className="text-h2 text-[#1a1a1a] mb-4">Produções por Técnico (últimos 30 dias)</h2>
        <ResponsiveContainer width="100%" height={Math.max(250, dadosProducao.length * 40)}>
          <BarChart data={dadosProducao} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="nome" width={80} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="quantidade" fill="#0066CC" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Modal open={modalForm} onClose={() => setModalForm(false)} title={editando ? 'Editar Prestador' : 'Novo Prestador'}>
        <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClasse}>Nome *</label><input required className={inputClasse} value={dados.nome} onChange={(e) => setDados((d) => ({ ...d, nome: e.target.value }))} /></div>
          <div>
            <label className={labelClasse}>Especialidade</label>
            <select className={inputClasse} value={dados.especialidade} onChange={(e) => setDados((d) => ({ ...d, especialidade: e.target.value }))}>
              {ESPECIALIDADES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div><label className={labelClasse}>Telefone</label><input className={inputClasse} value={dados.telefone} onChange={(e) => setDados((d) => ({ ...d, telefone: e.target.value }))} /></div>
          <div><label className={labelClasse}>Email</label><input type="email" className={inputClasse} value={dados.email} onChange={(e) => setDados((d) => ({ ...d, email: e.target.value }))} /></div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input type="checkbox" id="ativoTec" checked={dados.ativo} onChange={(e) => setDados((d) => ({ ...d, ativo: e.target.checked }))} />
            <label htmlFor="ativoTec" className="text-body">Prestador ativo</label>
          </div>
          <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalForm(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!historicoPrestador} onClose={() => setHistoricoPrestador(null)} title={`Histórico — ${historicoPrestador?.nome ?? ''}`} size="lg">
        <div className="flex flex-col gap-2">
          {ordens.filter((o) => o.tecnicoId === historicoPrestador?.id).length === 0 && <p className="text-body text-[#999]">Nenhuma ordem registrada.</p>}
          {ordens.filter((o) => o.tecnicoId === historicoPrestador?.id).map((o) => (
            <div key={o.id} className="flex items-center justify-between border border-muted-dark rounded-card p-3">
              <div>
                <p className="text-body font-semibold">{o.id} — {o.clienteNome}</p>
                <p className="text-label text-[#666]">{o.tipoServico} · {o.dataAgendada}</p>
              </div>
              <Badge status={o.status} />
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={!!avaliacoesPrestador} onClose={() => setAvaliacoesPrestador(null)} title={`Avaliações — ${avaliacoesPrestador?.nome ?? ''}`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-body font-medium">Média geral:</span>
            <StarRating value={avaliacoesPrestador?.avaliacao ?? 0} />
          </div>
          {ordens.filter((o) => o.tecnicoId === avaliacoesPrestador?.id && o.avaliacao).length === 0 && (
            <p className="text-body text-[#999]">Sem avaliações de clientes ainda.</p>
          )}
          {ordens.filter((o) => o.tecnicoId === avaliacoesPrestador?.id && o.avaliacao).map((o) => (
            <div key={o.id} className="border border-muted-dark rounded-card p-3">
              <StarRating value={o.avaliacao.estrelas} showNumber={false} />
              <p className="text-body text-[#333] mt-1">"{o.avaliacao.comentario}"</p>
              <p className="text-label text-[#999] mt-1">{o.clienteNome} · {o.id}</p>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        open={!!paraDeletar}
        onClose={() => setParaDeletar(null)}
        onConfirm={handleDeletar}
        titulo="Deletar prestador"
        mensagem={`Tem certeza que deseja deletar ${paraDeletar?.nome}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Deletar"
      />
    </div>
  )
}
