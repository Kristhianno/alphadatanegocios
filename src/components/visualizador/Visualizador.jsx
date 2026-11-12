import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  IconArrowsDiagonal, IconChevronLeft, IconChevronRight, IconDownload, IconFile, IconFileTypePdf, IconLoader2, IconPhoto,
  IconPlayerPlayFilled, IconX, IconZoomIn, IconZoomOut,
} from '@tabler/icons-react'
import { formatarTamanho } from '../../services/arquivos'

const VisualizadorPdf = lazy(() => import('./VisualizadorPdf'))

/**
 * Visualizador de arquivos dentro do sistema (fotos, vídeos e PDFs) — nada
 * abre em outra aba. Uso:
 *   const abrir = useVisualizador()
 *   abrir(listaDeArquivos, indice)   // arquivo = { url, nomeOriginal, tipo, tipoMime, tamanhoBytes }
 * Teclado: ← → navegam, Esc fecha, + − dão zoom no PDF. No celular, deslizar
 * o dedo troca de arquivo (fotos e vídeos).
 */

const ContextoVisualizador = createContext(() => {})

export function useVisualizador() {
  return useContext(ContextoVisualizador)
}

export function VisualizadorProvider({ children }) {
  const [estado, setEstado] = useState(null)
  const abrir = useCallback((arquivos, indice = 0) => {
    const lista = (Array.isArray(arquivos) ? arquivos : [arquivos]).filter((a) => a?.url)
    if (lista.length) setEstado({ lista, indice: Math.min(Math.max(indice, 0), lista.length - 1) })
  }, [])
  return (
    <ContextoVisualizador.Provider value={abrir}>
      {children}
      {estado && <Visualizador lista={estado.lista} indiceInicial={estado.indice} onFechar={() => setEstado(null)} />}
    </ContextoVisualizador.Provider>
  )
}

function tipoDe(arquivo) {
  if (arquivo.tipo === 'imagem' || arquivo.tipoMime?.startsWith('image/')) return 'imagem'
  if (arquivo.tipo === 'video' || arquivo.tipoMime?.startsWith('video/')) return 'video'
  if (arquivo.tipoMime === 'application/pdf' || /\.pdf$/i.test(arquivo.nomeOriginal ?? '')) return 'pdf'
  return 'outro'
}

/** Download direto (sem abrir aba): o Storage do Supabase responde como anexo com ?download=. */
function urlDownload(arquivo) {
  const nome = encodeURIComponent(arquivo.nomeOriginal || 'arquivo')
  return `${arquivo.url}${arquivo.url.includes('?') ? '&' : '?'}download=${nome}`
}

const ROTULO_TIPO = { imagem: 'Foto', video: 'Vídeo', pdf: 'PDF', outro: 'Arquivo' }
const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]

function BotaoBarra({ onClick, rotulo, children, href, download }) {
  const classe = 'flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-btn px-2.5 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70'
  if (href) {
    return (
      <a href={href} download={download} aria-label={rotulo} title={rotulo} className={classe}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={rotulo} title={rotulo} className={classe}>
      {children}
    </button>
  )
}

function Imagem({ arquivo }) {
  const [carregada, setCarregada] = useState(false)
  const [erro, setErro] = useState(false)
  const [ampliada, setAmpliada] = useState(false)
  useEffect(() => {
    setCarregada(false)
    setErro(false)
    setAmpliada(false)
  }, [arquivo.url])

  if (erro) return <SemPrevia arquivo={arquivo} mensagem="Não foi possível carregar esta foto." />
  return (
    <div className={`h-full w-full ${ampliada ? 'overflow-auto' : 'flex items-center justify-center overflow-hidden p-2 sm:p-6'}`}>
      {!carregada && (
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          <IconLoader2 size={32} className="animate-spin" />
        </div>
      )}
      <img
        src={arquivo.url}
        alt={arquivo.nomeOriginal}
        draggable={false}
        onLoad={() => setCarregada(true)}
        onError={() => setErro(true)}
        onClick={() => setAmpliada((v) => !v)}
        className={`select-none transition-opacity duration-200 ${carregada ? 'opacity-100' : 'opacity-0'} ${
          ampliada ? 'max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in object-contain rounded-sm shadow-[0_8px_40px_rgba(0,0,0,0.5)]'
        }`}
      />
    </div>
  )
}

function SemPrevia({ arquivo, mensagem }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-card bg-white p-6 text-center shadow-cardHover">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-card bg-muted text-[#888]">
          <IconFile size={30} stroke={1.5} />
        </span>
        <p className="break-words text-body font-semibold text-[#1a1a1a]">{arquivo.nomeOriginal}</p>
        <p className="mt-1 text-label text-[#888]">{mensagem}</p>
        <a
          href={urlDownload(arquivo)}
          download={arquivo.nomeOriginal}
          className="mt-5 inline-flex items-center gap-2 rounded-btn bg-primary px-4 py-2.5 text-body font-semibold text-white hover:bg-primary-dark"
        >
          <IconDownload size={18} /> Baixar arquivo
        </a>
      </div>
    </div>
  )
}

