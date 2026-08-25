import { createContext, useContext, useEffect, useState } from 'react'
import { EVENTOS_SALAO } from '../data/mock'

const STORAGE_KEY = 'alphadata_eventos_salao'
const EventosContext = createContext(null)

function loadInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* recai para o mock */
  }
  return structuredClone(EVENTOS_SALAO)
}

function proximoId(eventos) {
  const max = eventos.reduce((acc, e) => {
    const n = Number(e.id.replace('EVT-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `EVT-${String(max + 1).padStart(3, '0')}`
}

export function EventosSalaoProvider({ children }) {
  const [eventos, setEventos] = useState(loadInicial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos))
  }, [eventos])

  function addEvento(dados) {
    const novo = { id: proximoId(eventos), status: 'Orçamento', checklist: [], criadoEm: new Date().toISOString().slice(0, 10), ...dados }
    setEventos((prev) => [novo, ...prev])
    return novo
  }

  function updateEvento(id, patch) {
    setEventos((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function deleteEvento(id) {
    setEventos((prev) => prev.filter((e) => e.id !== id))
  }

  function getById(id) {
    return eventos.find((e) => e.id === id) ?? null
  }

  return (
    <EventosContext.Provider value={{ eventos, addEvento, updateEvento, deleteEvento, getById }}>
      {children}
    </EventosContext.Provider>
  )
}

export function useEventosSalao() {
  const ctx = useContext(EventosContext)
  if (!ctx) throw new Error('useEventosSalao deve ser usado dentro de um EventosSalaoProvider')
  return ctx
}
