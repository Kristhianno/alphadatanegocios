/**
 * Prepara o logotipo da empresa para salvar na conta: reduz para no máximo
 * 512px no maior lado e converte para WebP (mantém fundo transparente).
 * Assim qualquer foto ou arte serve, e o arquivo final fica pequeno (o
 * backend aceita até ~260KB, guardado como data URL na conta).
 */
const LADO_MAXIMO = 512
const LIMITE_FINAL_BYTES = 250 * 1024
export const TAMANHO_MAX_ORIGINAL_BYTES = 15 * 1024 * 1024

function carregarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler essa imagem. Tente PNG, JPG ou WebP.'))
    }
    img.src = url
  })
}

function tamanhoDataUrl(dataUrl) {
  return Math.ceil(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4)
}

export async function prepararLogo(arquivo) {
  if (!arquivo.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem (PNG, JPG, WebP ou SVG).')
  if (arquivo.size > TAMANHO_MAX_ORIGINAL_BYTES) throw new Error('Imagem muito grande. Escolha um arquivo de até 15MB.')

  const img = await carregarImagem(arquivo)
  const larguraOriginal = img.naturalWidth || LADO_MAXIMO
  const alturaOriginal = img.naturalHeight || LADO_MAXIMO

  for (const lado of [LADO_MAXIMO, 384, 256]) {
    const escala = Math.min(1, lado / Math.max(larguraOriginal, alturaOriginal))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(larguraOriginal * escala))
    canvas.height = Math.max(1, Math.round(alturaOriginal * escala))
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    let dataUrl = canvas.toDataURL('image/webp', 0.9)
    // Navegador sem WebP devolve PNG: tudo bem, só confere o tamanho.
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/png')
    if (tamanhoDataUrl(dataUrl) <= LIMITE_FINAL_BYTES) return dataUrl
  }
  throw new Error('Não foi possível reduzir essa imagem. Tente outro arquivo.')
}
