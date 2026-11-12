import { useEffect, useRef, useState } from 'react'
import {
  IconAlertTriangle, IconCheck, IconExternalLink, IconFileText, IconFileTypePdf, IconRefresh, IconSparkles, IconTrash, IconUpload,
} from '@tabler/icons-react'
import { api, ApiError } from '../services/api'
import { enviarArquivo, formatarTamanho } from '../services/arquivos'
import { useToast } from '../hooks/useToast'
import Modal from './ui/Modal'

const ACEITA = 'application/pdf,.doc,.docx'

/**
 * Modelo de contrato da empresa (ver server/src/services/ModeloContratoService.ts):
 * o arquivo original (PDF/Word, privado) + o texto com campos {{...}} que a
 * IA do WhatsApp preenche com os dados do cliente.
 */
export default function ModeloContratoModal({ open, onClose, onAtualizado }) {
  const { showToast } = useToast()
  const inputRef = useRef(null)
  const textoRef = useRef(null)

  const [modelo, setModelo] = useState(null)
  const [erro, setErro] = useState('')
  const [texto, setTexto] = useState('')
  const [progresso, setProgresso] = useState(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelado = false
    setErro('')
    api
      .get('/modelo-contrato')
      .then((m) => {
        if (cancelado) return
        setModelo(m)
        setTexto(m.texto)
      })
      .catch((e) => !cancelado && setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o modelo.'))
    return () => {
      cancelado = true
    }
  }, [open])

  function atualizar(m) {
    setModelo(m)
    onAtualizado?.(m)
  }

  async function enviar(arquivo) {
    setProgresso(0)
    setErro('')
    try {
      const registrado = await enviarArquivo(arquivo, { categoria: 'contrato', entidadeTipo: 'modelo_contrato' }, setProgresso)
      atualizar(await api.post('/modelo-contrato/arquivo', { arquivoId: registrado.id }))
      showToast('Modelo de contrato enviado.')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : e.message || 'Falha ao enviar o arquivo.')
    } finally {
      setProgresso(null)
    }
  }

  async function remover() {
    try {
      atualizar(await api.delete('/modelo-contrato/arquivo'))
      showToast('Arquivo do modelo removido.')
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Não foi possível remover.', 'erro')
    }
  }

  async function salvarTexto() {
    setSalvando(true)
    try {
      const m = await api.put('/modelo-contrato/texto', { texto })
      atualizar(m)
      setTexto(m.texto)
      showToast('Texto do modelo salvo.')
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Não foi possível salvar.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  /** Insere {{campo}} onde está o cursor do texto. */
  function inserirCampo(chave) {
    const el = textoRef.current
    const marca = `{{${chave}}}`
    const inicio = el?.selectionStart ?? texto.length
    const fim = el?.selectionEnd ?? texto.length
    const novo = texto.slice(0, inicio) + marca + texto.slice(fim)
    setTexto(novo)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(inicio + marca.length, inicio + marca.length)
    })
  }

  // Análise ao vivo do texto (mesma regra do backend).
  const disponiveis = modelo?.camposDisponiveis ?? []
  const marcados = [...new Set([...texto.matchAll(/\{\{\s*([^{}]+?)\s*\}\}/g)].map((m) => m[1].trim()))]
  const conhecidos = new Set(disponiveis.map((c) => c.chave))
  const desconhecidos = marcados.filter((c) => !conhecidos.has(c))
  const alterado = modelo && texto !== modelo.texto
  const arquivo = modelo?.arquivo

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Modelo de contrato"
      footer={
        <>
          <button type="button" onClick={onClose} className="rounded-btn bg-muted-dark px-4 py-2 text-body font-medium text-[#333] hover:bg-gray-300">
            Fechar
          </button>
          <button
            type="button"
            onClick={salvarTexto}
            disabled={!alterado || salvando}
            className="rounded-btn bg-primary px-4 py-2 text-body font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar texto'}
          </button>
        </>
      }
    >
      <p className="mb-5 flex items-start gap-2 rounded-card bg-primary-light px-3 py-2.5 text-label text-[#335]">
        <IconSparkles size={16} className="mt-0.5 shrink-0 text-primary" />
        A IA do WhatsApp usa este modelo para montar o contrato de cada cliente com os dados que ela coleta na conversa.
      </p>

      {erro && <p role="alert" className="mb-4 rounded-btn border border-red-100 bg-red-50 px-3 py-2 text-label text-danger">{erro}</p>}

      {/* 1. Arquivo */}
      <section>
        <h3 className="text-body font-bold text-[#1a1a1a]">1. Arquivo do seu contrato</h3>
        <p className="mb-3 text-label text-[#777]">O contrato que você já usa, em PDF ou Word. Fica guardado de forma privada.</p>

        {!modelo ? (
          <div className="h-20 animate-pulse rounded-card bg-muted" />
        ) : progresso !== null ? (
          <div className="rounded-card border border-muted-dark p-4">
            <p className="mb-2 text-label text-[#555]">Enviando… {progresso}%</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        ) : arquivo ? (
          <div className="flex flex-col gap-3 rounded-card border border-muted-dark p-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-card ${arquivo.tipoMime === 'application/pdf' ? 'bg-red-50 text-danger' : 'bg-blue-50 text-primary'}`}>
                {arquivo.tipoMime === 'application/pdf' ? <IconFileTypePdf size={24} /> : <IconFileText size={24} />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-body font-semibold text-[#1a1a1a]">{arquivo.nomeOriginal}</p>
                <p className="text-label text-[#999]">
                  {formatarTamanho(arquivo.tamanhoBytes)} · enviado em {new Date(arquivo.criadoEm).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <a href={arquivo.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-btn border border-muted-dark px-2.5 py-1.5 text-label font-medium text-[#333] hover:border-primary hover:text-primary">
                <IconExternalLink size={15} /> Abrir
              </a>
              <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-1 rounded-btn border border-muted-dark px-2.5 py-1.5 text-label font-medium text-[#333] hover:border-primary hover:text-primary">
                <IconRefresh size={15} /> Substituir
              </button>
              <button type="button" onClick={remover} className="inline-flex items-center gap-1 rounded-btn px-2.5 py-1.5 text-label font-medium text-danger hover:bg-red-50">
                <IconTrash size={15} /> Remover
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files?.[0]
              if (f) enviar(f)
            }}
            className="flex w-full flex-col items-center gap-1.5 rounded-card border-2 border-dashed border-muted-dark px-4 py-7 text-center hover:border-primary hover:bg-primary-light"
          >
            <IconUpload size={30} className="text-primary" stroke={1.5} />
            <span className="text-body font-semibold text-[#1a1a1a]">Carregar meu modelo de contrato</span>
            <span className="text-label text-[#999]">PDF ou Word, até 20MB. Arraste aqui ou clique.</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACEITA}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) enviar(f)
          }}
        />
      </section>

      {/* 2. Texto com campos */}
      <section className="mt-6 border-t border-muted-dark pt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-body font-bold text-[#1a1a1a]">2. Campos para a IA preencher</h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Recomendado</span>
        </div>
        <p className="mb-3 text-label text-[#777]">
          Cole o texto do contrato e, no lugar de cada informação do cliente, clique no campo correspondente. A IA troca só esses campos e não mexe
          nas suas cláusulas.
        </p>

        <div className="mb-2 flex flex-wrap gap-1.5">
          {disponiveis.map((c) => {
            const usado = marcados.includes(c.chave)
            return (
              <button
                key={c.chave}
                type="button"
                onClick={() => inserirCampo(c.chave)}
                title={`Ex: ${c.exemplo}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  usado ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-muted-dark bg-surface text-[#555] hover:border-primary hover:text-primary'
                }`}
              >
                {usado && <IconCheck size={11} stroke={3} />} {c.rotulo}
              </button>
            )
          })}
        </div>

        <textarea
          ref={textoRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={12}
          placeholder={'Ex:\nCONTRATANTE: {{cliente_nome}}, CPF {{cliente_cpf_cnpj}}, residente em {{cliente_endereco}}.\nOBJETO: {{pacote_nome}} para o evento de {{evento_data}}, em {{evento_local}}.\nVALOR: {{valor_total}}, com sinal de {{valor_sinal}} via {{forma_pagamento}}.'}
          className="w-full rounded-btn border border-muted-dark bg-surface px-3 py-2.5 font-mono text-[13px] leading-relaxed focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-label">
          <span className="text-[#999]">
            {marcados.length - desconhecidos.length} campo(s) marcado(s){alterado ? ' · alterações não salvas' : ''}
          </span>
          {desconhecidos.length > 0 && (
            <span className="inline-flex items-center gap-1 text-orange-700">
              <IconAlertTriangle size={14} /> Campo não reconhecido: {desconhecidos.map((c) => `{{${c}}}`).join(', ')}
            </span>
          )}
        </div>
      </section>
    </Modal>
  )
}
