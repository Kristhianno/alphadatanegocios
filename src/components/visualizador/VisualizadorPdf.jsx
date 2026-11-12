import { useEffect, useRef, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import urlWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

/**
 * Leitor de PDF dentro do sistema (pdf.js). <iframe> com PDF não funciona no
 * celular (Android baixa o arquivo, iPhone mostra só a 1ª página) — aqui as
 * páginas são desenhadas em <canvas> em qualquer aparelho. O pdf.js só é
 * baixado quando alguém abre um PDF (import dinâmico).
 *
 * Páginas são desenhadas sob demanda (quando chegam perto da área visível),
 * na largura do contêiner × zoom, em alta resolução (devicePixelRatio).
 */

let pdfjsPromessa = null
function carregarPdfjs() {
  pdfjsPromessa ??= import('pdfjs-dist').then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = urlWorker
    return pdfjs
  })
  return pdfjsPromessa
}

function PaginaPdf({ documento, numero, largura, proporcao, raiz, onVisivel }) {
  const canvasRef = useRef(null)
  const caixaRef = useRef(null)
  const [visivel, setVisivel] = useState(numero === 1)
  const [desenhada, setDesenhada] = useState(false)

  useEffect(() => {
    const caixa = caixaRef.current
    if (!caixa) return
    const perto = new IntersectionObserver(([e]) => e.isIntersecting && setVisivel(true), { root: raiz, rootMargin: '800px 0px' })
    const atual = new IntersectionObserver(([e]) => e.isIntersecting && onVisivel(numero), { root: raiz, threshold: 0.5 })
    perto.observe(caixa)
    atual.observe(caixa)
    return () => {
      perto.disconnect()
      atual.disconnect()
    }
  }, [raiz, numero, onVisivel])

  useEffect(() => {
    if (!visivel || !largura) return
    let tarefa = null
    let cancelado = false
    ;(async () => {
      const pagina = await documento.getPage(numero)
      if (cancelado) return
      const base = pagina.getViewport({ scale: 1 })
      const escala = largura / base.width
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const viewport = pagina.getViewport({ scale: escala * dpr })
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(largura)}px`
      canvas.style.height = `${Math.floor(largura * (base.height / base.width))}px`
      tarefa = pagina.render({ canvasContext: canvas.getContext('2d'), canvas, viewport })
      await tarefa.promise.catch(() => {})
      if (!cancelado) setDesenhada(true)
    })()
    return () => {
      cancelado = true
      tarefa?.cancel()
    }
  }, [visivel, largura, documento, numero])

  return (
    <div
      ref={caixaRef}
      className="relative mx-auto bg-white shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
      style={{ width: largura, minHeight: desenhada ? undefined : largura * proporcao }}
      aria-label={`Página ${numero}`}
    >
      <canvas ref={canvasRef} className="block" />
      {!desenhada && (
        <div className="absolute inset-0 flex items-center justify-center text-[#bbb]">
          <IconLoader2 size={26} className="animate-spin" />
        </div>
      )}
    </div>
  )
}

/** `zoom` 1 = largura do contêiner; onInfo({ paginas, atual }) informa o leitor. */
export default function VisualizadorPdf({ url, zoom = 1, onInfo, onErro }) {
  const contRef = useRef(null)
  const [documento, setDocumento] = useState(null)
  const [proporcao, setProporcao] = useState(1.414)
  const [larguraDisponivel, setLarguraDisponivel] = useState(0)
  const [atual, setAtual] = useState(1)
  // Callbacks em ref: trocar a função (re-render do pai) não pode recarregar o PDF.
  const onErroRef = useRef(onErro)
  const onInfoRef = useRef(onInfo)
  useEffect(() => {
    onErroRef.current = onErro
    onInfoRef.current = onInfo
  })

  useEffect(() => {
    let cancelado = false
    let carregamento = null
    setDocumento(null)
    carregarPdfjs()
      .then(async (pdfjs) => {
        carregamento = pdfjs.getDocument({ url })
        const doc = await carregamento.promise
        const primeira = await doc.getPage(1)
        const v = primeira.getViewport({ scale: 1 })
        if (cancelado) return doc.destroy()
        setProporcao(v.height / v.width)
        setDocumento(doc)
      })
      .catch(() => !cancelado && onErroRef.current?.())
    return () => {
      cancelado = true
      carregamento?.destroy()
    }
  }, [url])

  useEffect(() => {
    const el = contRef.current
    if (!el) return
    const obs = new ResizeObserver(([e]) => setLarguraDisponivel(e.contentRect.width))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (documento) onInfoRef.current?.({ paginas: documento.numPages, atual })
  }, [documento, atual])

  // Página "cheia" no celular; no computador, no máximo ~ largura de leitura confortável.
  const largura = Math.max(200, Math.min(larguraDisponivel - 16, 900) * zoom)

  return (
    <div ref={contRef} className="h-full w-full overflow-auto overscroll-contain px-2 py-4 sm:px-6 sm:py-6">
      {!documento ? (
        <div className="flex h-full items-center justify-center text-white/70">
          <IconLoader2 size={32} className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4" style={{ minWidth: largura }}>
          {Array.from({ length: documento.numPages }, (_, i) => (
            <PaginaPdf
              key={i + 1}
              documento={documento}
              numero={i + 1}
              largura={largura}
              proporcao={proporcao}
              raiz={contRef.current}
              onVisivel={setAtual}
            />
          ))}
        </div>
      )}
    </div>
  )
}
