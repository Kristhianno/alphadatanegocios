// Cliente HTTP pro backend ServiceHub real (server/). Só auth, clientes
// e o fluxo de convite falam com essa API — o resto do app (ordens de
// serviço, prestadores) continua com dados mockados locais de propósito.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
const TOKEN_KEY = 'alphadata_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(mensagem, codigo, statusCode, detalhes) {
    super(mensagem)
    this.name = 'ApiError'
    this.codigo = codigo
    this.statusCode = statusCode
    this.detalhes = detalhes
  }
}

async function requisicao(caminho, { method = 'GET', body, comAuth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (comAuth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let resp
  try {
    resp = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão.', 'REDE', 0)
  }

  if (resp.status === 204) return null
  const dados = await resp.json().catch(() => null)

  if (!resp.ok) {
    const erro = dados?.erro
    throw new ApiError(erro?.mensagem ?? 'Erro inesperado.', erro?.codigo ?? 'DESCONHECIDO', resp.status, erro?.detalhes)
  }
  return dados
}

export const api = {
  get: (caminho, opcoes) => requisicao(caminho, { ...opcoes, method: 'GET' }),
  post: (caminho, body, opcoes) => requisicao(caminho, { ...opcoes, method: 'POST', body }),
  patch: (caminho, body, opcoes) => requisicao(caminho, { ...opcoes, method: 'PATCH', body }),
  delete: (caminho, opcoes) => requisicao(caminho, { ...opcoes, method: 'DELETE' }),
}
