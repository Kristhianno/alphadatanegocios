import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  IconCloudUpload, IconCopy, IconExternalLink, IconFileTypePdf, IconFile, IconFolder, IconLock, IconPhoto, IconTrash,
  IconVideo, IconWorld, IconX,
} from '@tabler/icons-react'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import { ACEITOS, CATEGORIAS_ARQUIVO, enviarArquivo, formatarTamanho } from '../../services/arquivos'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Selecao from '../../components/ui/Selecao'

const FILTROS_TIPO = [
  { id: '', label: 'Todos' },
  { id: 'imagem', label: 'Fotos', icon: IconPhoto },
  { id: 'video', label: 'Vídeos', icon: IconVideo },
  { id: 'documento', label: 'Documentos', icon: IconFileTypePdf },
]

const ROTULO_CATEGORIA = Object.fromEntries(CATEGORIAS_ARQUIVO.map((c) => [c.id, c.label]))

function Previa({ arquivo }) {
  if (arquivo.tipo === 'imagem') {
    return <img src={arquivo.url} alt={arquivo.nomeOriginal} loading="lazy" className="h-full w-full object-cover" />
  }
  if (arquivo.tipo === 'video') {
    return <video src={arquivo.url} preload="metadata" muted playsInline className="h-full w-full object-cover bg-black" />
  }
  const Icone = arquivo.tipoMime === 'application/pdf' ? IconFileTypePdf : IconFile
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-[#999]">
      <Icone size={44} stroke={1.25} />
    </div>
  )
}

