import { useRef } from 'react'
import { IconCamera, IconTrash } from '@tabler/icons-react'

export default function CameraCapture({ titulo, fotos, onChange, max = 5, readOnly = false }) {
  const inputRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange([...fotos, reader.result])
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function remover(index) {
    onChange(fotos.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="text-body font-semibold text-[#333] mb-2">{titulo} ({fotos.length}/{max})</p>
      <div className="flex flex-wrap gap-3">
        {fotos.map((foto, index) => (
          <div key={index} className="relative w-28 h-28 rounded-card overflow-hidden border border-muted-dark group">
            <img src={foto} alt={`${titulo} ${index + 1}`} className="w-full h-full object-cover" />
            {!readOnly && (
              <button
                onClick={() => remover(index)}
                className="absolute top-1 right-1 bg-danger text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Deletar foto"
              >
                <IconTrash size={14} />
              </button>
            )}
          </div>
        ))}
        {!readOnly && fotos.length < max && (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-28 h-28 rounded-card border-2 border-dashed border-muted-dark flex flex-col items-center justify-center gap-1 text-[#999] hover:border-primary hover:text-primary transition-colors"
          >
            <IconCamera size={22} />
            <span className="text-label">Adicionar Foto</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
    </div>
  )
}
