import { api } from './api'
import { comprimirImagem } from '../utils/comprimirImagem'

const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Rótulos das categorias — espelha CATEGORIAS_ARQUIVO de server/src/config/armazenamento.config.ts. */
export const CATEGORIAS_ARQUIVO = [
  { id: 'catalogo', label: 'Portfólio', descricao: 'Fotos e PDFs de pacotes, kits e adicionais que a IA envia no WhatsApp (link público)', publico: true },
  { id: 'portfolio', label: 'Trabalhos realizados', descricao: 'Fotos de festas que você já fez (link público)', publico: true },
  { id: 'evento', label: 'Eventos', descricao: 'Fotos e vídeos de festas (privado)', publico: false },
  { id: 'contrato', label: 'Contratos', descricao: 'Contratos assinados (privado)', publico: false },
  { id: 'documento', label: 'Documentos', descricao: 'PDFs, planilhas e outros (privado)', publico: false },
  { id: 'outro', label: 'Outros', descricao: 'Privado', publico: false },
]

export const ACEITOS = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm,application/pdf,.doc,.docx,.xls,.xlsx'

export function formatarTamanho(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GB`
}

/** PUT direto pro Storage (URL assinada pelo backend), com progresso — fetch não informa progresso de upload. */
function enviarParaStorage(url, arquivo, onProgresso) {
  return new Promise((resolver, rejeitar) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('content-type', arquivo.type)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    if (SUPABASE_ANON_KEY) xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgresso?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolver() : rejeitar(new Error('Falha ao enviar o arquivo. Tente de novo.')))
    xhr.onerror = () => rejeitar(new Error('Falha de conexão ao enviar o arquivo.'))
    xhr.send(arquivo)
  })
}

/**
 * Envia um arquivo da conta logada: comprime fotos, pede a URL assinada
 * (o backend valida tipo, tamanho e cota), envia direto pro Storage e
 * confirma. Devolve o arquivo registrado, com `url`.
 */
export async function enviarArquivo(arquivoOriginal, { categoria, entidadeTipo, entidadeId } = {}, onProgresso) {
  const arquivo = await comprimirImagem(arquivoOriginal)
  const { caminho, urlUpload } = await api.post('/arquivos/upload-url', {
    nome: arquivoOriginal.name,
    tipoMime: arquivo.type,
    tamanhoBytes: arquivo.size,
    categoria,
  })
  await enviarParaStorage(urlUpload, arquivo, onProgresso)
  return api.post('/arquivos/confirmar', { caminho, nome: arquivoOriginal.name, categoria, entidadeTipo, entidadeId })
}
