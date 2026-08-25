import { useEffect, useRef, useState } from 'react'
import { IconEraser, IconDeviceFloppy } from '@tabler/icons-react'

export default function Assinatura({ clienteNome, valorSalvo, onSave, readOnly = false }) {
  const canvasRef = useRef(null)
  const desenhando = useRef(false)
  const [vazio, setVazio] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
  }, [])

  function posicao(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const ponto = e.touches ? e.touches[0] : e
    return {
      x: ((ponto.clientX - rect.left) / rect.width) * canvas.width,
      y: ((ponto.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  function iniciar(e) {
    if (readOnly) return
    desenhando.current = true
    const { x, y } = posicao(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function mover(e) {
    if (!desenhando.current || readOnly) return
    e.preventDefault()
    const { x, y } = posicao(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    setVazio(false)
  }

  function parar() {
    desenhando.current = false
  }

  function limpar() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setVazio(true)
  }

  function salvar() {
    if (vazio) return
    onSave(canvasRef.current.toDataURL('image/png'))
  }

  if (readOnly) {
    return (
      <div>
        <p className="text-label text-[#666] mb-2">Assinatura de {clienteNome}</p>
        {valorSalvo ? (
          <img src={valorSalvo} alt="Assinatura do cliente" className="border border-muted-dark rounded-card bg-white max-w-[600px] w-full" />
        ) : (
          <p className="text-body text-[#999] italic">Nenhuma assinatura registrada.</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-label text-[#666] mb-2">Assinatura de {clienteNome}</p>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="signature-canvas border border-muted-dark rounded-card bg-white max-w-full w-[600px] h-[300px] touch-none cursor-crosshair"
        onMouseDown={iniciar}
        onMouseMove={mover}
        onMouseUp={parar}
        onMouseLeave={parar}
        onTouchStart={iniciar}
        onTouchMove={mover}
        onTouchEnd={parar}
      />
      <div className="flex gap-3 mt-3">
        <button onClick={limpar} className="flex items-center gap-1.5 rounded-btn px-3 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          <IconEraser size={18} /> Limpar Assinatura
        </button>
        <button onClick={salvar} className="flex items-center gap-1.5 rounded-btn px-3 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
          <IconDeviceFloppy size={18} /> Salvar Assinatura
        </button>
      </div>
      {valorSalvo && (
        <div className="mt-3">
          <p className="text-label text-[#999] mb-1">Assinatura salva:</p>
          <img src={valorSalvo} alt="Assinatura salva" className="border border-muted-dark rounded-card bg-white w-40" />
        </div>
      )}
    </div>
  )
}