function BarraUso({ uso }) {
  if (!uso) return null
  const pct = Math.min(100, (uso.usadoBytes / uso.limiteBytes) * 100)
  const cor = pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-500' : 'bg-primary'
  return (
    <div className="min-w-[220px] flex-1 sm:max-w-xs">
      <div className="mb-1 flex justify-between text-label text-[#666]">
        <span>Espaço usado</span>
        <span className="font-semibold text-[#1a1a1a]">
          {formatarTamanho(uso.usadoBytes)} de {formatarTamanho(uso.limiteBytes)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted-dark/70" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${cor}`} style={{ width: `${Math.max(pct, uso.usadoBytes > 0 ? 1 : 0)}%` }} />
      </div>
    </div>
  )
}

export default function Arquivos() {
  const { showToast } = useToast()
  const inputRef = useRef(null)

  const [arquivos, setArquivos] = useState([])
  const [uso, setUso] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [categoriaUpload, setCategoriaUpload] = useState('catalogo')
  const [envios, setEnvios] = useState([]) // { id, nome, progresso, erro }
  const [arrastando, setArrastando] = useState(false)
  const [paraExcluir, setParaExcluir] = useState(null)

  const carregar = useCallback(async () => {
    try {
      const [lista, usoAtual] = await Promise.all([api.get('/arquivos'), api.get('/arquivos/uso')])
      setArquivos(lista)
      setUso(usoAtual)
      setErro('')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os arquivos.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const visiveis = useMemo(
    () => arquivos.filter((a) => (!filtroTipo || a.tipo === filtroTipo) && (!filtroCategoria || a.categoria === filtroCategoria)),
    [arquivos, filtroTipo, filtroCategoria],
  )

  async function enviar(lista) {
    const arquivosSelecionados = [...lista]
    if (arquivosSelecionados.length === 0) return
    const novos = arquivosSelecionados.map((f, i) => ({ id: `${Date.now()}-${i}`, nome: f.name, progresso: 0, erro: '' }))
    setEnvios((atuais) => [...novos, ...atuais])

    let enviados = 0
    for (const [i, arquivo] of arquivosSelecionados.entries()) {
      const idEnvio = novos[i].id
      try {
        const registrado = await enviarArquivo(arquivo, { categoria: categoriaUpload }, (progresso) =>
          setEnvios((atuais) => atuais.map((e) => (e.id === idEnvio ? { ...e, progresso } : e))),
        )
        enviados += 1
        setArquivos((atuais) => [registrado, ...atuais])
        setEnvios((atuais) => atuais.filter((e) => e.id !== idEnvio))
      } catch (e) {
        const mensagem = e instanceof ApiError ? e.message : e.message || 'Falha ao enviar.'
        setEnvios((atuais) => atuais.map((x) => (x.id === idEnvio ? { ...x, erro: mensagem } : x)))
      }
    }
    if (enviados > 0) {
      showToast(enviados === 1 ? 'Arquivo enviado.' : `${enviados} arquivos enviados.`)
      api.get('/arquivos/uso').then(setUso).catch(() => {})
    }
  }

  async function copiarLink(arquivo) {
    try {
      await navigator.clipboard.writeText(arquivo.url)
      showToast(arquivo.urlTemporaria ? 'Link copiado. Ele expira em 1 hora.' : 'Link copiado.')
    } catch {
      showToast('Não foi possível copiar o link.', 'erro')
    }
  }

  async function excluir() {
    const alvo = paraExcluir
    setParaExcluir(null)
    try {
      await api.delete(`/arquivos/${alvo.id}`)
      setArquivos((atuais) => atuais.filter((a) => a.id !== alvo.id))
      api.get('/arquivos/uso').then(setUso).catch(() => {})
      showToast('Arquivo excluído.')
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Não foi possível excluir.', 'erro')
    }
  }

  const categoriaAtual = CATEGORIAS_ARQUIVO.find((c) => c.id === categoriaUpload)

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <IconFolder size={28} className="shrink-0 text-primary" />
          <div>
            <h1 className="text-h1 leading-tight text-primary">Arquivos</h1>
            <p className="text-label text-[#999]">Fotos, vídeos e documentos da sua empresa, guardados na nuvem.</p>
          </div>
        </div>
        <BarraUso uso={uso} />
      </div>

      {/* Envio */}
      <div className="rounded-card bg-surface p-4 sm:p-5 shadow-card">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor="categoria-upload" className="text-body font-semibold text-[#1a1a1a]">Enviar para:</label>
          <Selecao
            id="categoria-upload"
            value={categoriaUpload}
            onChange={(e) => setCategoriaUpload(e.target.value)}
            className="rounded-btn border border-muted-dark bg-surface px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {CATEGORIAS_ARQUIVO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Selecao>
          <span className="flex items-center gap-1 text-label text-[#999]">
            {categoriaAtual?.publico ? <IconWorld size={14} /> : <IconLock size={14} />} {categoriaAtual?.descricao}
          </span>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setArrastando(true) }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastando(false); enviar(e.dataTransfer.files) }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            arrastando ? 'border-primary bg-primary-light' : 'border-muted-dark hover:border-primary hover:bg-primary-light'
          }`}
        >
          <IconCloudUpload size={36} className="text-primary" stroke={1.5} />
          <span className="text-body font-semibold text-[#1a1a1a]">Arraste arquivos aqui ou clique para escolher</span>
          <span className="text-label text-[#999]">Fotos até 10MB (reduzimos automaticamente) · vídeos até 50MB · PDF e documentos até 20MB</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACEITOS}
          className="hidden"
          onChange={(e) => { enviar(e.target.files); e.target.value = '' }}
        />

        {envios.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {envios.map((e) => (
              <li key={e.id} className="rounded-btn border border-muted-dark px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-label">
                  <span className="truncate text-[#333]">{e.nome}</span>
                  {e.erro ? (
                    <button type="button" onClick={() => setEnvios((atuais) => atuais.filter((x) => x.id !== e.id))} aria-label="Dispensar" className="text-[#999] hover:text-[#333]">
                      <IconX size={14} />
                    </button>
                  ) : (
                    <span className="shrink-0 text-[#999]">{e.progresso}%</span>
                  )}
                </div>
                {e.erro ? (
                  <p className="mt-1 text-label text-danger">{e.erro}</p>
                ) : (
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${e.progresso}%` }} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-btn bg-surface p-1 shadow-card">
          {FILTROS_TIPO.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroTipo(f.id)}
              className={`flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-label font-medium ${filtroTipo === f.id ? 'bg-primary text-white' : 'text-[#666] hover:bg-muted'}`}
            >
              {f.icon && <f.icon size={15} />} {f.label}
            </button>
          ))}
        </div>
        <Selecao
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          aria-label="Filtrar por categoria"
          className="rounded-btn border border-muted-dark bg-surface px-3 py-2 text-label focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS_ARQUIVO.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Selecao>
        {!carregando && <span className="text-label text-[#999]">{visiveis.length} arquivo(s)</span>}
      </div>

      {erro && <div role="alert" className="rounded-card border border-red-100 bg-red-50 px-4 py-3 text-body text-danger">{erro}</div>}

      {carregando ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-card bg-muted-dark/60" />)}
        </div>
      ) : visiveis.length === 0 ? (
        !erro && (
          <div className="rounded-card bg-surface px-4 py-12 text-center shadow-card">
            <IconFolder size={40} className="mx-auto text-[#ccc]" stroke={1.25} />
            <p className="mt-2 text-body text-[#999]">
              {arquivos.length === 0 ? 'Nenhum arquivo ainda. Envie as fotos dos seus pacotes / kits para começar.' : 'Nenhum arquivo com esse filtro.'}
            </p>
          </div>
        )
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visiveis.map((a) => (
            <li key={a.id} className="group flex flex-col overflow-hidden rounded-card bg-surface shadow-card">
              <a href={a.url} target="_blank" rel="noreferrer" className="relative block aspect-square overflow-hidden bg-muted">
                <Previa arquivo={a} />
                {a.tipo === 'video' && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 p-1 text-white"><IconVideo size={14} /></span>
                )}
                <span
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-[#555]"
                  title={a.urlTemporaria ? 'Privado: link temporário' : 'Público: link permanente'}
                >
                  {a.urlTemporaria ? <IconLock size={13} /> : <IconWorld size={13} />}
                </span>
              </a>
              <div className="flex flex-1 flex-col gap-1 p-2.5">
                <p className="truncate text-label font-semibold text-[#1a1a1a]" title={a.nomeOriginal}>{a.nomeOriginal}</p>
                <p className="text-[11px] text-[#999]">{ROTULO_CATEGORIA[a.categoria] ?? a.categoria} · {formatarTamanho(a.tamanhoBytes)}</p>
                <div className="mt-auto flex items-center gap-1 pt-1">
                  <a href={a.url} target="_blank" rel="noreferrer" aria-label="Abrir" className="rounded-btn p-1.5 text-[#666] hover:bg-muted hover:text-primary">
                    <IconExternalLink size={16} />
                  </a>
                  <button type="button" onClick={() => copiarLink(a)} aria-label="Copiar link" className="rounded-btn p-1.5 text-[#666] hover:bg-muted hover:text-primary">
                    <IconCopy size={16} />
                  </button>
                  <button type="button" onClick={() => setParaExcluir(a)} aria-label="Excluir" className="ml-auto rounded-btn p-1.5 text-[#666] hover:bg-red-50 hover:text-danger">
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={!!paraExcluir}
        onClose={() => setParaExcluir(null)}
        onConfirm={excluir}
        titulo="Excluir arquivo?"
        mensagem={`"${paraExcluir?.nomeOriginal ?? ''}" será apagado da nuvem de vez. Links já enviados param de funcionar.`}
        textoConfirmar="Excluir"
        corConfirmar="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}
