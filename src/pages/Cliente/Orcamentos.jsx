import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import Badge from '../../components/ui/Badge'

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR')
}

export default function Orcamentos() {
  const { user } = useAuth()
  const { nomeExibido } = useBranding()
  const { showToast } = useToast()
  const ehManutencao = user?.tipoNegocio === 'manutencao'

  const [orcamentos, setOrcamentos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [processandoId, setProcessandoId] = useState(null)

  function carregar() {
    setCarregando(true)
    const rota = ehManutencao ? '/manutencao/orcamentos' : '/salao-festas/eventos?status=orcamento'
    api
      .get(rota)
      .then(setOrcamentos)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Falha ao carregar seus orçamentos.'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
  }, [ehManutencao])

  async function confirmar(item) {
    setProcessandoId(item.id)
    try {
      if (ehManutencao) {
        await api.post(`/manutencao/chamados/${item.chamados_manutencao.id}/orcamento/aceitar`, {})
      } else {
        await api.post(`/salao-festas/eventos/${item.id}/confirmar-orcamento`, {})
      }
      showToast('Orçamento confirmado com sucesso!')
      carregar()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao confirmar o orçamento.', 'erro')
    } finally {
      setProcessandoId(null)
    }
  }

  const podeConfirmar = (item) => (ehManutencao ? item.status === 'pendente' : item.status === 'orcamento')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Meus Orçamentos {nomeExibido}</h1>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orcamentos.map((o) => (
            <div key={o.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge status={o.status} />
              </div>

              {ehManutencao ? (
                <>
                  <p className="text-body font-semibold text-[#1a1a1a] capitalize">{o.chamados_manutencao?.categoria_manutencao}</p>
                  <p className="text-label text-[#666] mt-1">{o.chamados_manutencao?.descricao}</p>
                  <p className="text-label text-[#666] mt-1"><span className="text-[#999]">Mão de obra:</span> {formatarMoeda(o.valor_mao_obra)}</p>
                  <p className="text-label text-[#666] mt-1"><span className="text-[#999]">Materiais:</span> {formatarMoeda(o.valor_materiais)}</p>
                  <p className="text-body font-semibold text-[#1a1a1a] mt-2">Total: {formatarMoeda(o.valor_total)}</p>
                </>
              ) : (
                <>
                  <p className="text-body font-semibold text-[#1a1a1a]">{o.nomeEvento}</p>
                  <p className="text-label text-[#666] mt-1"><span className="text-[#999]">Data do evento:</span> {formatarData(o.dataEvento)}</p>
                  <p className="text-body font-semibold text-[#1a1a1a] mt-2">Total: {formatarMoeda(o.valorTotal)}</p>
                </>
              )}

              {podeConfirmar(o) && (
                <button
                  onClick={() => confirmar(o)}
                  disabled={processandoId === o.id}
                  className="mt-3 w-full rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {processandoId === o.id ? 'Confirmando...' : ehManutencao ? 'Aceitar Orçamento' : 'Confirmar Orçamento'}
                </button>
              )}
            </div>
          ))}
          {orcamentos.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhum orçamento encontrado.</p>}
        </div>
      )}
    </div>
  )
}
