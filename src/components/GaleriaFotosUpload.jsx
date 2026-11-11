import { useRef, useState } from 'react'
import { IconCamera, IconLoader2, IconTrash } from '@tabler/icons-react'
import { ApiError } from '../services/api'
import { enviarArquivo } from '../services/arquivos'

/**
 * Fotos de um item (ex: pacote / kit) enviadas pra nuvem da conta
 * (categoria de Arquivos, link público por padrão em 'catalogo') — `fotos`
 * é uma lista de URLs. Substitui o antigo CameraCapture, que guardava a
 * imagem inteira (base64) dentro do navegador.
 */
export default function GaleriaFotosUpload({ titulo = 'Fotos', fotos, onChange, max = 6, categoria = 'catalogo' }) {
  const inputRef = useRef(null)
  const [enviando, setEnviando] = useState(0)
  const [erro, setErro] = useState('')

  async function selecionar(e) {
    const arquivos = [...(e.target.files ?? [])].slice(0, max - fotos.length)
    e.target.value = ''
    if (arquivos.length === 0) return
    setErro('')
    setEnviando(arquivos.length)
    let atuais = fotos
    for (const arquivo of arquivos) {
      try {
        const registrado = await enviarArquivo(arquivo, { categoria })
        atuais = [...atuais, registrado.url]
        onChange(atuais)
      } catch (falha) {
        setErro(falha instanceof ApiError ? falha.message : falha.message || 'Falha ao enviar a foto.')
      } finally {
        setEnviando((n) => n - 1)
      }
    }
  }

  return (
    <div>
      <p className="mb-2 text-body font-semibold text-[#333]">{titulo} ({fotos.length}/{max})</p>
      <div className="flex flex-wrap gap-3">
        {fotos.map((foto, indice) => (
          <div key={`${foto}-${indice}`} className="group relative h-28 w-28 overflow-hidden rounded-card border border-muted-dark">
            <img src={foto} alt={`${titulo} ${indice + 1}`} className="h-full w-full object-cover" />
            {indice === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">Principal</span>}
            <button
              type="button"
              onClick={() => onChange(fotos.filter((_, i) => i !== indice))}
              className="absolute right-1 top-1 rounded-full bg-danger p-1 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Remover foto"
            >
              <IconTrash size={14} />
            </button>
          </div>
        ))}
        {Array.from({ length: enviando }).map((_, i) => (
          <div key={`enviando-${i}`} className="flex h-28 w-28 items-center justify-center rounded-card border border-muted-dark bg-muted">
            <IconLoader2 size={22} className="animate-spin text-primary" />
          </div>
        ))}
        {fotos.length + enviando < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-muted-dark text-[#999] transition-colors hover:border-primary hover:text-primary"
          >
            <IconCamera size={22} />
            <span className="text-label">Adicionar foto</span>
          </button>
        )}
      </div>
      {erro && <p role="alert" className="mt-2 text-label text-danger">{erro}</p>}
      <p className="mt-1.5 text-[11px] text-[#999]">A primeira foto é a principal. As fotos ficam salvas em Arquivos.</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={selecionar} />
    </div>
  )
}
