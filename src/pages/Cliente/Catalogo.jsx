import { useEffect, useState } from 'react'
import { useBranding } from '../../hooks/useBranding'
import { api, ApiError } from '../../services/api'

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Catalogo() {
  const { nomeExibido } = useBranding()
  const [servicos, setServicos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let cancelado = false
    api
      .get('/servicos?ativo=true')
      .then((lista) => {
        if (!cancelado) setServicos(lista)
      })
      .catch((e) => {
        if (!cancelado) setErro(e instanceof ApiError ? e.message : 'Falha ao carregar o catálogo.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Catálogo {nomeExibido}</h1>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servicos.map((s) => (
            <div key={s.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <p className="text-body font-semibold text-[#1a1a1a]">{s.nome}</p>
              {s.descricao && <p className="text-label text-[#666] mt-1">{s.descricao}</p>}
              <p className="text-body font-semibold text-primary mt-2">{formatarMoeda(s.precoBase)}</p>
            </div>
          ))}
          {servicos.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhum serviço disponível no momento.</p>}
        </div>
      )}
    </div>
  )
}
