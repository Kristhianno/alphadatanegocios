import { createContext, useContext, useEffect, useState } from 'react'
import { ORDENS_SERVICO, STATUS_OS, CHECKLIST_TEMPLATES, CONSENTIMENTO_ITENS, TIPOS_SERVICO } from '../data/mock'

const STORAGE_KEY = 'alphadata_ordens'
const OrdensContext = createContext(null)

function loadInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* localStorage indisponível ou dado corrompido: recai para o mock */
  }
  return structuredClone(ORDENS_SERVICO)
}

function proximoId(ordens) {
  const max = ordens.reduce((acc, o) => {
    const n = Number(o.id.replace('OS-', ''))
    return Number.isFinite(n) && n > acc ? n : acc
  }, 0)
  return `OS-${String(max + 1).padStart(3, '0')}`
}

export function OrdensProvider({ children }) {
  const [ordens, setOrdens] = useState(loadInicial)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordens))
  }, [ordens])

  function addOrdem(dados) {
    const tipo = TIPOS_SERVICO.find((t) => t.id === dados.tipoServicoId)
    const novaOrdem = {
      id: proximoId(ordens),
      status: 'Agendada',
      checklist: CHECKLIST_TEMPLATES[tipo?.categoria ?? 'geral'].map((label, idx) => ({
        id: idx,
        label,
        concluido: false,
        observacao: '',
      })),
      fotos: { antes: [], durante: [], depois: [] },
      assinatura: null,
      consentimento: CONSENTIMENTO_ITENS.map(() => false),
      avaliacao: null,
      criadaEm: new Date().toISOString().slice(0, 10),
      canceladaMotivo: null,
      categoria: tipo?.categoria ?? 'geral',
      tipoServico: tipo?.nome ?? dados.tipoServico,
      ...dados,
    }
    setOrdens((prev) => [novaOrdem, ...prev])
    return novaOrdem
  }

  function updateOrdem(id, patch) {
    setOrdens((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  function updateStatus(id, status) {
    if (!STATUS_OS.includes(status)) return
    updateOrdem(id, { status })
  }

  function deleteOrdem(id) {
    setOrdens((prev) => prev.filter((o) => o.id !== id))
  }

  function getById(id) {
    return ordens.find((o) => o.id === id) ?? null
  }

  return (
    <OrdensContext.Provider value={{ ordens, addOrdem, updateOrdem, updateStatus, deleteOrdem, getById }}>
      {children}
    </OrdensContext.Provider>
  )
}

export function useOrdensServico() {
  const ctx = useContext(OrdensContext)
  if (!ctx) throw new Error('useOrdensServico deve ser usado dentro de um OrdensProvider')
  return ctx
}
