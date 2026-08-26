import { useMemo, useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useClientes } from '../../hooks/useClientes'
import { usePrestadores } from '../../hooks/usePrestadores'
import { useToast } from '../../hooks/useToast'
import { useBranding } from '../../hooks/useBranding'
import { STATUS_OS } from '../../data/mock'
import Kanban from '../../components/Kanban'
import FormularioOS from '../../components/FormularioOS'
import Checklist from '../../components/Checklist'
import Assinatura from '../../components/Assinatura'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Badge from '../../components/ui/Badge'

const FILTROS_INICIAIS = { status: '', clienteId: '', tecnicoId: '', dataInicio: '', dataFim: '' }

export default function OrdensServico() {
  const { ordens, addOrdem, updateOrdem, updateStatus, deleteOrdem } = useOrdensServico()
  const { clientes } = useClientes()
  const { prestadores } = usePrestadores()
  const { showToast } = useToast()
  const { nomeExibido } = useBranding()

  const [filtros, setFiltros] = useState(FILTROS_INICIAIS)
  const [modalCriar, setModalCriar] = useState(false)
  const [ordemSelecionada, setOrdemSelecionada] = useState(null)
  const [editando, setEditando] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      if (filtros.status && o.status !== filtros.status) return false
      if (filtros.clienteId && o.clienteId !== filtros.clienteId) return false
      if (filtros.tecnicoId && o.tecnicoId !== filtros.tecnicoId) return false
      if (filtros.dataInicio && o.dataAgendada < filtros.dataInicio) return false
      if (filtros.dataFim && o.dataAgendada > filtros.dataFim) return false
      return true
    })
  }, [ordens, filtros])

  function handleCriar(dados) {
    const nova = addOrdem(dados)
    setModalCriar(false)
    showToast(`Ordem criada com sucesso! ID: #${nova.id}`)
  }

  function handleSalvarEdicao(dados) {
    updateOrdem(ordemSelecionada.id, dados)
    setOrdemSelecionada(null)
    setEditando(false)
    showToast('Ordem atualizada com sucesso!')
  }

  function handleDeletar() {
    deleteOrdem(ordemSelecionada.id)
    setConfirmarExclusao(false)
    setOrdemSelecionada(null)
    showToast('Ordem removida.')
  }

  const inputClasse = 'rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Ordens de Serviço {nomeExibido}</h1>
        <button
          onClick={() => setModalCriar(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium"
        >
          <IconPlus size={18} /> Nova Ordem
        </button>
      </div>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-label text-[#666] block mb-1">Status</label>
          <select className={inputClasse} value={filtros.status} onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Todos</option>
            {STATUS_OS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-label text-[#666] block mb-1">Cliente</label>
          <select className={inputClasse} value={filtros.clienteId} onChange={(e) => setFiltros((f) => ({ ...f, clienteId: e.target.value }))}>
            <option value="">Todos</option>
            {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-label text-[#666] block mb-1">Técnico</label>
          <select className={inputClasse} value={filtros.tecnicoId} onChange={(e) => setFiltros((f) => ({ ...f, tecnicoId: e.target.value }))}>
            <option value="">Todos</option>
            {prestadores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-label text-[#666] block mb-1">De</label>
          <input type="date" className={inputClasse} value={filtros.dataInicio} onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))} />
        </div>
        <div>
          <label className="text-label text-[#666] block mb-1">Até</label>
          <input type="date" className={inputClasse} value={filtros.dataFim} onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))} />
        </div>
        <button onClick={() => setFiltros(FILTROS_INICIAIS)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          Limpar
        </button>
      </div>

      <Kanban
        ordens={ordensFiltradas}
        onStatusChange={(id, status) => {
          updateStatus(id, status)
          showToast(`Ordem ${id} movida para "${status}".`)
        }}
        onCardClick={(ordem) => {
          setOrdemSelecionada(ordem)
          setEditando(false)
        }}
      />

      {/* Modal Nova Ordem */}
      <Modal open={modalCriar} onClose={() => setModalCriar(false)} title={`Nova Ordem ${nomeExibido}`} size="lg">
        <FormularioOS onSubmit={handleCriar} onCancel={() => setModalCriar(false)} />
      </Modal>

      {/* Modal Detalhes / Edição */}
      <Modal
        open={!!ordemSelecionada && !editando}
        onClose={() => setOrdemSelecionada(null)}
        title={`Ordem ${ordemSelecionada?.id ?? ''}`}
        size="lg"
        footer={
          ordemSelecionada && (
            <>
              <button onClick={() => setConfirmarExclusao(true)} className="rounded-btn px-4 py-2 text-body font-medium bg-danger text-white hover:bg-red-600 mr-auto">
                Deletar
              </button>
              <button onClick={() => setOrdemSelecionada(null)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
                Fechar
              </button>
              <button onClick={() => setEditando(true)} className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
                Editar
              </button>
            </>
          )
        }
      >
        {ordemSelecionada && !editando && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-body">
              <p><span className="text-[#666]">ID:</span> <strong>{ordemSelecionada.id}</strong></p>
              <p><span className="text-[#666]">Cliente:</span> {ordemSelecionada.clienteNome}</p>
              <p><span className="text-[#666]">Técnico:</span> {ordemSelecionada.tecnicoNome ?? 'Não atribuído'}</p>
              <p><span className="text-[#666]">Data/Hora:</span> {ordemSelecionada.dataAgendada} {ordemSelecionada.hora}</p>
              <p className="md:col-span-2"><span className="text-[#666]">Endereço:</span> {ordemSelecionada.endereco}</p>
              <p><span className="text-[#666]">Tipo de Serviço:</span> {ordemSelecionada.tipoServico}</p>
              <p><span className="text-[#666]">Valor:</span> R$ {ordemSelecionada.valor}</p>
            </div>
            <div>
              <p className="text-label text-[#666] mb-1">Descrição</p>
              <p className="text-body bg-muted rounded-card p-3">{ordemSelecionada.descricao || 'Sem descrição.'}</p>
            </div>

            <div>
              <p className="text-label text-[#666] mb-2">Checklist</p>
              <Checklist itens={ordemSelecionada.checklist} onChange={() => {}} readOnly />
            </div>

            {Object.entries(ordemSelecionada.fotos).some(([, arr]) => arr.length > 0) && (
              <div>
                <p className="text-label text-[#666] mb-2">Fotos</p>
                <div className="flex flex-wrap gap-2">
                  {['antes', 'durante', 'depois'].flatMap((etapa) =>
                    ordemSelecionada.fotos[etapa].map((foto, i) => (
                      <img key={`${etapa}-${i}`} src={foto} alt={etapa} className="w-20 h-20 object-cover rounded-card border border-muted-dark" />
                    ))
                  )}
                </div>
              </div>
            )}

            {ordemSelecionada.assinatura && <Assinatura clienteNome={ordemSelecionada.clienteNome} valorSalvo={ordemSelecionada.assinatura} readOnly />}

            <div>
              <label className="text-label text-[#666] block mb-1">Status</label>
              <select
                className={inputClasse}
                value={ordemSelecionada.status}
                onChange={(e) => {
                  updateStatus(ordemSelecionada.id, e.target.value)
                  setOrdemSelecionada((prev) => ({ ...prev, status: e.target.value }))
                }}
              >
                {STATUS_OS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="mt-2"><Badge status={ordemSelecionada.status} /></div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!ordemSelecionada && editando} onClose={() => setEditando(false)} title={`Editar Ordem ${ordemSelecionada?.id ?? ''}`} size="lg">
        {ordemSelecionada && (
          <FormularioOS
            ordemExistente={ordemSelecionada}
            onSubmit={handleSalvarEdicao}
            onCancel={() => setEditando(false)}
            onDelete={() => setConfirmarExclusao(true)}
          />
        )}
      </Modal>

      <ConfirmModal
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={handleDeletar}
        titulo="Deletar ordem"
        mensagem={`Tem certeza que deseja deletar a ordem ${ordemSelecionada?.id}? Esta ação não pode ser desfeita.`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Deletar"
      />
    </div>
  )
}
