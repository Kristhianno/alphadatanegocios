import { createContext, useContext, useEffect, useState } from 'react'
import { SESSOES_FOTOGRAFIA } from '../data/mock'

const STORAGE_KEY = 'alphadata_sessoes_fotografia'
const SessoesContext = createContext(null)

function loadInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* recai para o mock */
  }
  return structuredClone(SESSOES_FOTOGRAFIA)
}

function proximoId(sessoes) {
  const max = sessoes.reduce((acc, s) => {
    const n = Number(s.id.replace('SES-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `SES-${String(max + 1).padStart(3, '0')}`
}

export function SessoesFotografiaProvider({ children }) {
  const [sessoes, setSessoes] = useState(loadInicial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessoes))
  }, [sessoes])

  function addSessao(dados) {
    const novo = { id: proximoId(sessoes), status: 'Agendada', percentualEdicaoConcluida: 0, criadoEm: new Date().toISOString().slice(0, 10), ...dados }
    setSessoes((prev) => [novo, ...prev])
    return novo
  }

  function updateSessao(id, patch) {
    setSessoes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  function deleteSessao(id) {
    setSessoes((prev) => prev.filter((s) => s.id !== id))
  }

  function getById(id) {
    return sessoes.find((s) => s.id === id) ?? null
  }

  return (
    <SessoesContext.Provider value={{ sessoes, addSessao, updateSessao, deleteSessao, getById }}>
      {children}
    </SessoesContext.Provider>
  )
}

export function useSessoesFotografia() {
  const ctx = useContext(SessoesContext)
  if (!ctx) throw new Error('useSessoesFotografia deve ser usado dentro de um SessoesFotografiaProvider')
  return ctx
}
