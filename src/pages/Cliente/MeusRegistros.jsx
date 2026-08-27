import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
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

// Um único componente pros 3 verticais que têm um recurso próprio além
// de agendamentos: a forma (lista de cards com status) é a mesma, só o
// endpoint e as colunas mudam conforme o segmento da conta.
export const CONFIG_POR_VERTICAL = {
  confeitaria: {
    recurso: '/confeitaria/pedidos',
    titulo: 'Meus Pedidos',
    linhas: (p) => [
      { label: 'Pedido', valor: p.numero },
      { label: 'Entrega', valor: formatarData(p.dataEntrega) },
      { label: 'Valor', valor: formatarMoeda(p.valorTotal) },
    ],
  },
  salao_festas: {
    recurso: '/salao-festas/eventos',
    titulo: 'Meus Eventos',
    linhas: (e) => [
      { label: 'Evento', valor: e.nomeEvento },
      { label: 'Data', valor: formatarData(e.dataEvento) },
      { label: 'Valor', valor: formatarMoeda(e.valorTotal) },
    ],
  },
  fotografia_video: {
    recurso: '/fotografia/sessoes',
    titulo: 'Minhas Sessões',
    linhas: (s) => [
      { label: 'Tipo', valor: s.tipoSessao },
      { label: 'Data', valor: formatarData(s.dataSessao) },
      { label: 'Edição', valor: `${s.percentualEdicaoConcluida ?? 0}%` },
    ],
  },
}

export default function MeusRegistros() {
  const { user } = useAuth()
  const { nomeExibido } = useBranding()
  const [registros, setRegistros] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const config = CONFIG_POR_VERTICAL[user?.tipoNegocio]

  useEffect(() => {
    if (!config) {
      setCarregando(false)
      return
    }
    let cancelado = false
    api
      .get(config.recurso)
      .then((lista) => {
        if (!cancelado) setRegistros(lista)
      })
      .catch((e) => {
        if (!cancelado) setErro(e instanceof ApiError ? e.message : 'Falha ao carregar seus registros.')
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [config])

  if (!config) {
    return <p className="text-body text-[#999]">Este segmento não tem um módulo específico aqui.</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">{config.titulo} {nomeExibido}</h1>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {registros.map((r) => (
            <div key={r.id} className="bg-surface rounded-card shadow-card p-4 hover:shadow-cardHover transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <Badge status={r.status} />
              </div>
              {config.linhas(r).map((linha) => (
                <p key={linha.label} className="text-label text-[#666] mt-1">
                  <span className="text-[#999]">{linha.label}:</span> {linha.valor}
                </p>
              ))}
            </div>
          ))}
          {registros.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhum registro encontrado.</p>}
        </div>
      )}
    </div>
  )
}
