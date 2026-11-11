import { useMemo, useState } from 'react'
import {
  IconArrowLeft, IconArrowRight, IconCheck, IconConfetti, IconLoader2, IconLock, IconPlus,
} from '@tabler/icons-react'
import { ICONE_NICHO as ICONES_NICHOS } from '../data/nichos'

/** Ícone por `id` de nicho; 'outro' ganha um "+". Sem entrada = confete. */
const ICONE_NICHO = { ...ICONES_NICHOS, outro: IconPlus }

const NOME_CAMPO = 'nicho-festas'

/** Junta os cards por `grupo`, na ordem em que cada grupo aparece; 'outro' (sem grupo) fica de fora, renderizado por último. */
function agruparPorGrupo(opcoes) {
  const grupos = []
  const porNome = new Map()
  for (const opcao of opcoes) {
    if (opcao.tipoNegocio === 'outro') continue
    const nome = opcao.grupo ?? 'Outros'
    if (!porNome.has(nome)) {
      const grupo = { nome, opcoes: [] }
      porNome.set(nome, grupo)
      grupos.push(grupo)
    }
    porNome.get(nome).opcoes.push(opcao)
  }
  return grupos
}

function CartaoNicho({ opcao, selecionado, desabilitado, onSelecionar }) {
  const Icone = ICONE_NICHO[opcao.id] ?? IconConfetti
  const outro = opcao.tipoNegocio === 'outro'
  return (
    <label
      className={`group relative flex items-start gap-3 rounded-card border p-3 sm:p-3.5 cursor-pointer transition-all select-none
        has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2
        ${selecionado ? 'border-primary bg-primary-light shadow-card' : `${outro ? 'border-dashed' : ''} border-muted-dark bg-surface hover:border-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] hover:shadow-card`}
        ${desabilitado ? 'pointer-events-none opacity-60' : ''}`}
    >
      <input
        type="radio"
        name={NOME_CAMPO}
        value={opcao.id}
        checked={selecionado}
        onChange={() => onSelecionar(opcao)}
        disabled={desabilitado}
        className="sr-only"
      />
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-card transition-colors ${
          selecionado ? 'bg-primary text-white' : 'bg-primary-light text-primary group-hover:bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]'
        }`}
        aria-hidden="true"
      >
        <Icone size={22} stroke={1.75} />
      </span>
      <span className="min-w-0 flex-1 pr-5">
        <span className="block text-body font-semibold text-[#1a1a1a] leading-snug">{opcao.nome}</span>
        {opcao.subtitulo && <span className="mt-0.5 block text-label text-[#777] leading-snug line-clamp-2">{opcao.subtitulo}</span>}
      </span>
      <span
        className={`absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
          selecionado ? 'border-primary bg-primary text-white scale-100' : 'border-muted-dark bg-surface text-transparent'
        }`}
        aria-hidden="true"
      >
        <IconCheck size={13} stroke={3} />
      </span>
    </label>
  )
}

/**
 * Passo "Seu negócio" do onboarding: escolhe o nicho de Festas & Eventos.
 * Seleção e confirmação são separadas de propósito — a escolha é
 * irreversível (define o template técnico da conta), então um clique
 * só seleciona e mostra a prévia do menu; quem grava é "Continuar".
 */
export default function SeletorNicho({ opcoes, carregando, enviandoId, erro, onConfirmar, onVoltar }) {
  const [selecionado, setSelecionado] = useState(null)
  const [descricaoOutro, setDescricaoOutro] = useState('')

  const grupos = useMemo(() => agruparPorGrupo(opcoes), [opcoes])
  const opcaoOutro = opcoes.find((o) => o.tipoNegocio === 'outro')
  const enviando = !!enviandoId
  const ehOutro = selecionado?.tipoNegocio === 'outro'
  const podeContinuar = !!selecionado && !enviando && (!ehOutro || descricaoOutro.trim().length >= 2)

  function confirmar(e) {
    e.preventDefault()
    if (!podeContinuar) return
    onConfirmar(selecionado, ehOutro ? descricaoOutro.trim() : undefined)
  }

  return (
    <form onSubmit={confirmar} className="flex flex-col">
      <span className="self-start inline-flex items-center gap-1.5 text-label font-semibold uppercase tracking-wide text-primary bg-primary-light rounded-btn px-2.5 py-1 mb-3">
        <IconConfetti size={14} /> Festas & Eventos
      </span>
      <h1 className="text-[22px] sm:text-[26px] font-bold leading-tight text-[#1a1a1a] mb-1.5">O que você faz em festas e eventos?</h1>
      <p className="text-body text-[#666] mb-6 max-w-xl">
        Escolha o seu tipo de negócio. A gente monta o menu e os módulos certos pra você começar.
      </p>

      {carregando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5" aria-busy="true" aria-label="Carregando opções">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-[74px] rounded-card bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <fieldset className="flex flex-col gap-5" disabled={enviando}>
          <legend className="sr-only">Tipo de negócio</legend>
          {grupos.map((grupo) => (
            <div key={grupo.nome}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#999] mb-2">{grupo.nome}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {grupo.opcoes.map((opcao) => (
                  <CartaoNicho
                    key={opcao.id}
                    opcao={opcao}
                    selecionado={selecionado?.id === opcao.id}
                    desabilitado={enviando}
                    onSelecionar={setSelecionado}
                  />
                ))}
              </div>
            </div>
          ))}

          {opcaoOutro && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#999] mb-2">Não achou o seu?</p>
              <CartaoNicho opcao={opcaoOutro} selecionado={ehOutro} desabilitado={enviando} onSelecionar={setSelecionado} />
              {ehOutro && (
                <div className="mt-2.5">
                  <label htmlFor="descricao-outro" className="text-label text-[#666] block mb-1">
                    Que serviço você oferece?
                  </label>
                  <input
                    id="descricao-outro"
                    autoFocus
                    value={descricaoOutro}
                    onChange={(e) => setDescricaoOutro(e.target.value)}
                    placeholder="Ex: Buffet, DJ, Cerimonial, Convites..."
                    maxLength={60}
                    className="w-full rounded-input border border-muted-dark px-3 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )}
        </fieldset>
      )}

      {/* Prévia do que a escolha monta — vem do menu real do template (GET /config/tipos-negocio-disponiveis). */}
      <div aria-live="polite">
        {selecionado?.modulos?.length > 0 && (
          <div className="mt-5 rounded-card border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-primary-light p-4">
            <p className="text-label text-[#555] mb-2">
              Com <span className="font-semibold text-[#1a1a1a]">{ehOutro && descricaoOutro.trim() ? descricaoOutro.trim() : selecionado.nome}</span>, seu
              menu vai ter:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selecionado.modulos.map((modulo) => (
                <span key={modulo} className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-label font-medium text-primary shadow-card">
                  <IconCheck size={12} stroke={3} /> {modulo}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {erro && (
        <p role="alert" className="mt-4 rounded-card bg-red-50 px-3 py-2 text-label text-danger">
          {erro}
        </p>
      )}

      {/* Rodapé fixo no fim da tela enquanto o card está visível — no celular o botão nunca fica escondido lá embaixo. */}
      <div className="sticky bottom-0 -mx-5 sm:-mx-10 mt-6 px-5 sm:px-10 py-3 sm:py-4 bg-surface/95 backdrop-blur-sm border-t border-muted-dark flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between rounded-b-card">
        <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
          {onVoltar && (
            <button type="button" onClick={onVoltar} disabled={enviando} className="flex items-center gap-1.5 text-label text-primary hover:underline disabled:opacity-50">
              <IconArrowLeft size={14} /> Voltar
            </button>
          )}
          <span className="flex items-center gap-1 text-label text-[#999]">
            <IconLock size={13} /> Só pode ser escolhido uma vez
          </span>
        </div>
        <button
          type="submit"
          disabled={!podeContinuar}
          className="flex items-center justify-center gap-2 rounded-btn bg-primary px-5 py-3 sm:py-2.5 text-body font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? (
            <>
              <IconLoader2 size={18} className="animate-spin" /> Configurando...
            </>
          ) : selecionado ? (
            <>
              Continuar com {ehOutro ? 'outro serviço' : selecionado.nome} <IconArrowRight size={18} />
            </>
          ) : (
            'Escolha uma opção para continuar'
          )}
        </button>
      </div>
    </form>
  )
}
