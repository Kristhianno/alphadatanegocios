import { useEffect, useState } from 'react'
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

export default function Contratos() {
  const { nomeExibido } = useBranding()
  const { showToast } = useToast()
  const [contratos, setContratos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [assinandoId, setAssinandoId] = useState(null)

  function carregar() {
    setCarregando(true)
    api
      .get('/contratos')
      .then(setContratos)
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Falha ao carregar seus contratos.'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
  }, [])

  async function assinar(contrato) {
    setAssinandoId(contrato.id)
    try {
      await api.post(`/contratos/${contrato.id}/assinar`, {})
      showToast('Contrato assinado com sucesso!')
      carregar()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao assinar o contrato.', 'erro')
    } finally {
      setAssinandoId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Meus Contratos {nomeExibido}</h1>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contratos.map((c) => (
            <div key={c.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge status={c.status} />
              </div>
              <p className="text-body font-semibold text-[#1a1a1a]">{c.titulo}</p>
              <p className="text-label text-[#666] mt-1"><span className="text-[#999]">Valor:</span> {formatarMoeda(c.valorTotal)}</p>
              {c.assinadoEm && (
                <p className="text-label text-[#666] mt-1"><span className="text-[#999]">Assinado em:</span> {formatarData(c.assinadoEm)}</p>
              )}
              {c.status === 'enviado' && (
                <button
                  onClick={() => assinar(c)}
                  disabled={assinandoId === c.id}
                  className="mt-3 w-full rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {assinandoId === c.id ? 'Assinando...' : 'Assinar Contrato'}
                </button>
              )}
            </div>
          ))}
          {contratos.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhum contrato encontrado.</p>}
        </div>
      )}
    </div>
  )
}