function Miniatura({ arquivo, ativo, onClick }) {
  const tipo = tipoDe(arquivo)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={arquivo.nomeOriginal}
      aria-current={ativo || undefined}
      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-btn transition-all ${
        ativo ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-90'
      }`}
    >
      {tipo === 'imagem' ? (
        <img src={arquivo.url} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-white/10 text-white">
          {tipo === 'pdf' ? <IconFileTypePdf size={22} /> : tipo === 'video' ? <IconPlayerPlayFilled size={18} /> : <IconFile size={22} />}
        </span>
      )}
    </button>
  )
}

function Visualizador({ lista, indiceInicial, onFechar }) {
  const [indice, setIndice] = useState(indiceInicial)
  const [zoom, setZoom] = useState(1)
  const [infoPdf, setInfoPdf] = useState(null)
  const [erroPdf, setErroPdf] = useState(false)
  const fecharRef = useRef(null)
  const toque = useRef(null)

  const arquivo = lista[indice]
  const tipo = tipoDe(arquivo)
  const varios = lista.length > 1

  const irPara = useCallback(
    (novo) => {
      if (!varios) return
      setIndice((novo + lista.length) % lista.length)
    },
    [varios, lista.length],
  )

  useEffect(() => {
    setZoom(1)
    setInfoPdf(null)
    setErroPdf(false)
  }, [indice])

  // Trava a rolagem da página, foca o "fechar" e devolve o foco ao sair.
  useEffect(() => {
    const anterior = document.activeElement
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    fecharRef.current?.focus()
    return () => {
      document.body.style.overflow = overflow
      anterior?.focus?.()
    }
  }, [])

  useEffect(() => {
    function aoTeclar(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onFechar()
      } else if (e.key === 'ArrowRight') irPara(indice + 1)
      else if (e.key === 'ArrowLeft') irPara(indice - 1)
      else if (tipo === 'pdf' && (e.key === '+' || e.key === '=')) setZoom((z) => ZOOMS.find((v) => v > z) ?? z)
      else if (tipo === 'pdf' && e.key === '-') setZoom((z) => [...ZOOMS].reverse().find((v) => v < z) ?? z)
    }
    window.addEventListener('keydown', aoTeclar, true)
    return () => window.removeEventListener('keydown', aoTeclar, true)
  }, [indice, irPara, onFechar, tipo])

  // Deslizar no celular (fotos e vídeos; o PDF usa o gesto pra rolar as páginas).
  function aoTocar(e) {
    if (tipo === 'pdf' || e.touches.length !== 1) return
    toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function aoSoltar(e) {
    if (!toque.current || !varios) return
    const dx = e.changedTouches[0].clientX - toque.current.x
    const dy = e.changedTouches[0].clientY - toque.current.y
    toque.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) irPara(indice + (dx < 0 ? 1 : -1))
  }

  const IconeTipo = { imagem: IconPhoto, video: IconPlayerPlayFilled, pdf: IconFileTypePdf, outro: IconFile }[tipo]
  const meta = [ROTULO_TIPO[tipo], arquivo.tamanhoBytes ? formatarTamanho(arquivo.tamanhoBytes) : null, varios ? `${indice + 1} de ${lista.length}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div role="dialog" aria-modal="true" aria-label={arquivo.nomeOriginal} className="fixed inset-0 z-[80] flex flex-col bg-[#0b0f17] text-white">
      {/* Barra superior */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-2 sm:h-16 sm:px-4">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-white/10 sm:flex">
          <IconeTipo size={18} />
        </span>
        <div className="min-w-0 flex-1 pl-1">
          <p className="truncate text-body font-semibold">{arquivo.nomeOriginal}</p>
          <p className="truncate text-[11px] text-white/55">
            {meta}
            {tipo === 'pdf' && infoPdf ? ` · página ${infoPdf.atual} de ${infoPdf.paginas}` : ''}
          </p>
        </div>

        {tipo === 'pdf' && !erroPdf && (
          <div className="flex items-center rounded-btn bg-white/5">
            <BotaoBarra rotulo="Diminuir zoom" onClick={() => setZoom((z) => [...ZOOMS].reverse().find((v) => v < z) ?? z)}>
              <IconZoomOut size={19} />
            </BotaoBarra>
            <button type="button" onClick={() => setZoom(1)} title="Ajustar à tela" className="hidden h-10 w-14 text-label tabular-nums text-white/80 hover:text-white sm:block">
              {Math.round(zoom * 100)}%
            </button>
            <BotaoBarra rotulo="Aumentar zoom" onClick={() => setZoom((z) => ZOOMS.find((v) => v > z) ?? z)}>
              <IconZoomIn size={19} />
            </BotaoBarra>
            <span className="sm:hidden">
              <BotaoBarra rotulo="Ajustar à tela" onClick={() => setZoom(1)}>
                <IconArrowsDiagonal size={18} />
              </BotaoBarra>
            </span>
          </div>
        )}

        <BotaoBarra rotulo="Baixar" href={urlDownload(arquivo)} download={arquivo.nomeOriginal}>
          <IconDownload size={19} />
          <span className="hidden text-label font-medium md:inline">Baixar</span>
        </BotaoBarra>
        <button
          ref={fecharRef}
          type="button"
          onClick={onFechar}
          aria-label="Fechar"
          title="Fechar (Esc)"
          className="flex h-10 w-10 items-center justify-center rounded-btn text-white/85 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <IconX size={22} />
        </button>
      </header>

      {/* Conteúdo */}
      <div className="relative min-h-0 flex-1" onTouchStart={aoTocar} onTouchEnd={aoSoltar}>
        <div key={arquivo.url} className="absolute inset-0">
          {tipo === 'imagem' && <Imagem arquivo={arquivo} />}
          {tipo === 'video' && (
            <div className="flex h-full w-full items-center justify-center p-2 sm:p-6">
              <video src={arquivo.url} controls autoPlay playsInline className="max-h-full max-w-full rounded-sm bg-black shadow-[0_8px_40px_rgba(0,0,0,0.5)]" />
            </div>
          )}
          {tipo === 'pdf' &&
            (erroPdf ? (
              <SemPrevia arquivo={arquivo} mensagem="Não foi possível abrir este PDF aqui. Baixe para ver." />
            ) : (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-white/60">
                    <IconLoader2 size={32} className="animate-spin" />
                  </div>
                }
              >
                <VisualizadorPdf url={arquivo.url} zoom={zoom} onInfo={setInfoPdf} onErro={() => setErroPdf(true)} />
              </Suspense>
            ))}
          {tipo === 'outro' && <SemPrevia arquivo={arquivo} mensagem="Este formato não tem prévia no navegador." />}
        </div>

        {varios && (
          <>
            <button
              type="button"
              onClick={() => irPara(indice - 1)}
              aria-label="Anterior"
              className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:flex"
            >
              <IconChevronLeft size={26} />
            </button>
            <button
              type="button"
              onClick={() => irPara(indice + 1)}
              aria-label="Próximo"
              className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:flex"
            >
              <IconChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      {/* Miniaturas (computador) / indicador (celular) */}
      {varios && (
        <footer className="shrink-0 border-t border-white/10 px-3 py-2.5">
          <div className="mx-auto hidden max-w-full justify-center gap-2 overflow-x-auto sm:flex">
            {lista.map((a, i) => (
              <Miniatura key={`${a.url}-${i}`} arquivo={a} ativo={i === indice} onClick={() => setIndice(i)} />
            ))}
          </div>
          {/* Celular: setas na barra de baixo (não cobrem a foto/PDF) + indicador de posição */}
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <button type="button" onClick={() => irPara(indice - 1)} aria-label="Anterior" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20">
              <IconChevronLeft size={24} />
            </button>
            <div className="flex min-w-0 items-center justify-center gap-1.5" aria-hidden="true">
              {lista.length <= 12 ? (
                lista.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === indice ? 'w-5 bg-white' : 'w-1.5 bg-white/35'}`} />)
              ) : (
                <span className="text-label text-white/60">{indice + 1} de {lista.length}</span>
              )}
            </div>
            <button type="button" onClick={() => irPara(indice + 1)} aria-label="Próximo" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20">
              <IconChevronRight size={24} />
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
