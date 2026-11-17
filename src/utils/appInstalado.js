/**
 * App instalável (PWA). Quando o sistema é aberto pelo ícone instalado
 * (PC ou celular), ele roda em modo "standalone" e não deve mostrar o
 * site/landing — abre direto no login (ou no painel, se já houver sessão).
 */

export function rodandoComoApp() {
  if (typeof window === 'undefined') return false
  const modo = (m) => window.matchMedia?.(`(display-mode: ${m})`).matches
  return modo('standalone') || modo('fullscreen') || modo('minimal-ui') || window.navigator.standalone === true
}

export function ehIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  // iPadOS se apresenta como Mac, mas tem tela touch.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
}

// O navegador dispara `beforeinstallprompt` logo no carregamento, antes
// de qualquer tela montar — por isso a captura fica aqui, no nível do módulo.
let promptGuardado = null
const ouvintes = new Set()
const avisar = () => ouvintes.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    promptGuardado = e
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    promptGuardado = null
    avisar()
  })
}

export function podeInstalarDireto() {
  return promptGuardado !== null
}

export function ouvirInstalacao(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

/** Abre a janela nativa de instalação (Chrome/Edge/Android). Retorna true se o usuário aceitou. */
export async function abrirInstalacao() {
  if (!promptGuardado) return false
  const evento = promptGuardado
  promptGuardado = null
  evento.prompt()
  const { outcome } = await evento.userChoice
  avisar()
  return outcome === 'accepted'
}

export function registrarServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
