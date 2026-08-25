import { useEffect, useState } from 'react'

// Estado local persistido em localStorage, sem Context — pras telas
// "de ponta" (Agendamentos, Estoque, Portfólio...) que ninguém mais no
// app precisa ler. Ordens de Serviço/Clientes/Pedidos/Eventos/Sessões
// continuam com Context próprio porque são referenciados de mais de um
// lugar (ex: Admin/Clientes.jsx lê o histórico de ordens do cliente).
export function usePersisted(storageKey, dadosIniciais) {
  const [dados, setDados] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) return JSON.parse(raw)
    } catch {
      /* recai pro dataset inicial */
    }
    return structuredClone(dadosIniciais)
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(dados))
  }, [storageKey, dados])

  return [dados, setDados]
}
