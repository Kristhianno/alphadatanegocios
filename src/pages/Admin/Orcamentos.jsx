import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR')
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
      <h1 className="text-h1 text-primary">Orçamentos</h1>

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
    </div>
  )
}
