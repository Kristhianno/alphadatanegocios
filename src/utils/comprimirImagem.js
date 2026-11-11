/**
 * Reduz fotos antes do upload (o plano grátis do Supabase não redimensiona
 * no servidor): no máximo 1600px no lado maior, JPEG 82%. Uma foto de
 * celular de 4MB vira ~300KB — envia rápido, chega rápido no WhatsApp e
 * economiza a cota da conta. GIF (animação) e arquivos já pequenos passam direto.
 */
const LADO_MAXIMO = 1600
const QUALIDADE = 0.82
const JA_PEQUENO_BYTES = 400 * 1024

export async function comprimirImagem(arquivo) {
  if (!arquivo.type.startsWith('image/') || arquivo.type === 'image/gif') return arquivo

  let bitmap
  try {
    bitmap = await createImageBitmap(arquivo)
  } catch {
    return arquivo // formato que o navegador não decodifica (ex: HEIC) — o backend decide se aceita
  }
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
  if (escala === 1 && arquivo.size <= JA_PEQUENO_BYTES) {
    bitmap.close?.()
    return arquivo
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * escala)
  canvas.height = Math.round(bitmap.height * escala)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // PNG com transparência vira fundo branco no JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  const blob = await new Promise((resolver) => canvas.toBlob(resolver, 'image/jpeg', QUALIDADE))
  if (!blob || blob.size >= arquivo.size) return arquivo
  const nome = arquivo.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], nome, { type: 'image/jpeg', lastModified: Date.now() })
}
