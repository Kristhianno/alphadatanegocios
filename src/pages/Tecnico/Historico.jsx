import { useMemo, useState } from 'react'
import { IconEye, IconStar } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useClientes } from '../../hooks/useClientes'
import Badge from '../../components/ui/Badge'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import StarRating from '../../components/ui/StarRating'
import Checklist from '../../components/Checklist'
import Assinatura from '../../components/Assinatura'

const inputClasse = 'rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function Historico() {
  const { user } = useAuth()
  const { ordens } = useOrdensServico()
  const { clientes } = useClientes()

  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [ordenarPor, setOrdenarPor] = useState('data')
  const [visualizando, setVisualizando] = useState(null)
  const [avaliacaoAberta, setAvaliacaoAberta] = useState(null)

  const finalizadas = useMemo(() => {
    let lista = ordens.filter((o) => o.tecnicoId === user.tecnicoId && o.status === 'Concluída')
    if (dataInicio) lista = lista.filter((o) => o.dataAgendada >= dataInicio)
    if (dataFim) lista = lista.filter((o) => o.dataAgendada <= dataFim)
    if (clienteId) lista = lista.filter((o) => o.clienteId === clienteId)
    lista = [...lista].sort((a, b) => {
      if (ordenarPor === 'data') return b.dataAgendada.localeCompare(a.dataAgendada)
      if (ordenarPor === 'cliente') return a.clienteNome.localeCompare(b.clienteNome)
      if (ordenarPor === 'valor') return b.valor - a.valor
      return 0
    })
    return lista
  }, [ordens, user.tecnicoId, dataInicio, dataFim, clienteId, ordenarPor])

  const clientesComOrdem = useMemo(
    () => clientes.filter((c) => ordens.some((o) => o.tecnicoId === user.tecnicoId && o.clienteId === c.id)),
    [clientes, ordens, user.tecnicoId]
  )

  const colunas = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Cliente', accessorKey: 'clienteNome' },
    { header: 'Serviço', accessorKey: 'tipoServico' },
    { header: 'Data', accessorKey: 'dataAgendada' },
    { header: 'Valor', accessorKey: 'valor', cell: (info) => `R$ ${info.getValue()}` },
    { header: 'Avaliação', accessorKey: 'avaliacao', cell: (info) => (info.getValue() ? <StarRating value={info.getValue().estrelas} showNumber={false} size={14} /> : <span className="text-[#999] text-label">Sem avaliação</span>) },
    { header: 'Ações', id: 'acoes', cell: (info) => (
        <div className="flex gap-2">
          <button onClick={() => setVisualizando(info.row.original)} className="p-1.5 rounded-btn hover:bg-muted text-primary" aria-label="Visualizar"><IconEye size={18} /></button>
          {info.row.original.avaliacao && (
            <button onClick={() => setAvaliacaoAberta(info.row.original)} className="p-1.5 rounded-btn hover:bg-muted text-yellow-500" aria-label="Ver avaliação"><IconStar size={18} /></button>
          )}
        </div>
      ) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Histórico de Ordens ALPHADATA</h1>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div><label className={labelClasse}>De</label><input type="date" className={inputClasse} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} /></div>
        <div><label className={labelClasse}>Até</label><input type="date" className={inputClasse} value={dataFim} onChange={(e) => setDataFim(e.target.value)} /></div>
        <div>
          <label className={labelClasse}>Cliente</label>
          <select className={inputClasse} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Todos</option>
            {clientesComOrdem.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClasse}>Ordenar por</label>
          <select className={inputClasse} value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
            <option value="data">Data</option>
            <option value="cliente">Cliente</option>
            <option value="valor">Valor</option>
          </select>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <DataTable data={finalizadas} columns={colunas} />
      </div>

      <Modal open={!!visualizando} onClose={() => setVisualizando(null)} title={`Ordem ${visualizando?.id ?? ''} (somente leitura)`} size="lg">
        {visualizando && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-body">
              <p><span className="text-[#666]">Cliente:</span> {visualizando.clienteNome}</p>
              <p><span className="text-[#666]">Serviço:</span> {visualizando.tipoServico}</p>
              <p><span className="text-[#666]">Data:</span> {visualizando.dataAgendada} {visualizando.hora}</p>
              <p><span className="text-[#666]">Valor:</span> R$ {visualizando.valor}</p>
              <p className="md:col-span-2"><span className="text-[#666]">Endereço:</span> {visualizando.endereco}</p>
            </div>
            <div>
              <p className="text-label text-[#666] mb-2">Checklist</p>
              <Checklist itens={visualizando.checklist} onChange={() => {}} readOnly />
            </div>
            <div>
              <p className="text-label text-[#666] mb-2">Fotos</p>
              <div className="flex flex-wrap gap-2">
                {['antes', 'durante', 'depois'].flatMap((etapa) =>
                  visualizando.fotos[etapa].map((foto, i) => (
                    <img key={`${etapa}-${i}`} src={foto} alt={etapa} className="w-20 h-20 object-cover rounded-card border border-muted-dark" />
                  ))
                )}
                {Object.values(visualizando.fotos).every((arr) => arr.length === 0) && <p className="text-body text-[#999]">Nenhuma foto registrada.</p>}
              </div>
            </div>
            <Assinatura clienteNome={visualizando.clienteNome} valorSalvo={visualizando.assinatura} readOnly />
            {visualizando.avaliacao && (
              <div className="border border-muted-dark rounded-card p-3">
                <StarRating value={visualizando.avaliacao.estrelas} />
                <p className="text-body text-[#333] mt-1">"{visualizando.avaliacao.comentario}"</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!avaliacaoAberta} onClose={() => setAvaliacaoAberta(null)} title="Avaliação do Cliente">
        {avaliacaoAberta?.avaliacao && (
          <div className="flex flex-col gap-2">
            <StarRating value={avaliacaoAberta.avaliacao.estrelas} />
            <p className="text-body text-[#333]">"{avaliacaoAberta.avaliacao.comentario}"</p>
            <p className="text-label text-[#999]">{avaliacaoAberta.clienteNome} · {avaliacaoAberta.id}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
