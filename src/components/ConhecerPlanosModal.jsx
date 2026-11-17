import { useEffect, useRef, useState } from 'react'
import { IconCircleCheckFilled, IconLoader2, IconSend, IconX } from '@tabler/icons-react'
import { api, ApiError } from '../services/api'

/** Mensagem que já vem escrita no campo de observações (a pessoa pode editar). */
export const MENSAGEM_PADRAO =
  'Olá! Tenho interesse em conhecer os planos da ALPHADATA (assistente de IA no WhatsApp + sistema de gestão) para o meu negócio de festas e eventos. Podem me enviar a apresentação com os valores?'

const campoClasse =
  'w-full rounded-[8px] border border-[#D9DEE7] bg-white px-3.5 py-3 text-base text-[#1a1a1a] placeholder:text-[#9AA3B2] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-[#0052CC]'
const rotuloClasse = 'mb-1.5 block text-sm font-medium text-[#3A4150]'

/**
 * "Conhecer planos": em vez de mostrar preços na landing, coleta o contato
 * e manda pro dono (banco + planilha + WhatsApp, ver LeadService no backend).
 */
export default function ConhecerPlanosModal({ aberto = true, onFechar }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState(MENSAGEM_PADRAO)
  const [armadilha, setArmadilha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')
  const nomeRef = useRef(null)

  useEffect(() => {
    if (!aberto) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => nomeRef.current?.focus(), 50)
    const aoTeclar = (e) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = overflow
      clearTimeout(t)
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await api.post('/leads', { nome, email, telefone, mensagem, origem: 'conhecer-planos', site: armadilha }, { comAuth: false })
      setEnviado(true)
      setNome('')
      setEmail('')
      setTelefone('')
      setMensagem(MENSAGEM_PADRAO)
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha.detalhes?.[0]?.mensagem ?? falha.message : 'Não foi possível enviar. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B1F44]/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-conhecer-planos"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_24px_60px_rgba(0,20,60,0.35)] sm:max-w-lg sm:rounded-[16px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#EEF1F6] px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0052CC]">Planos ALPHADATA</p>
            <h2 id="titulo-conhecer-planos" className="mt-1 text-xl font-bold text-[#1a1a1a] sm:text-2xl">Conheça os planos</h2>
            <p className="mt-1 text-sm text-[#5B6474]">Deixe seu contato e enviamos a apresentação com os planos e valores.</p>
          </div>
          <button type="button" onClick={onFechar} aria-label="Fechar" className="-mr-1 rounded-full p-2 text-[#7A8394] hover:bg-[#F2F4F8] hover:text-[#1a1a1a]">
            <IconX size={20} />
          </button>
        </div>

        {enviado ? (
          <div className="flex flex-col items-center px-6 py-10 text-center sm:px-8">
            <IconCircleCheckFilled size={56} className="text-[#10B981]" />
            <p className="mt-3 text-lg font-bold text-[#1a1a1a]">Recebemos o seu contato!</p>
            <p className="mt-1 text-sm text-[#5B6474]">Em breve nossa equipe envia a apresentação com os planos.</p>
            <button type="button" onClick={onFechar} className="mt-6 rounded-[8px] bg-[#0052CC] px-6 py-3 text-base font-semibold text-white hover:bg-[#004AAD]">
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-7">
            <div>
              <label htmlFor="cp-nome" className={rotuloClasse}>Nome *</label>
              <input id="cp-nome" ref={nomeRef} required autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className={campoClasse} />
            </div>
            <div>
              <label htmlFor="cp-email" className={rotuloClasse}>E-mail *</label>
              <input id="cp-email" type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={campoClasse} />
            </div>
            <div>
              <label htmlFor="cp-tel" className={rotuloClasse}>
                WhatsApp <span className="font-normal text-[#9AA3B2]">(opcional)</span>
              </label>
              <input id="cp-tel" type="tel" autoComplete="tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 98765-4321" className={campoClasse} />
            </div>
            <div>
              <label htmlFor="cp-msg" className={rotuloClasse}>Observações</label>
              <textarea id="cp-msg" rows={5} value={mensagem} onChange={(e) => setMensagem(e.target.value)} className={`${campoClasse} resize-none leading-relaxed`} />
            </div>
            {/* Campo-armadilha anti-spam: invisível e fora da navegação por teclado. */}
            <input type="text" name="site" value={armadilha} onChange={(e) => setArmadilha(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

            {erro && <p role="alert" className="rounded-[8px] border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{erro}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="flex items-center justify-center gap-2 rounded-[8px] bg-[#10B981] py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#0EA372] disabled:opacity-60"
            >
              {enviando ? <IconLoader2 size={20} className="animate-spin" /> : <IconSend size={19} />}
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
            <p className="pb-1 text-center text-xs text-[#9AA3B2]">Usamos seus dados só para falar com você sobre os planos.</p>
          </form>
        )}
      </div>
    </div>
  )
}
