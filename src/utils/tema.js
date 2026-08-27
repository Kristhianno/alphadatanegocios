// Cor primária personalizável (Admin > Configurações). O valor mora no
// mesmo localStorage que o resto da config (não é por conta ainda, é por
// navegador). As variáveis --color-primary-* aqui definidas são o que o
// tailwind.config.js usa como valor de primary/primary-light/primary-dark,
// então mudar essas 3 custom properties já reflete em todo bg-primary,
// text-primary etc. sem precisar recompilar CSS nenhum.
export const CHAVE_CONFIG = 'alphadata_config'
export const COR_PRIMARIA_PADRAO = '#0066CC'

function misturarCor(hex, alvo, quantidade) {
  const c = parseInt(hex.slice(1), 16)
  const r = (c >> 16) & 255
  const g = (c >> 8) & 255
  const b = c & 255
  const t = alvo === 'branco' ? 255 : 0
  const canal = (v) => Math.round(v + (t - v) * quantidade).toString(16).padStart(2, '0')
  return `#${canal(r)}${canal(g)}${canal(b)}`
}

export function aplicarCorPrimaria(hex) {
  const raiz = document.documentElement.style
  raiz.setProperty('--color-primary', hex)
  raiz.setProperty('--color-primary-light', misturarCor(hex, 'branco', 0.9))
  raiz.setProperty('--color-primary-dark', misturarCor(hex, 'preto', 0.25))
}

/** Volta pro azul padrão da marca — usado fora da área logada (login, cadastro, demo, etc). */
export function resetarCorPrimaria() {
  const raiz = document.documentElement.style
  raiz.removeProperty('--color-primary')
  raiz.removeProperty('--color-primary-light')
  raiz.removeProperty('--color-primary-dark')
}

export function lerCorPrimariaSalva() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_CONFIG))?.corPrimaria || null
  } catch {
    return null
  }
}
