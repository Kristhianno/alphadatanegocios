import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  IconBox, IconCirclePlus, IconFileTypePdf, IconGift, IconLayoutGrid, IconPhoto, IconPhotoUp,
  IconPlus, IconTrash, IconUsers, IconX,
} from '@tabler/icons-react'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import { enviarArquivo } from '../../services/arquivos'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

/** Abas do portfólio — `tipo` é o mesmo de server/src/models/PortfolioItem.ts. */
const ABAS = [
  { id: 'pacotes', tipo: 'pacote', titulo: 'Pacotes', singular: 'pacote', icon: IconBox, exemplo: 'Ex: Pacote Ouro (festa completa para 100 convidados)', capacidade: true },
  { id: 'kits', tipo: 'kit', titulo: 'Kits', singular: 'kit', icon: IconGift, exemplo: 'Ex: Kit Unicórnio (mesa decorada + painel + 50 balões)', capacidade: false },
  { id: 'adicionais', tipo: 'adicional', titulo: 'Adicionais', singular: 'adicional', icon: IconCirclePlus, exemplo: 'Ex: Pula-pula extra, hora adicional, mesa de doces', capacidade: false },
]

const ACEITA_IMAGEM = 'image/jpeg,image/png,image/webp'
const ACEITA_PDF = 'application/pdf'

function formatarPreco(valor) {
  if (valor == null) return null
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: valor % 1 ? 2 : 0 })
}

/** Envio de vários arquivos com progresso individual; chama onEnviado(arquivo) a cada sucesso. */
function useEnvios(onEnviado) {
  const [envios, setEnvios] = useState([])
  const enviar = useCallback(
    async (lista, opcoes) => {
      const arquivos = [...lista]
      const novos = arquivos.map((f, i) => ({ id: `${Date.now()}-${i}-${f.name}`, nome: f.name, progresso: 0, erro: '' }))
      setEnvios((atuais) => [...novos, ...atuais])
      for (const [i, arquivo] of arquivos.entries()) {
        const id = novos[i].id
        try {
          const registrado = await enviarArquivo(arquivo, { categoria: 'catalogo', ...opcoes }, (progresso) =>
            setEnvios((atuais) => atuais.map((e) => (e.id === id ? { ...e, progresso } : e))),
          )
          onEnviado(registrado)
          setEnvios((atuais) => atuais.filter((e) => e.id !== id))
        } catch (erro) {
          const mensagem = erro instanceof ApiError ? erro.message : erro.message || 'Falha ao enviar.'
          setEnvios((atuais) => atuais.map((e) => (e.id === id ? { ...e, erro: mensagem } : e)))
        }
      }
    },
    [onEnviado],
  )
  const dispensar = (id) => setEnvios((atuais) => atuais.filter((e) => e.id !== id))
  return { envios, enviar, dispensar }
}

function BotaoUpload({ aceita, multiplo = true, onArquivos, children, variante = 'secundario', disabled }) {
  const ref = useRef(null)
  const estilos =
    variante === 'principal'
      ? 'bg-primary text-white hover:bg-primary-dark'
      : 'border border-primary bg-surface text-primary hover:bg-primary-light'
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => ref.current?.click()}
        className={`inline-flex items-center justify-center gap-1.5 rounded-btn px-3.5 py-2 text-body font-medium transition-colors disabled:opacity-50 ${estilos}`}
      >
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={aceita}
        multiple={multiplo}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onArquivos(e.target.files)
          e.target.value = ''
        }}
      />
    </>
  )
}

