import { useEffect, useMemo, useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

const TIPOS_EVENTO = [
  { valor: 'aniversario', label: 'Aniversário' },
  { valor: 'casamento', label: 'Casamento' },
  { valor: 'corporativo', label: 'Corporativo' },
  { valor: 'formatura', label: 'Formatura' },
  { valor: 'confraternizacao', label: 'Confraternização' },
  { valor: 'outro', label: 'Outro' },
]

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR')
}

// Formulário de novo orçamento pro salão de festas: um orçamento aqui É
// um evento em status 'orcamento' (ver SalaoFestasService.criarEvento,
// que já grava status: 'orcamento' de propósito) — não existe uma
// entidade "orçamento" separada nesse vertical.
function FormularioNovoOrcamentoSalao({ onCriado, onCancelar }) {
  const { showToast } = useToast()
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [nomeEvento, setNomeEvento] = useState('')
  const [tipoEvento, setTipoEvento] = useState('aniversario')
  const [dataEvento, setDataEvento] = useState('')
  const [numeroConvidados, setNumeroConvidados] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api
      .get('/clientes?ativo=true')
      .then((lista) => {
        setClientes(lista)
        setClienteId((atual) => atual || lista[0]?.id || '')
      })
      .catch(() => setClientes([]))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!clienteId || !nomeEvento.trim() || !dataEvento) return
    setEnviando(true)
    try {
      await api.post('/salao-festas/eventos', {
        clienteId,
        nomeEvento: nomeEvento.trim(),
        tipoEvento,
        dataEvento: new Date(dataEvento).toISOString(),
        ...(numeroConvidados && { numeroConvidados: Number(numeroConvidados) }),
      })
      showToast('Orçamento criado com sucesso!')
      onCriado()
    } catch (erro) {
      showToast(erro instanceof ApiError ? erro.message : 'Falha ao criar o orçamento.', 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClasse}>Cliente *</label>
        <select required className={inputClasse} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Selecione...</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClasse}>Nome do evento *</label>
        <input required className={inputClasse} value={nomeEvento} onChange={(e) => setNomeEvento(e.target.value)} placeholder="Ex: Casamento Ana & João" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasse}>Tipo de evento *</label>
          <select required className={inputClasse} value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)}>
            {TIPOS_EVENTO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClasse}>Data do evento *</label>
          <input required type="date" className={inputClasse} value={dataEvento} onChange={(e) => setDataEvento(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClasse}>Número de convidados</label>
        <input type="number" min={1} className={inputClasse} value={numeroConvidados} onChange={(e) => setNumeroConvidados(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
        <button type="button" onClick={onCancelar} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
        <button type="submit" disabled={enviando} className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
          {enviando ? 'Criando...' : 'Criar Orçamento'}
        </button>
      </div>
    </form>
  )
}

// Manutenção não tem "criar orçamento do zero": todo orçamento nasce de
// um chamado aberto pelo cliente (POST /manutencao/chamados/:id/orcamento
// — ver ManutencaoService.gerarOrcamento). O botão "Novo Orçamento" aqui
// só dá acesso rápido a essa mesma ação, escolhendo o chamado num select
// em vez de precisar rolar até a lista "aguardando orçamento" abaixo.
function FormularioNovoOrcamentoManutencao({ chamados, onGerar, gerando, onCancelar }) {
  const [chamadoId, setChamadoId] = useState(chamados[0]?.id ?? '')

  if (chamados.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body text-[#666]">
          Nenhum chamado aguardando orçamento no momento. Um orçamento de manutenção só pode ser gerado a partir de um chamado aberto pelo cliente.
        </p>
        <div className="flex justify-end pt-2 border-t border-muted-dark">
          <button onClick={onCancelar} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Fechar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={labelClasse}>Chamado *</label>
        <select className={inputClasse} value={chamadoId} onChange={(e) => setChamadoId(e.target.value)}>
          {chamados.map((c) => <option key={c.id} value={c.id}>{c.categoria_manutencao} — {c.descricao}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
        <button onClick={onCancelar} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
        <button
          onClick={() => onGerar(chamadoId)}
          disabled={gerando === chamadoId}
          className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {gerando === chamadoId ? 'Gerando...' : 'Gerar Orçamento'}
        </button>
      </div>
    </div>
  )
}

// Manutenção tem uma entidade `orcamentos` própria (por chamado, gerada
// sob demanda) — Salão de Festas reaproveita o próprio `eventos.status
// === 'orcamento'` como o orçamento (ver SalaoFestasService.confirmarOrcamento).
// Por isso a tela ramifica a fonte de dados e as colunas por vertical,
// mesma ideia de ContratosVertical.jsx com CONFIG_POR_VERTICAL.
export default function Orcamentos() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const ehManutencao = user?.tipoNegocio === 'manutencao'

  const [orcamentos, setOrcamentos] = useState([])
  const [chamadosSemOrcamento, setChamadosSemOrcamento] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [gerandoId, setGerandoId] = useState(null)
  const [modalNovo, setModalNovo] = useState(false)

  function carregar() {
    setCarregando(true)
    setErro('')
    if (ehManutencao) {
      Promise.all([api.get('/manutencao/orcamentos'), api.get('/manutencao/chamados')])
        .then(([orcs, chamados]) => {
          setOrcamentos(orcs)
          setChamadosSemOrcamento(chamados.filter((c) => c.status === 'aberto'))
        })
        .catch((e) => setErro(e instanceof ApiError ? e.message : 'Falha ao carregar orçamentos.'))
        .finally(() => setCarregando(false))
    } else {
      api
        .get('/salao-festas/eventos?status=orcamento')
        .then(setOrcamentos)
        .catch((e) => setErro(e instanceof ApiError ? e.message : 'Falha ao carregar orçamentos.'))
        .finally(() => setCarregando(false))
    }
  }

  useEffect(() => {
    carregar()
  }, [ehManutencao])

  async function gerarOrcamento(chamadoId) {
    setGerandoId(chamadoId)
    try {
      await api.post(`/manutencao/chamados/${chamadoId}/orcamento`, {})
      showToast('Orçamento gerado com sucesso!')
      setModalNovo(false)
      carregar()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao gerar orçamento.', 'erro')
    } finally {
      setGerandoId(null)
    }
  }

  const colunas = useMemo(() => {
    if (ehManutencao) {
      return [
        { header: 'Chamado', accessorFn: (o) => o.chamados_manutencao?.descricao ?? '—', id: 'descricao' },
        { header: 'Categoria', accessorFn: (o) => o.chamados_manutencao?.categoria_manutencao ?? '—', id: 'categoria' },
        { header: 'Mão de obra', accessorKey: 'valor_mao_obra', cell: (info) => formatarMoeda(info.getValue()) },
        { header: 'Materiais', accessorKey: 'valor_materiais', cell: (info) => formatarMoeda(info.getValue()) },
        { header: 'Total', accessorKey: 'valor_total', cell: (info) => formatarMoeda(info.getValue()) },
        { header: 'Status', accessorKey: 'status', cell: (info) => <Badge status={info.getValue()} /> },
        { header: 'Criado em', accessorKey: 'criado_em', cell: (info) => formatarData(info.getValue()) },
      ]
    }
    return [
      { header: 'Evento', accessorKey: 'nomeEvento' },
      { header: 'Tipo', accessorKey: 'tipoEvento' },
      { header: 'Data do evento', accessorKey: 'dataEvento', cell: (info) => formatarData(info.getValue()) },
      { header: 'Valor', accessorKey: 'valorTotal', cell: (info) => formatarMoeda(info.getValue()) },
      { header: 'Status', accessorKey: 'status', cell: (info) => <Badge status={info.getValue()} /> },
    ]
  }, [ehManutencao])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Orçamentos</h1>
        <button
          onClick={() => setModalNovo(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium"
        >
          <IconPlus size={18} /> Novo Orçamento
        </button>
      </div>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <>
          {ehManutencao && chamadosSemOrcamento.length > 0 && (
            <div className="bg-surface rounded-card shadow-card p-5">
              <h2 className="text-h2 text-[#1a1a1a] mb-3">Chamados aguardando orçamento</h2>
              <div className="flex flex-col gap-2">
                {chamadosSemOrcamento.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 border-b border-muted-dark pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="text-body font-medium text-[#1a1a1a] capitalize">{c.categoria_manutencao}</p>
                      <p className="text-label text-[#666]">{c.descricao}</p>
                    </div>
                    <button
                      onClick={() => gerarOrcamento(c.id)}
                      disabled={gerandoId === c.id}
                      className="rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60 shrink-0"
                    >
                      {gerandoId === c.id ? 'Gerando...' : 'Gerar Orçamento'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-surface rounded-card shadow-card p-5">
            <DataTable data={orcamentos} columns={colunas} />
          </div>
        </>
      )}

      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Novo Orçamento" size="md">
        {ehManutencao ? (
          <FormularioNovoOrcamentoManutencao
            chamados={chamadosSemOrcamento}
            onGerar={gerarOrcamento}
            gerando={gerandoId}
            onCancelar={() => setModalNovo(false)}
          />
        ) : (
          <FormularioNovoOrcamentoSalao
            onCriado={() => {
              setModalNovo(false)
              carregar()
            }}
            onCancelar={() => setModalNovo(false)}
          />
        )}
      </Modal>
    </div>
  )
}
