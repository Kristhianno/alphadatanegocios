import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from './useAuth'

const EquipeContext = createContext(null)

export function EquipeProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [equipe, setEquipe] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Só admin/gestor gerenciam equipe — o mesmo recorte de papel que a API já aplica em GET /equipe.
  const podeGerenciar = user?.papel === 'admin' || user?.papel === 'gestor'

  useEffect(() => {
    if (!isAuthenticated || !podeGerenciar) {
      setEquipe([])
      return
    }
    let cancelado = false
    setCarregando(true)
    api
      .get('/equipe')
      .then((lista) => {
        if (!cancelado) setEquipe(lista)
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })
    return () => {
      cancelado = true
    }
  }, [isAuthenticated, podeGerenciar])

  async function desativarMembro(id) {
    const atualizado = await api.post(`/equipe/${id}/desativar`, {})
    setEquipe((prev) => prev.map((m) => (m.id === id ? atualizado : m)))
    return atualizado
  }

  /** Gera o link de convite público pro papel escolhido — só admin pode (ver ConvitesService.criarConviteEquipe). */
  async function gerarConviteEquipe(papel) {
    const { token } = await api.post('/convites/equipe/gerar', { papel })
    return `${window.location.origin}/cadastro-equipe/${token}`
  }

  return (
    <EquipeContext.Provider value={{ equipe, carregando, erro, desativarMembro, gerarConviteEquipe }}>
      {children}
    </EquipeContext.Provider>
  )
}

export function useEquipe() {
  const ctx = useContext(EquipeContext)
  if (!ctx) throw new Error('useEquipe deve ser usado dentro de um EquipeProvider')
  return ctx
}