function ListaEnvios({ envios, onDispensar }) {
  if (envios.length === 0) return null
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {envios.map((e) => (
        <li key={e.id} className="rounded-btn border border-muted-dark px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-label">
            <span className="truncate text-[#333]">{e.nome}</span>
            {e.erro ? (
              <button type="button" onClick={() => onDispensar(e.id)} aria-label="Dispensar" className="text-[#999] hover:text-[#333]">
                <IconX size={14} />
              </button>
            ) : (
              <span className="text-[#999]">{e.progresso}%</span>
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
  )
}

/** Miniatura de um arquivo (foto ou PDF) com abrir/excluir. */
function MiniaturaArquivo({ arquivo, destaque, onExcluir }) {
  const ehPdf = arquivo.tipo === 'documento'
  return (
    <div className="group relative w-full overflow-hidden rounded-card border border-muted-dark bg-surface">
      <a href={arquivo.url} target="_blank" rel="noreferrer" className="block aspect-square bg-muted" title={arquivo.nomeOriginal}>
        {ehPdf ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center text-danger">
            <IconFileTypePdf size={34} stroke={1.25} />
            <span className="line-clamp-2 text-[11px] text-[#666]">{arquivo.nomeOriginal}</span>
          </div>
        ) : (
          <img src={arquivo.url} alt={arquivo.nomeOriginal} loading="lazy" className="h-full w-full object-cover" />
        )}
      </a>
      {destaque && <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">{destaque}</span>}
      <button
        type="button"
        onClick={() => onExcluir(arquivo)}
        aria-label={`Excluir ${arquivo.nomeOriginal}`}
        className="absolute right-1 top-1 rounded-full bg-danger p-1 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
      >
        <IconTrash size={13} />
      </button>
    </div>
  )
}

function MateriaisProntos({ aba, onExcluirArquivo, versao }) {
  const [materiais, setMateriais] = useState(null)
  const adicionar = useCallback((a) => setMateriais((atuais) => [a, ...(atuais ?? [])]), [])
  const { envios, enviar, dispensar } = useEnvios(adicionar)

  useEffect(() => {
    let cancelado = false
    setMateriais(null)
    api.get(`/portfolio/materiais/${aba.tipo}`).then((lista) => !cancelado && setMateriais(lista)).catch(() => !cancelado && setMateriais([]))
    return () => {
      cancelado = true
    }
  }, [aba.tipo, versao])

  const entidade = { entidadeTipo: `portfolio_${aba.tipo}` }

  return (
    <section className="rounded-card bg-surface p-4 sm:p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-h2 text-[#1a1a1a]">Materiais prontos</h2>
          <p className="text-label text-[#777]">
            Já tem as artes ou o catálogo de {aba.titulo.toLowerCase()} em PDF? Envie aqui. A IA do WhatsApp pode mandar esses arquivos para os clientes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <BotaoUpload aceita={ACEITA_IMAGEM} onArquivos={(f) => enviar(f, entidade)}>
            <IconPhotoUp size={18} /> Enviar imagens
          </BotaoUpload>
          <BotaoUpload aceita={ACEITA_PDF} onArquivos={(f) => enviar(f, entidade)}>
            <IconFileTypePdf size={18} /> Enviar PDF
          </BotaoUpload>
        </div>
      </div>
      <ListaEnvios envios={envios} onDispensar={dispensar} />
      {materiais === null ? (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-card bg-muted" />)}
        </div>
      ) : materiais.length === 0 ? (
        envios.length === 0 && <p className="mt-4 rounded-btn bg-muted px-3 py-3 text-label text-[#999]">Nenhum material enviado nesta aba ainda.</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
          {materiais.map((m) => (
            <MiniaturaArquivo
              key={m.id}
              arquivo={m}
              onExcluir={(a) => onExcluirArquivo(a, () => setMateriais((atuais) => atuais.filter((x) => x.id !== a.id)))}
            />
          ))}
        </div>
      )}
    </section>
  )
}

const FORM_VAZIO = { nome: '', preco: '', capacidade: '', descricao: '', itensInclusos: '', ativo: true }

function paraForm(item) {
  if (!item) return FORM_VAZIO
  return {
    nome: item.nome,
    preco: item.preco ?? '',
    capacidade: item.capacidade ?? '',
    descricao: item.descricao ?? '',
    itensInclusos: (item.itensInclusos ?? []).join('\n'),
    ativo: item.ativo,
  }
}

function paraApi(form) {
  const numero = (v) => (v === '' || v == null ? null : Number(v))
  return {
    nome: form.nome,
    preco: numero(form.preco),
    capacidade: numero(form.capacidade),
    descricao: form.descricao,
    itensInclusos: form.itensInclusos.split('\n').map((l) => l.trim()).filter(Boolean),
    ativo: form.ativo,
  }
}

const campoClasse = 'w-full rounded-btn border border-muted-dark bg-surface px-3 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'
const rotuloClasse = 'mb-1 block text-label font-medium text-[#444]'

function ModalItem({ aba, item, onFechar, onSalvo, onExcluir, onExcluirArquivo }) {
  const { showToast } = useToast()
  const [atual, setAtual] = useState(item) // null = novo
  const [form, setForm] = useState(paraForm(item))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const anexar = useCallback(
    (arquivo) => {
      setAtual((it) => {
        if (!it) return it
        const chave = arquivo.tipo === 'documento' ? 'pdfs' : 'fotos'
        const novo = { ...it, [chave]: [...it[chave], arquivo] }
        onSalvo(novo)
        return novo
      })
    },
    [onSalvo],
  )
  const { envios, enviar, dispensar } = useEnvios(anexar)

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const salvo = atual ? await api.patch(`/portfolio/${atual.id}`, paraApi(form)) : await api.post('/portfolio', { ...paraApi(form), tipo: aba.tipo })
      onSalvo(salvo)
      if (atual) {
        showToast(`${aba.singular[0].toUpperCase()}${aba.singular.slice(1)} salvo.`)
        onFechar()
      } else {
        setAtual(salvo)
        showToast('Salvo! Agora adicione as fotos e o PDF.')
      }
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.detalhes?.[0]?.mensagem ?? falha.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  const alterar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const entidade = atual ? { entidadeTipo: 'portfolio_item', entidadeId: atual.id } : null

  return (
    <Modal
      open
      onClose={onFechar}
      size="lg"
      title={atual ? atual.nome : `Novo ${aba.singular}`}
      footer={
        <>
          {atual && (
            <button type="button" onClick={() => onExcluir(atual)} className="mr-auto flex items-center gap-1.5 rounded-btn px-3 py-2 text-body text-danger hover:bg-red-50">
              <IconTrash size={17} /> Excluir
            </button>
          )}
          <button type="button" onClick={onFechar} className="rounded-btn bg-muted-dark px-4 py-2 text-body font-medium text-[#333] hover:bg-gray-300">
            {atual && !item ? 'Concluir' : 'Cancelar'}
          </button>
          <button type="submit" form="form-portfolio" disabled={salvando} className="rounded-btn bg-primary px-4 py-2 text-body font-semibold text-white hover:bg-primary-dark disabled:opacity-60">
            {salvando ? 'Salvando...' : atual ? 'Salvar' : 'Salvar e adicionar fotos'}
          </button>
        </>
      }
    >
      <form id="form-portfolio" onSubmit={salvar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="pf-nome" className={rotuloClasse}>Nome *</label>
          <input id="pf-nome" required autoFocus={!item} value={form.nome} onChange={alterar('nome')} placeholder={aba.exemplo} className={campoClasse} />
        </div>
        <div>
          <label htmlFor="pf-preco" className={rotuloClasse}>Preço (R$)</label>
          <input id="pf-preco" type="number" min="0" step="0.01" inputMode="decimal" value={form.preco} onChange={alterar('preco')} placeholder="Ex: 890" className={campoClasse} />
        </div>
        {aba.capacidade ? (
          <div>
            <label htmlFor="pf-cap" className={rotuloClasse}>Convidados</label>
            <input id="pf-cap" type="number" min="0" inputMode="numeric" value={form.capacidade} onChange={alterar('capacidade')} placeholder="Ex: 100" className={campoClasse} />
          </div>
        ) : (
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2.5 text-body text-[#333]">
              <input type="checkbox" checked={form.ativo} onChange={alterar('ativo')} className="h-4 w-4 accent-[var(--color-primary)]" /> Ativo (a IA pode oferecer)
            </label>
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="pf-desc" className={rotuloClasse}>Descrição</label>
          <textarea id="pf-desc" rows={3} value={form.descricao} onChange={alterar('descricao')} placeholder="Como você apresentaria para o cliente" className={campoClasse} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pf-inclusos" className={rotuloClasse}>O que inclui (um item por linha)</label>
          <textarea id="pf-inclusos" rows={4} value={form.itensInclusos} onChange={alterar('itensInclusos')} placeholder={'Mesa decorada\nPainel temático\n50 balões'} className={campoClasse} />
        </div>
        {aba.capacidade && (
          <label className="flex items-center gap-2 text-body text-[#333] sm:col-span-2">
            <input type="checkbox" checked={form.ativo} onChange={alterar('ativo')} className="h-4 w-4 accent-[var(--color-primary)]" /> Ativo (a IA pode oferecer)
          </label>
        )}
        {erro && <p role="alert" className="rounded-btn border border-red-100 bg-red-50 px-3 py-2 text-label text-danger sm:col-span-2">{erro}</p>}
      </form>

      <div className="mt-6 border-t border-muted-dark pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-body font-bold text-[#1a1a1a]">Fotos e PDF</h3>
            <p className="text-label text-[#999]">{atual ? 'A primeira foto é a principal.' : 'Salve primeiro para poder enviar fotos e PDF.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <BotaoUpload aceita={ACEITA_IMAGEM} disabled={!atual} onArquivos={(f) => enviar(f, entidade)}>
              <IconPhotoUp size={18} /> Enviar imagens
            </BotaoUpload>
            <BotaoUpload aceita={ACEITA_PDF} disabled={!atual} onArquivos={(f) => enviar(f, entidade)}>
              <IconFileTypePdf size={18} /> Enviar PDF
            </BotaoUpload>
          </div>
        </div>
        <ListaEnvios envios={envios} onDispensar={dispensar} />
        {atual && atual.fotos.length + atual.pdfs.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {[...atual.fotos, ...atual.pdfs].map((a, i) => (
              <MiniaturaArquivo
                key={a.id}
                arquivo={a}
                destaque={i === 0 && a.tipo === 'imagem' ? 'Principal' : null}
                onExcluir={(arq) =>
                  onExcluirArquivo(arq, () =>
                    setAtual((it) => {
                      const novo = { ...it, fotos: it.fotos.filter((x) => x.id !== arq.id), pdfs: it.pdfs.filter((x) => x.id !== arq.id) }
                      onSalvo(novo)
                      return novo
                    }),
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

function CardItem({ item, aba, onAbrir }) {
  const capa = item.fotos[0]
  return (
    <button
      type="button"
      onClick={() => onAbrir(item)}
      className={`group flex flex-col overflow-hidden rounded-card bg-surface text-left shadow-card transition-shadow hover:shadow-cardHover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${item.ativo ? '' : 'opacity-60'}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {capa ? (
          <img src={capa.url} alt={item.nome} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#bbb]">
            <IconPhoto size={34} stroke={1.25} />
            <span className="text-[11px]">Sem foto</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {!item.ativo && <span className="rounded-full bg-gray-800/80 px-2 py-0.5 text-[10px] font-semibold text-white">Inativo</span>}
          {item.fotos.length > 1 && <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white">{item.fotos.length} fotos</span>}
          {item.pdfs.length > 0 && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-danger">PDF</span>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-body font-semibold leading-snug text-[#1a1a1a]">{item.nome}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-label text-[#777]">
          {item.preco != null && <span className="font-semibold text-primary">{formatarPreco(item.preco)}</span>}
          {aba.capacidade && item.capacidade != null && (
            <span className="inline-flex items-center gap-1"><IconUsers size={13} /> {item.capacidade}</span>
          )}
          {item.itensInclusos.length > 0 && <span>{item.itensInclusos.length} itens inclusos</span>}
        </div>
      </div>
    </button>
  )
}

export default function Portfolio() {
  const { showToast } = useToast()
  const [params, setParams] = useSearchParams()
  const aba = ABAS.find((a) => a.id === params.get('aba')) ?? ABAS[0]

  const [itens, setItens] = useState(null)
  const contagem = useMemo(() => Object.fromEntries(ABAS.map((a) => [a.tipo, (itens ?? []).filter((i) => i.tipo === a.tipo).length])), [itens])
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(null) // { item } — item null = novo
  const [itemParaExcluir, setItemParaExcluir] = useState(null)
  const [arquivoParaExcluir, setArquivoParaExcluir] = useState(null) // { arquivo, aoExcluir }

  const carregar = useCallback(async () => {
    try {
      setItens(await api.get('/portfolio'))
      setErro('')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o portfólio.')
      setItens([])
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const daAba = (itens ?? []).filter((i) => i.tipo === aba.tipo)

  const aoSalvar = useCallback((salvo) => {
    setItens((atuais) => {
      const existe = (atuais ?? []).some((i) => i.id === salvo.id)
      return existe ? atuais.map((i) => (i.id === salvo.id ? salvo : i)) : [...(atuais ?? []), salvo]
    })
  }, [])

  async function excluirItem() {
    const alvo = itemParaExcluir
    setItemParaExcluir(null)
    try {
      await api.delete(`/portfolio/${alvo.id}`)
      setItens((atuais) => atuais.filter((i) => i.id !== alvo.id))
      setModal(null)
      showToast(`"${alvo.nome}" excluído.`)
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Não foi possível excluir.', 'erro')
    }
  }

  async function excluirArquivo() {
    const { arquivo, aoExcluir } = arquivoParaExcluir
    setArquivoParaExcluir(null)
    try {
      await api.delete(`/arquivos/${arquivo.id}`)
      aoExcluir()
      showToast('Arquivo excluído.')
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Não foi possível excluir o arquivo.', 'erro')
    }
  }

  const pedirExclusaoArquivo = (arquivo, aoExcluir) => setArquivoParaExcluir({ arquivo, aoExcluir })

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-center gap-3">
        <IconLayoutGrid size={28} className="shrink-0 text-primary" />
        <div>
          <h1 className="text-h1 leading-tight text-primary">Portfólio</h1>
          <p className="text-label text-[#999]">O que você vende. É daqui que a IA do WhatsApp tira fotos, PDFs e preços.</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-btn bg-surface p-1 shadow-card sm:w-fit" role="tablist" aria-label="Seções do portfólio">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={a.id === aba.id}
            onClick={() => setParams({ aba: a.id }, { replace: true })}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-btn px-2 py-2 text-label font-medium transition-colors sm:flex-none sm:gap-1.5 sm:px-4 sm:text-body ${
              a.id === aba.id ? 'bg-primary text-white' : 'text-[#555] hover:bg-muted'
            }`}
          >
            <a.icon size={17} className="hidden shrink-0 sm:block" /> <span className="truncate">{a.titulo}</span>
            {itens !== null && (
              <span className={`rounded-full px-1.5 text-[11px] font-bold ${a.id === aba.id ? 'bg-white/25' : 'bg-muted'}`}>{contagem[a.tipo] ?? 0}</span>
            )}
          </button>
        ))}
      </div>

      <MateriaisProntos aba={aba} onExcluirArquivo={pedirExclusaoArquivo} versao={aba.tipo} />

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-h2 text-[#1a1a1a]">Seus {aba.titulo.toLowerCase()}</h2>
          <button
            type="button"
            onClick={() => setModal({ item: null })}
            className="inline-flex items-center gap-1.5 rounded-btn bg-primary px-4 py-2.5 text-body font-semibold text-white hover:bg-primary-dark"
          >
            <IconPlus size={18} /> Novo {aba.singular}
          </button>
        </div>

        {erro && <div role="alert" className="mb-3 rounded-card border border-red-100 bg-red-50 px-4 py-3 text-body text-danger">{erro}</div>}

        {itens === null ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-card bg-muted-dark/60" />)}
          </div>
        ) : daAba.length === 0 ? (
          !erro && (
            <button
              type="button"
              onClick={() => setModal({ item: null })}
              className="flex w-full flex-col items-center gap-2 rounded-card border-2 border-dashed border-muted-dark bg-surface px-4 py-10 text-center hover:border-primary hover:bg-primary-light"
            >
              <aba.icon size={36} className="text-[#bbb]" stroke={1.25} />
              <span className="text-body font-semibold text-[#1a1a1a]">Cadastre seu primeiro {aba.singular}</span>
              <span className="text-label text-[#999]">{aba.exemplo}</span>
            </button>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {daAba.map((item) => <CardItem key={item.id} item={item} aba={aba} onAbrir={(it) => setModal({ item: it })} />)}
          </div>
        )}
      </section>

      {modal && (
        <ModalItem
          key={modal.item?.id ?? 'novo'}
          aba={aba}
          item={modal.item}
          onFechar={() => setModal(null)}
          onSalvo={aoSalvar}
          onExcluir={setItemParaExcluir}
          onExcluirArquivo={pedirExclusaoArquivo}
        />
      )}

      <ConfirmModal
        open={!!itemParaExcluir}
        onClose={() => setItemParaExcluir(null)}
        onConfirm={excluirItem}
        titulo={`Excluir ${aba.singular}?`}
        mensagem={`"${itemParaExcluir?.nome ?? ''}" e todas as fotos e PDFs dele serão apagados de vez.`}
        textoConfirmar="Excluir"
        corConfirmar="bg-red-600 hover:bg-red-700"
      />
      <ConfirmModal
        open={!!arquivoParaExcluir}
        onClose={() => setArquivoParaExcluir(null)}
        onConfirm={excluirArquivo}
        titulo="Excluir arquivo?"
        mensagem={`"${arquivoParaExcluir?.arquivo.nomeOriginal ?? ''}" será apagado de vez. Links já enviados param de funcionar.`}
        textoConfirmar="Excluir"
        corConfirmar="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}
