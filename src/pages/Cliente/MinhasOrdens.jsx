import { useEffect, useMemo, useState } from 'react'
import { useBranding } from '../../hooks/useBranding'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

const inputClasse = 'rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

const CATEGORIAS = ['preventiva', 'corretiva', 'emergencia']

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MinhasOrdens() {
  const { nomeExibido } = useBranding()
  const { showToast } = useToast()

  const [chamados, setChamados] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [categoria, setCategoria] = useState('')

  const [chamadoDetalhes, setChamadoDetalhes] = useState(null)
  const [orcamento, setOrcamento] = useState(null)
  const [carregandoOrcamento, setCarregandoOrcamento] = useState(false)
  const [aceitando, setAceitando] = useState(false)

  function carregarChamados() {
    setCarregando(true)
    api
      .get('/manutencao/chamados')
      .then(setChamados)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Falha ao carregar seus chamados.'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregarChamados()
  }, [])

  const chamadosFiltrados = useMemo(
    () => (categoria ? chamados.filter((c) => c.categoria_manutencao === categoria) : chamados),
    [chamados, categoria]
  )

  function abrirDetalhes(chamado) {
    setChamadoDetalhes(chamado)
    setOrcamento(null)
    if (chamado.status === 'orcamento_enviado') {
      setCarregandoOrcamento(true)
      api
        .get(`/manutencao/chamados/${chamado.id}/orcamento`)
        .then(setOrcamento)
        .catch(() => setOrcamento(null))
        .finally(() => setCarregandoOrcamento(false))
    }
  }

  async function aceitarOrcamento() {
    setAceitando(true)
    try {
      await api.post(`/manutencao/chamados/${chamadoDetalhes.id}/orcamento/aceitar`, {})
      showToast('Orçamento aceito com sucesso!')
      setChamadoDetalhes(null)
      carregarChamados()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao aceitar o orçamento.', 'erro')
    } finally {
      setAceitando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Minhas Ordens {nomeExibido}</h1>

      <div className="bg-surface rounded-card shadow-card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClasse}>Categoria</label>
          <select className={inputClasse} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chamadosFiltrados.map((c) => (
            <div key={c.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge>{c.prioridade}</Badge>
                <Badge status={c.status} />
              </div>
              <p className="text-body font-semibold text-[#1a1a1a] capitalize">{c.categoria_manutencao}</p>
              <p className="text-label text-[#666] mt-1">{c.descricao}</p>
              <button
                onClick={() => abrirDetalhes(c)}
                className="mt-3 w-full rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark"
              >
                Ver Detalhes
              </button>
            </div>
          ))}
          {chamadosFiltrados.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhum chamado encontrado.</p>}
        </div>
      )}

      <Modal open={!!chamadoDetalhes} onClose={() => setChamadoDetalhes(null)} title="Detalhes do Chamado" size="sm">
        {chamadoDetalhes && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 text-body">
              <p><span className="text-[#666]">Categoria:</span> {chamadoDetalhes.categoria_manutencao}</p>
              <p><span className="text-[#666]">Prioridade:</span> {chamadoDetalhes.prioridade}</p>
              <p><span className="text-[#666]">Status:</span> <Badge status={chamadoDetalhes.status} /></p>
              <p><span className="text-[#666]">Descrição:</span> {chamadoDetalhes.descricao}</p>
            </div>

            {chamadoDetalhes.status === 'orcamento_enviado' && (
              <div className="border-t border-muted-dark pt-3">
                {carregandoOrcamento && <p className="text-body text-[#999]">Carregando orçamento...</p>}
                {!carregandoOrcamento && orcamento && (
                  <div className="flex flex-col gap-2">
                    <p className="text-body"><span className="text-[#666]">Mão de obra:</span> {formatarMoeda(orcamento.valor_mao_obra)}</p>
                    <p className="text-body"><span className="text-[#666]">Materiais:</span> {formatarMoeda(orcamento.valor_materiais)}</p>
                    <button
                      onClick={aceitarOrcamento}
                      disabled={aceitando}
                      className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
                    >
                      {aceitando ? 'Aceitando...' : 'Aceitar Orçamento'}
                    </button>
                  </div>
                )}
                {!carregandoOrcamento && !orcamento && <p className="text-body text-[#999]">Nenhum orçamento pendente encontrado.</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
