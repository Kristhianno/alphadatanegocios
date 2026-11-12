import { Children, Fragment, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconCheck, IconChevronDown } from '@tabler/icons-react'

/**
 * Substituto do <select> nativo — o menu do sistema (macOS/Windows) abre
 * POR CIMA do campo e, no modo escuro, fica cinza escuro, sem como mudar
 * por CSS. Este abre ABAIXO do campo (só sobe se não couber), fundo branco.
 *
 * Interface igual à do <select>, pra trocar sem mexer na lógica das telas:
 *   <Selecao value={x} onChange={(e) => setX(e.target.value)} required className="...">
 *     <option value="">Selecione</option>
 *     <option value="a">A</option>
 *   </Selecao>
 * Aceita <option> dentro de fragments/condicionais; option sem `value` usa
 * o próprio texto (como o nativo). Teclado: setas, Home/End, Enter/Espaço,
 * Esc, Tab e digitar a letra inicial. Renderizado num portal (position:
 * fixed), então não é cortado por modais com rolagem.
 */

const ALTURA_MAXIMA = 288
const MARGEM = 8

function textoDe(no) {
  if (no == null || typeof no === 'boolean') return ''
  if (typeof no === 'string' || typeof no === 'number') return String(no)
  if (Array.isArray(no)) return no.map(textoDe).join('')
  if (isValidElement(no)) return textoDe(no.props.children)
  return ''
}

function extrairOpcoes(children) {
  const opcoes = []
  const visitar = (nos) =>
    Children.forEach(nos, (no) => {
      if (!isValidElement(no)) return
      if (no.type === Fragment || no.type === 'optgroup') return visitar(no.props.children)
      if (no.type === 'option') {
        const label = textoDe(no.props.children)
        opcoes.push({ value: no.props.value !== undefined ? String(no.props.value) : label, label, disabled: !!no.props.disabled })
      }
    })
  visitar(children)
  return opcoes
}

const CLASSE_PADRAO = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'

