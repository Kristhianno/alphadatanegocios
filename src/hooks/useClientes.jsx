import { createContext, useContext, useEffect, useState } from 'react'
import { CLIENTES } from '../data/mock'

const STORAGE_KEY = 'alphadata_clientes'
const ClientesContext = createContext(null)

function loadInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* recai para o mock */
  }
  return structuredClone(CLIENTES)
}

function proximoId(clientes) {
  const max = clientes.reduce((acc, c) => {
    const n = Number(c.id.replace('CLI-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `CLI-${String(max + 1).padStart(2, '0')}`
}

export function ClientesProvider({ children }) {
  const [clientes, setClientes] = useState(loadInicial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes))
  }, [clientes])

  function addCliente(dados) {
    const novo = { id: proximoId(clientes), ativo: true, totalOS: 0, ultimaOS: null, ...dados }
    setClientes((prev) => [novo, ...prev])
    return novo
  }

  function updateCliente(id, patch) {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  function deleteCliente(id) {
    setClientes((prev) => prev.filter((c) => c.id !== id))
  }

  function getById(id) {
    return clientes.find((c) => c.id === id) ?? null
  }

  return (
    <ClientesContext.Provider value={{ clientes, addCliente, updateCliente, deleteCliente, getById }}>
      {children}
    </ClientesContext.Provider>
  )
}

export function useClientes() {
  const ctx = useContext(ClientesContext)
  if (!ctx) throw new Error('useClientes deve ser usado dentro de um ClientesProvider')
  return ctx
}
