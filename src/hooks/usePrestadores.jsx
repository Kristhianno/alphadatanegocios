import { createContext, useContext, useEffect, useState } from 'react'
import { PRESTADORES } from '../data/mock'

const STORAGE_KEY = 'alphadata_prestadores'
const PrestadoresContext = createContext(null)

function loadInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* recai para o mock */
  }
  return structuredClone(PRESTADORES)
}

function proximoId(prestadores) {
  const max = prestadores.reduce((acc, p) => {
    const n = Number(p.id.replace('TEC-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `TEC-${String(max + 1).padStart(2, '0')}`
}

export function PrestadoresProvider({ children }) {
  const [prestadores, setPrestadores] = useState(loadInicial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prestadores))
  }, [prestadores])

  function addPrestador(dados) {
    const novo = { id: proximoId(prestadores), ativo: true, totalOS: 0, avaliacao: 5, ...dados }
    setPrestadores((prev) => [novo, ...prev])
    return novo
  }

  function updatePrestador(id, patch) {
    setPrestadores((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function deletePrestador(id) {
    setPrestadores((prev) => prev.filter((p) => p.id !== id))
  }

  function getById(id) {
    return prestadores.find((p) => p.id === id) ?? null
  }

  return (
    <PrestadoresContext.Provider value={{ prestadores, addPrestador, updatePrestador, deletePrestador, getById }}>
      {children}
    </PrestadoresContext.Provider>
  )
}

export function usePrestadores() {
  const ctx = useContext(PrestadoresContext)
  if (!ctx) throw new Error('usePrestadores deve ser usado dentro de um PrestadoresProvider')
  return ctx
}
