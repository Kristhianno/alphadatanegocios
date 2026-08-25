import { createContext, useContext, useEffect, useState } from 'react'
import { PEDIDOS_CONFEITARIA } from '../data/mock'

const STORAGE_KEY = 'alphadata_pedidos_confeitaria'
const PedidosContext = createContext(null)

function loadInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* recai para o mock */
  }
  return structuredClone(PEDIDOS_CONFEITARIA)
}

function proximoId(pedidos) {
  const max = pedidos.reduce((acc, p) => {
    const n = Number(p.id.replace('PED-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `PED-${String(max + 1).padStart(3, '0')}`
}

export function PedidosConfeitariaProvider({ children }) {
  const [pedidos, setPedidos] = useState(loadInicial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos))
  }, [pedidos])

  function addPedido(dados) {
    const valorTotal = (dados.itens ?? []).reduce((soma, it) => soma + it.quantidade * it.precoUnitario, 0)
    const novo = { id: proximoId(pedidos), status: 'Novo', valorTotal, criadoEm: new Date().toISOString().slice(0, 10), ...dados }
    setPedidos((prev) => [novo, ...prev])
    return novo
  }

  function updatePedido(id, patch) {
    setPedidos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function deletePedido(id) {
    setPedidos((prev) => prev.filter((p) => p.id !== id))
  }

  function getById(id) {
    return pedidos.find((p) => p.id === id) ?? null
  }

  return (
    <PedidosContext.Provider value={{ pedidos, addPedido, updatePedido, deletePedido, getById }}>
      {children}
    </PedidosContext.Provider>
  )
}

export function usePedidosConfeitaria() {
  const ctx = useContext(PedidosContext)
  if (!ctx) throw new Error('usePedidosConfeitaria deve ser usado dentro de um PedidosConfeitariaProvider')
  return ctx
}
