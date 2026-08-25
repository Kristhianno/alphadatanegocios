import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from './useAuth'
import { CLIENTES } from '../data/mock'

const ClientesContext = createContext(null)
const STORAGE_KEY_MOCK = 'alphadata_clientes'

// A API real chama o campo "documento" (CPF ou CNPJ); o formulário
// existente já usa "cnpj" — mapeado aqui pra não precisar tocar a
// página inteira só por causa do nome do campo.
function paraLocal(c) {
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone ?? '',
    email: c.email ?? '',
    endereco: c.endereco ?? '',
    cidade: c.cidade ?? '',
    estado: c.estado ?? '',
    cnpj: c.documento ?? '',
    ativo: c.ativo,
    // A API real ainda não tem o histórico de ordens de serviço (essa
    // parte do app continua com dados mockados, ver useOrdensServico) —
    // então esses dois campos não têm de onde vir de verdade ainda.
    totalOS: 0,
    ultimaOS: null,
  }
}

function paraApi(dadosLocais) {
  const dados = {}
  if (dadosLocais.nome !== undefined) dados.nome = dadosLocais.nome
  if (dadosLocais.telefone) dados.telefone = dadosLocais.telefone
  if (dadosLocais.email) dados.email = dadosLocais.email
  if (dadosLocais.endereco) dados.endereco = dadosLocais.endereco
  if (dadosLocais.cidade) dados.cidade = dadosLocais.cidade
  if (dadosLocais.estado) dados.estado = dadosLocais.estado
  if (dadosLocais.cnpj) dados.documento = dadosLocais.cnpj
  return dados
}

function carregarMockInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MOCK)
    if (raw) return JSON.parse(raw)
  } catch {
    /* recai para o mock */
  }
  return structuredClone(CLIENTES)
}

export function ClientesProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [clientes, setClientes] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  // Um login papel 'cliente' não tem acesso a /clientes (é dado de CRM
  // da equipe interna) — e é justamente o caso de uso do próprio perfil
  // do cliente (Cliente/Perfil.jsx via getById(user.clienteId)), que
  // nunca teve um endpoint real de auto-edição. Pra essa página continuar
  // funcionando pras contas demo, esse caso opera 100% sobre o dataset
  // mockado local (com persistência em localStorage, como sempre foi).
  const modoMock = user?.papel === 'cliente'

  useEffect(() => {
    if (!isAuthenticated) {
      setClientes([])
      return
    }
    if (modoMock) {
      setClientes(carregarMockInicial())
      return
    }
    let cancelado = false
    setCarregando(true)
    api
      .get('/clientes')
      .then((lista) => {
        if (!cancelado) setClientes(lista.map(paraLocal))
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
  }, [isAuthenticated, modoMock])

  useEffect(() => {
    if (modoMock) localStorage.setItem(STORAGE_KEY_MOCK, JSON.stringify(clientes))
  }, [modoMock, clientes])

  async function addCliente(dados) {
    if (modoMock) {
      const novo = { id: `CLI-${String(clientes.length + 1).padStart(2, '0')}`, ativo: true, totalOS: 0, ultimaOS: null, ...dados }
      setClientes((prev) => [novo, ...prev])
      return novo
    }
    const criado = await api.post('/clientes', paraApi(dados))
    const local = paraLocal(criado)
    setClientes((prev) => [local, ...prev])
    return local
  }

  async function updateCliente(id, patch) {
    if (modoMock) {
      let atualizado = null
      setClientes((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c
          atualizado = { ...c, ...patch }
          return atualizado
        })
      )
      return atualizado
    }
    const atualizado = await api.patch(`/clientes/${id}`, paraApi(patch))
    const local = paraLocal(atualizado)
    setClientes((prev) => prev.map((c) => (c.id === id ? local : c)))
    return local
  }

  // A API nunca apaga um cliente de verdade (soft-delete em todo o
  // sistema) — "deletar" aqui desativa, o que também é o que o botão
  // já mostra na coluna Status.
  async function deleteCliente(id) {
    if (modoMock) {
      await updateCliente(id, { ativo: false })
      return
    }
    const atualizado = await api.post(`/clientes/${id}/desativar`, {})
    const local = paraLocal(atualizado)
    setClientes((prev) => prev.map((c) => (c.id === id ? local : c)))
  }

  function getById(id) {
    return clientes.find((c) => c.id === id) ?? null
  }

  /** Gera o link de convite público — quem abre preenche o próprio cadastro e já recebe login + senha temporária. Só existe pra equipe interna. */
  async function gerarConviteCliente() {
    const { token } = await api.post('/convites/clientes/gerar', {})
    return `${window.location.origin}/cadastro-cliente/${token}`
  }

  return (
    <ClientesContext.Provider value={{ clientes, carregando, erro, addCliente, updateCliente, deleteCliente, getById, gerarConviteCliente }}>
      {children}
    </ClientesContext.Provider>
  )
}

export function useClientes() {
  const ctx = useContext(ClientesContext)
  if (!ctx) throw new Error('useClientes deve ser usado dentro de um ClientesProvider')
  return ctx
}