export default function Selecao({ value, onChange, children, className, required, disabled, id, name, placeholder, ...resto }) {
  const opcoes = extrairOpcoes(children)
  const valorAtual = value == null ? '' : String(value)
  const indiceSelecionado = opcoes.findIndex((o) => o.value === valorAtual)
  const selecionada = opcoes[indiceSelecionado]

  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(-1)
  const [posicao, setPosicao] = useState(null)
  const gatilhoRef = useRef(null)
  const listaRef = useRef(null)
  const busca = useRef({ texto: '', ate: 0 })
  const idLista = useId()

  const posicionar = useCallback(() => {
    const el = gatilhoRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const abaixo = window.innerHeight - r.bottom - MARGEM
    const acima = r.top - MARGEM
    const alturaDesejada = Math.min(ALTURA_MAXIMA, opcoes.length * 40 + 8)
    const paraCima = abaixo < Math.min(alturaDesejada, 180) && acima > abaixo
    setPosicao({
      left: Math.max(MARGEM, Math.min(r.left, window.innerWidth - r.width - MARGEM)),
      width: r.width,
      ...(paraCima ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
      maxHeight: Math.max(120, Math.min(ALTURA_MAXIMA, paraCima ? acima : abaixo)),
    })
  }, [opcoes.length])

  const primeiroHabilitado = (de, passo) => {
    for (let i = de; i >= 0 && i < opcoes.length; i += passo) if (!opcoes[i].disabled) return i
    return -1
  }

  function abrir() {
    if (disabled) return
    posicionar()
    setAtivo(indiceSelecionado >= 0 ? indiceSelecionado : primeiroHabilitado(0, 1))
    setAberto(true)
  }

  function fechar(devolverFoco = true) {
    setAberto(false)
    if (devolverFoco) gatilhoRef.current?.focus()
  }

  function selecionar(indice) {
    const opcao = opcoes[indice]
    if (!opcao || opcao.disabled) return
    if (opcao.value !== valorAtual) {
      const alvo = { value: opcao.value, name, id }
      onChange?.({ target: alvo, currentTarget: alvo })
    }
    fechar()
  }

  // Fecha ao clicar fora; reposiciona ao rolar/redimensionar (fecha se o campo sair da tela).
  useEffect(() => {
    if (!aberto) return
    const aoClicarFora = (e) => {
      if (gatilhoRef.current?.contains(e.target) || listaRef.current?.contains(e.target)) return
      fechar(false)
    }
    const aoRolar = (e) => {
      if (listaRef.current?.contains(e.target)) return
      const r = gatilhoRef.current?.getBoundingClientRect()
      if (!r || r.bottom < 0 || r.top > window.innerHeight) return fechar(false)
      posicionar()
    }
    document.addEventListener('pointerdown', aoClicarFora)
    window.addEventListener('scroll', aoRolar, true)
    window.addEventListener('resize', posicionar)
    return () => {
      document.removeEventListener('pointerdown', aoClicarFora)
      window.removeEventListener('scroll', aoRolar, true)
      window.removeEventListener('resize', posicionar)
    }
  }, [aberto, posicionar])

  // Mantém a opção ativa visível ao navegar pelo teclado.
  useLayoutEffect(() => {
    if (!aberto || ativo < 0) return
    listaRef.current?.querySelector(`[data-indice="${ativo}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [aberto, ativo])

  function aoTeclar(e) {
    const tecla = e.key
    if (!aberto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(tecla)) {
        e.preventDefault()
        abrir()
      }
      return
    }
    if (tecla === 'ArrowDown') {
      e.preventDefault()
      const prox = primeiroHabilitado(ativo + 1, 1)
      if (prox >= 0) setAtivo(prox)
    } else if (tecla === 'ArrowUp') {
      e.preventDefault()
      const ant = primeiroHabilitado(ativo - 1, -1)
      if (ant >= 0) setAtivo(ant)
    } else if (tecla === 'Home') {
      e.preventDefault()
      setAtivo(primeiroHabilitado(0, 1))
    } else if (tecla === 'End') {
      e.preventDefault()
      setAtivo(primeiroHabilitado(opcoes.length - 1, -1))
    } else if (tecla === 'Enter' || tecla === ' ') {
      e.preventDefault()
      selecionar(ativo)
    } else if (tecla === 'Escape') {
      e.preventDefault()
      fechar()
    } else if (tecla === 'Tab') {
      fechar(false)
    } else if (tecla.length === 1) {
      // Digitar pula pra opção que começa com o texto (como o nativo).
      const agora = Date.now()
      busca.current = { texto: (agora < busca.current.ate ? busca.current.texto : '') + tecla.toLowerCase(), ate: agora + 600 }
      const achada = opcoes.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(busca.current.texto))
      if (achada >= 0) setAtivo(achada)
    }
  }

  const rotulo = selecionada?.label || placeholder || ''
  const ehVazio = !selecionada || selecionada.value === ''

  // Classes de layout (largura, flex, grid) vão pro contêiner; o resto (borda, padding, fonte) fica no botão.
  const LAYOUT = /^(?:[a-z0-9]+:)?(?:w-|min-w-|max-w-|flex-1|flex-auto|grow|shrink|basis-|self-|col-span|row-span|order-)/
  const tokens = (className || CLASSE_PADRAO).split(/\s+/).filter(Boolean)
  const classesContainer = tokens.filter((t) => LAYOUT.test(t) && t !== 'w-full')
  const larguraTotal = tokens.includes('w-full') || tokens.some((t) => /^(?:[a-z0-9]+:)?(?:w-|flex-1|grow)/.test(t))
  const classesGatilho = tokens.filter((t) => !LAYOUT.test(t)).join(' ')

  return (
    <div className={`relative min-w-0 ${larguraTotal ? '' : 'inline-block'} ${tokens.includes('w-full') ? 'w-full' : ''} ${classesContainer.join(' ')}`}>
      <button
        ref={gatilhoRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={aberto ? idLista : undefined}
        aria-activedescendant={aberto && ativo >= 0 ? `${idLista}-${ativo}` : undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (aberto ? fechar() : abrir())}
        onKeyDown={aoTeclar}
        className={`${classesGatilho} flex w-full items-center justify-between gap-2 bg-surface text-left disabled:cursor-not-allowed disabled:opacity-60`}
        {...resto}
      >
        <span className={`min-w-0 truncate ${ehVazio ? 'text-[#999]' : 'text-[#1a1a1a]'}`}>{rotulo || ' '}</span>
        <IconChevronDown size={16} className={`shrink-0 text-[#888] transition-transform ${aberto ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {/* Validação nativa de "obrigatório" (o balão do navegador aparece aqui quando vazio). */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          name={name}
          value={valorAtual}
          onChange={() => {}}
          onFocus={() => gatilhoRef.current?.focus()}
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px w-full opacity-0"
        />
      )}

      {aberto &&
        posicao &&
        createPortal(
          <ul
            ref={listaRef}
            id={idLista}
            role="listbox"
            aria-labelledby={id}
            style={{ position: 'fixed', ...posicao }}
            className="z-[70] overflow-y-auto overscroll-contain rounded-card border border-muted-dark bg-white py-1 shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
          >
            {opcoes.map((opcao, i) => {
              const marcada = i === indiceSelecionado
              return (
                <li
                  key={`${opcao.value}-${i}`}
                  id={`${idLista}-${i}`}
                  data-indice={i}
                  role="option"
                  aria-selected={marcada}
                  aria-disabled={opcao.disabled || undefined}
                  onPointerEnter={() => !opcao.disabled && setAtivo(i)}
                  onClick={() => selecionar(i)}
                  className={`flex min-h-[40px] cursor-pointer items-center justify-between gap-3 px-3 py-2 text-body ${
                    opcao.disabled ? 'cursor-not-allowed text-[#bbb]' : i === ativo ? 'bg-primary-light text-[#1a1a1a]' : 'text-[#333]'
                  } ${marcada ? 'font-semibold text-primary' : ''} ${opcao.value === '' && !marcada ? 'text-[#999]' : ''}`}
                >
                  <span className="min-w-0 truncate">{opcao.label}</span>
                  {marcada && <IconCheck size={16} className="shrink-0 text-primary" aria-hidden="true" />}
                </li>
              )
            })}
          </ul>,
          document.body,
        )}
    </div>
  )
}
