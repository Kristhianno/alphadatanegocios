import { createContext, useContext, useEffect, useState } from 'react'
import { USUARIOS_DEMO } from '../data/mock'

const AUTH_KEY = 'alphadata_auth'
const AuthContext = createContext(null)

function readStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredAuth)

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === AUTH_KEY) setUser(readStoredAuth())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function login(userType, email, senha) {
    const demo = USUARIOS_DEMO[userType]
    if (!demo || demo.email !== email || demo.senha !== senha) {
      return { ok: false, error: 'Email ou senha inválidos para o tipo de usuário selecionado.' }
    }
    const sessao = {
      userType: demo.userType,
      email: demo.email,
      nome: demo.nome,
      papel: demo.papel,
      tecnicoId: demo.tecnicoId ?? null,
      clienteId: demo.clienteId ?? null,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(sessao))
    setUser(sessao)
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  return ctx
}
