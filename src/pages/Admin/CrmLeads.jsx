import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import {
  IconAlertTriangle, IconBrandInstagram, IconBrandWhatsapp, IconCalendar, IconCheck, IconClock, IconLayoutKanban,
  IconLock, IconMoodSad, IconPhone, IconPhoneCall, IconPlus, IconSearch, IconTrash, IconTrophy, IconUserShare,
  IconUsersGroup, IconWorld,
} from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import { temCrm } from '../../data/planos'
import { diasRestantesTrial } from '../../utils/trial'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Selecao from '../../components/ui/Selecao'

const ETAPAS = [
  { id: 'novo', titulo: 'Novo lead', descricao: 'Chegou e ainda não foi atendido', cor: 'bg-blue-500', claro: 'bg-blue-50 text-blue-700' },
  { id: 'primeiro_contato', titulo: 'Primeiro contato', descricao: 'Já conversou, passou orçamento', cor: 'bg-violet-500', claro: 'bg-violet-50 text-violet-700' },
  { id: 'follow_up', titulo: 'Follow-up', descricao: 'Aguardando resposta do cliente', cor: 'bg-orange-500', claro: 'bg-orange-50 text-orange-700' },
  { id: 'concluido', titulo: 'Concluído', descricao: 'Fechou ou não fechou', cor: 'bg-emerald-500', claro: 'bg-emerald-50 text-emerald-700' },
]

const ORIGENS = {
  whatsapp: { label: 'WhatsApp', icon: IconBrandWhatsapp },
  instagram: { label: 'Instagram', icon: IconBrandInstagram },
  indicacao: { label: 'Indicação', icon: IconUserShare },
  site: { label: 'Site', icon: IconWorld },
  telefone: { label: 'Telefone', icon: IconPhone },
  outro: { label: 'Outro', icon: IconUsersGroup },
}

/** Mesma régua do backend (CrmService.DIAS_ALERTA_FOLLOW_UP). */
const DIAS_ALERTA_FOLLOW_UP = 3
const DIA_MS = 24 * 60 * 60 * 1000

function diasSemContato(lead) {
  const referencia = new Date(lead.ultimoContatoEm ?? lead.criadoEm).getTime()
  return Math.floor((Date.now() - referencia) / DIA_MS)
}

function paradoNoFollowUp(lead) {
  return lead.etapa === 'follow_up' && diasSemContato(lead) > DIAS_ALERTA_FOLLOW_UP
}

function formatarDataEvento(iso) {
  if (!iso) return null
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano.slice(2)}`
}

function formatarDinheiro(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

/** wa.me exige DDI; número BR com DDD (10/11 dígitos) ganha o 55. */
function linkWhatsapp(telefone) {
  const digitos = (telefone ?? '').replace(/\D/g, '')
  if (!digitos) return null
  return `https://wa.me/${digitos.length <= 11 ? `55${digitos}` : digitos}`
}

/** Posição entre os vizinhos do ponto onde o card caiu (lista da coluna SEM o card arrastado). */
function posicaoEntre(lista, indice) {
  const anterior = lista[indice - 1]?.posicao
  const proximo = lista[indice]?.posicao
  if (anterior == null && proximo == null) return 0
  if (anterior == null) return proximo - 1
  if (proximo == null) return anterior + 1
  return (anterior + proximo) / 2
}

const FORM_VAZIO = { nome: '', telefone: '', email: '', tipoEvento: '', dataEvento: '', convidados: '', valorEstimado: '', origem: 'whatsapp', observacoes: '' }

function paraForm(lead) {
  if (!lead) return FORM_VAZIO
  return {
    nome: lead.nome ?? '',
    telefone: lead.telefone ?? '',
    email: lead.email ?? '',
    tipoEvento: lead.tipoEvento ?? '',
    dataEvento: lead.dataEvento ?? '',
    convidados: lead.convidados ?? '',
    valorEstimado: lead.valorEstimado ?? '',
    origem: lead.origem ?? 'whatsapp',
    observacoes: lead.observacoes ?? '',
  }
}

function paraApi(form) {
  const numero = (v) => (v === '' || v == null ? null : Number(v))
  return {
    nome: form.nome,
    telefone: form.telefone,
    email: form.email,
    tipoEvento: form.tipoEvento,
    dataEvento: form.dataEvento,
    convidados: numero(form.convidados),
    valorEstimado: numero(form.valorEstimado),
    origem: form.origem,
    observacoes: form.observacoes,
  }
}

const campoClasse = 'w-full rounded-btn border border-muted-dark bg-surface px-3 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'
const rotuloClasse = 'block mb-1 text-label font-medium text-[#444]'

function CardLead({ lead, indice, onAbrir }) {
  const origem = ORIGENS[lead.origem] ?? ORIGENS.outro
  const parado = paradoNoFollowUp(lead)
  const whatsapp = linkWhatsapp(lead.telefone)
  return (
    <Draggable draggableId={lead.id} index={indice}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onAbrir(lead)}
          className={`group rounded-card border bg-surface p-3 text-left shadow-card transition-shadow cursor-grab active:cursor-grabbing hover:shadow-cardHover ${
            snapshot.isDragging ? 'ring-2 ring-primary shadow-cardHover rotate-1' : parado ? 'border-orange-300' : 'border-muted-dark'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-body font-semibold text-[#1a1a1a] leading-snug break-words">{lead.nome}</p>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Abrir WhatsApp de ${lead.nome}`}
                className="shrink-0 rounded-full p-1 text-[#25A244] hover:bg-green-50"
              >
                <IconBrandWhatsapp size={18} />
              </a>
            )}
          </div>

          {(lead.tipoEvento || lead.dataEvento) && (
            <p className="mt-1 flex items-center gap-1 text-label text-[#666]">
              <IconCalendar size={13} className="shrink-0" />
              <span className="truncate">
                {[lead.tipoEvento, formatarDataEvento(lead.dataEvento)].filter(Boolean).join(' · ')}
              </span>
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-[#555]">
              <origem.icon size={12} /> {origem.label}
            </span>
            {lead.valorEstimado != null && (
              <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary">{formatarDinheiro(lead.valorEstimado)}</span>
            )}
            {lead.etapa === 'concluido' && lead.resultado === 'ganho' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <IconTrophy size={12} /> Fechou
              </span>
            )}
            {lead.etapa === 'concluido' && lead.resultado === 'perdido' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                <IconMoodSad size={12} /> Não fechou
              </span>
            )}
          </div>

          {parado && (
            <p className="mt-2 flex items-center gap-1 rounded-btn bg-orange-50 px-2 py-1 text-[11px] font-semibold text-orange-700">
              <IconAlertTriangle size={13} /> Sem resposta há {diasSemContato(lead)} dias
            </p>
          )}
        </div>
      )}
    </Draggable>
  )
}

function ConviteCompleto({ user }) {
  const emTeste = diasRestantesTrial(user?.trialTerminaEm) != null
  return (
    <div className="mx-auto max-w-2xl rounded-card bg-surface p-6 sm:p-10 text-center shadow-card">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary">
        <IconLock size={28} />
      </span>
      <h1 className="text-h1 text-[#1a1a1a]">CRM de Leads é do plano Completo</h1>
      <p className="mt-2 text-body text-[#666]">Acompanhe cada contato até fechar a festa, sem deixar nenhum cliente esfriar.</p>
      <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2.5 text-left">
        {[
          'Kanban com todos os leads: Novo, Primeiro contato, Follow-up e Concluído',
          `Alerta de follow-up quando o cliente fica ${DIAS_ALERTA_FOLLOW_UP} dias sem resposta`,
          'Funil de vendas no dashboard, com quantos fecharam',
        ].map((texto) => (
          <li key={texto} className="flex items-start gap-2 text-body text-[#333]">
            <IconCheck size={18} className="mt-0.5 shrink-0 text-primary" /> {texto}
          </li>
        ))}
      </ul>
      <Link
        to="/admin/configuracoes"
        className="mt-7 inline-flex items-center justify-center rounded-btn bg-primary px-6 py-3 text-body font-semibold text-white hover:bg-primary-dark"
      >
        Mudar para o plano Completo
      </Link>
      {emTeste && <p className="mt-2 text-label text-[#999]">No teste grátis a troca é na hora, sem cartão, em Configurações.</p>}
    </div>
  )
}

export default function CrmLeads() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const liberado = temCrm(user)

  const [leads, setLeads] = useState([])
  const [carregando, setCarregando] = useState(liberado)
  const [erro, setErro] = useState('')
  const [bloqueado, setBloqueado] = useState(!liberado)
  const [busca, setBusca] = useState('')

  const [editando, setEditando] = useState(null) // null = fechado; {} = novo; lead = edição
  const [form, setForm] = useState(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const [confirmarExclusao, setConfirmarExclusao] = useState(false)

  const carregar = useCallback(async () => {
    try {
      setLeads(await api.get('/crm/leads'))
      setErro('')
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'PLANO_INSUFICIENTE') setBloqueado(true)
      else setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar os leads.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (liberado) carregar()
  }, [liberado, carregar])

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const ordenados = [...leads].sort((a, b) => a.posicao - b.posicao)
    if (!termo) return ordenados
    return ordenados.filter((l) => [l.nome, l.telefone, l.tipoEvento, l.email].some((c) => c?.toLowerCase().includes(termo)))
  }, [leads, busca])

  const porEtapa = useMemo(() => Object.fromEntries(ETAPAS.map((e) => [e.id, visiveis.filter((l) => l.etapa === e.id)])), [visiveis])
  const emAndamento = leads.filter((l) => l.etapa !== 'concluido').length
  const parados = leads.filter(paradoNoFollowUp).length
  const ganhos = leads.filter((l) => l.etapa === 'concluido' && l.resultado === 'ganho').length

  if (bloqueado) return <ConviteCompleto user={user} />

  async function aoSoltar({ source, destination, draggableId }) {
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const destino = porEtapa[destination.droppableId].filter((l) => l.id !== draggableId)
    const posicao = posicaoEntre(destino, destination.index)
    const etapa = destination.droppableId
    const anterior = leads

    setLeads((lista) => lista.map((l) => (l.id === draggableId ? { ...l, etapa, posicao, ...(etapa !== 'concluido' && { resultado: null }) } : l)))
    try {
      const atualizado = await api.post(`/crm/leads/${draggableId}/mover`, { etapa, posicao })
      setLeads((lista) => lista.map((l) => (l.id === atualizado.id ? atualizado : l)))
    } catch (e) {
      setLeads(anterior)
      showToast(e instanceof ApiError ? e.message : 'Não foi possível mover o lead.', 'erro')
    }
  }

  function abrir(lead) {
    setEditando(lead ?? {})
    setForm(paraForm(lead))
    setErroForm('')
  }

  function fechar() {
    setEditando(null)
    setConfirmarExclusao(false)
  }

  async function salvar(e) {
    e.preventDefault()
    setSalvando(true)
    setErroForm('')
    try {
      if (editando?.id) {
        const atualizado = await api.patch(`/crm/leads/${editando.id}`, paraApi(form))
        setLeads((lista) => lista.map((l) => (l.id === atualizado.id ? atualizado : l)))
        showToast('Lead atualizado.')
      } else {
        const criado = await api.post('/crm/leads', paraApi(form))
        setLeads((lista) => [criado, ...lista])
        showToast('Lead adicionado em "Novo lead".')
      }
      fechar()
    } catch (erro) {
      const detalhe = erro instanceof ApiError ? erro.detalhes?.[0]?.mensagem : null
      setErroForm(detalhe ?? (erro instanceof ApiError ? erro.message : 'Não foi possível salvar.'))
    } finally {
      setSalvando(false)
    }
  }

  async function acaoNoLead(caminho, corpo, mensagem) {
    try {
      const atualizado = corpo === undefined ? await api.post(caminho, {}) : await api.patch(caminho, corpo)
      setLeads((lista) => lista.map((l) => (l.id === atualizado.id ? atualizado : l)))
      setEditando(atualizado)
      showToast(mensagem)
    } catch (erro) {
      showToast(erro instanceof ApiError ? erro.message : 'Não foi possível concluir a ação.', 'erro')
    }
  }

  async function excluir() {
    try {
      await api.delete(`/crm/leads/${editando.id}`)
      setLeads((lista) => lista.filter((l) => l.id !== editando.id))
      showToast('Lead excluído.')
      fechar()
    } catch (erro) {
      showToast(erro instanceof ApiError ? erro.message : 'Não foi possível excluir.', 'erro')
    }
  }

  const alterar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  const leadAberto = editando?.id ? leads.find((l) => l.id === editando.id) ?? editando : null

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <IconLayoutKanban size={28} className="text-primary shrink-0" />
          <div>
            <h1 className="text-h1 text-primary leading-tight">CRM de Leads</h1>
            <p className="text-label text-[#999]">Arraste os cards conforme a conversa avança.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <IconSearch size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar lead"
              aria-label="Buscar lead"
              className="w-full rounded-btn border border-muted-dark bg-surface py-2.5 pl-9 pr-3 text-body focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => abrir(null)}
            className="flex shrink-0 items-center gap-1.5 rounded-btn bg-primary px-4 py-2.5 text-body font-semibold text-white hover:bg-primary-dark"
          >
            <IconPlus size={18} /> <span className="hidden sm:inline">Novo lead</span><span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {!carregando && !erro && leads.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-surface px-3 py-1.5 text-label shadow-card"><b className="text-[#1a1a1a]">{emAndamento}</b> em andamento</span>
          {parados > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-label font-semibold text-orange-700 shadow-card">
              <IconAlertTriangle size={14} /> {parados} parado{parados > 1 ? 's' : ''} no follow-up
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-label font-semibold text-emerald-700 shadow-card">
            <IconTrophy size={14} /> {ganhos} fechado{ganhos === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {erro && (
        <div role="alert" className="rounded-card border border-red-100 bg-red-50 px-4 py-3 text-body text-danger">
          {erro}{' '}
          <button type="button" onClick={() => { setCarregando(true); carregar() }} className="font-semibold underline">Tentar de novo</button>
        </div>
      )}

      {carregando ? (
        <div className="flex gap-4 overflow-hidden">
          {ETAPAS.map((e) => <div key={e.id} className="h-80 w-72 shrink-0 animate-pulse rounded-card bg-muted-dark/60" />)}
        </div>
      ) : (
        !erro && (
          <DragDropContext onDragEnd={aoSoltar}>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 md:snap-none">
              {ETAPAS.map((etapa) => {
                const cards = porEtapa[etapa.id]
                return (
                  <section key={etapa.id} className="flex w-[85vw] max-w-[300px] shrink-0 snap-start flex-col sm:w-72 xl:flex-1 xl:max-w-none" aria-label={etapa.titulo}>
                    <header className="mb-2 px-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${etapa.cor}`} aria-hidden="true" />
                        <h2 className="text-body font-bold text-[#1a1a1a]">{etapa.titulo}</h2>
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${etapa.claro}`}>{cards.length}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#999]">{etapa.descricao}</p>
                    </header>
                    <Droppable droppableId={etapa.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex min-h-[160px] flex-1 flex-col gap-2 rounded-card p-2 transition-colors ${
                            snapshot.isDraggingOver ? 'bg-primary-light' : 'bg-muted-dark/40'
                          }`}
                        >
                          {cards.map((lead, i) => <CardLead key={lead.id} lead={lead} indice={i} onAbrir={abrir} />)}
                          {provided.placeholder}
                          {cards.length === 0 && !snapshot.isDraggingOver && (
                            <p className="px-2 py-6 text-center text-label text-[#999]">
                              {etapa.id === 'novo' && !busca ? 'Nenhum lead novo. Clique em "Novo lead" para adicionar.' : 'Arraste um card pra cá'}
                            </p>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </section>
                )
              })}
            </div>
          </DragDropContext>
        )
      )}

      <Modal
        open={editando !== null}
        onClose={fechar}
        title={leadAberto ? 'Lead' : 'Novo lead'}
        footer={
          <>
            {leadAberto && (
              <button
                type="button"
                onClick={() => setConfirmarExclusao(true)}
                className="mr-auto flex items-center gap-1.5 rounded-btn px-3 py-2 text-body text-danger hover:bg-red-50"
              >
                <IconTrash size={17} /> Excluir
              </button>
            )}
            <button type="button" onClick={fechar} className="rounded-btn bg-muted-dark px-4 py-2 text-body font-medium text-[#333] hover:bg-gray-300">
              Cancelar
            </button>
            <button
              type="submit"
              form="form-lead"
              disabled={salvando}
              className="rounded-btn bg-primary px-4 py-2 text-body font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : leadAberto ? 'Salvar' : 'Adicionar lead'}
            </button>
          </>
        }
      >
        {leadAberto && (
          <div className="mb-5 flex flex-col gap-3 rounded-card bg-muted p-3">
            <div className="flex flex-wrap items-center gap-2 text-label text-[#666]">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${ETAPAS.find((e) => e.id === leadAberto.etapa)?.claro}`}>
                {ETAPAS.find((e) => e.id === leadAberto.etapa)?.titulo}
              </span>
              <span className="inline-flex items-center gap-1">
                <IconClock size={14} />
                {leadAberto.ultimoContatoEm ? `Último contato há ${diasSemContato(leadAberto)} dia(s)` : 'Nenhum contato registrado'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => acaoNoLead(`/crm/leads/${leadAberto.id}/contato`, undefined, 'Contato registrado.')}
                className="inline-flex items-center gap-1.5 rounded-btn border border-muted-dark bg-surface px-3 py-1.5 text-label font-medium text-[#333] hover:border-primary"
              >
                <IconPhoneCall size={15} /> Registrar contato agora
              </button>
              {linkWhatsapp(leadAberto.telefone) && (
                <a
                  href={linkWhatsapp(leadAberto.telefone)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-btn border border-muted-dark bg-surface px-3 py-1.5 text-label font-medium text-[#25A244] hover:border-[#25A244]"
                >
                  <IconBrandWhatsapp size={15} /> Abrir WhatsApp
                </a>
              )}
            </div>
            {leadAberto.etapa === 'concluido' && (
              <div>
                <p className="mb-1.5 text-label font-medium text-[#444]">Resultado</p>
                <div className="flex gap-2">
                  {[
                    ['ganho', 'Fechou', IconTrophy, 'border-emerald-500 bg-emerald-50 text-emerald-700'],
                    ['perdido', 'Não fechou', IconMoodSad, 'border-gray-400 bg-gray-100 text-gray-700'],
                  ].map(([valor, rotulo, Icone, ativo]) => (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={leadAberto.resultado === valor}
                      onClick={() => acaoNoLead(`/crm/leads/${leadAberto.id}`, { resultado: leadAberto.resultado === valor ? null : valor }, 'Resultado salvo.')}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-btn border px-3 py-2 text-label font-semibold ${
                        leadAberto.resultado === valor ? ativo : 'border-muted-dark bg-surface text-[#666] hover:bg-muted'
                      }`}
                    >
                      <Icone size={15} /> {rotulo}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <form id="form-lead" onSubmit={salvar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="lead-nome" className={rotuloClasse}>Nome *</label>
            <input id="lead-nome" required autoFocus={!leadAberto} value={form.nome} onChange={alterar('nome')} placeholder="Ex: Ana Souza" className={campoClasse} />
          </div>
          <div>
            <label htmlFor="lead-telefone" className={rotuloClasse}>WhatsApp / telefone</label>
            <input id="lead-telefone" inputMode="tel" value={form.telefone} onChange={alterar('telefone')} placeholder="(11) 98765-4321" className={campoClasse} />
          </div>
          <div>
            <label htmlFor="lead-email" className={rotuloClasse}>E-mail</label>
            <input id="lead-email" type="email" value={form.email} onChange={alterar('email')} placeholder="cliente@email.com" className={campoClasse} />
          </div>
          <div>
            <label htmlFor="lead-tipo" className={rotuloClasse}>Tipo de evento</label>
            <input id="lead-tipo" value={form.tipoEvento} onChange={alterar('tipoEvento')} placeholder="Ex: Aniversário infantil" className={campoClasse} />
          </div>
          <div>
            <label htmlFor="lead-data" className={rotuloClasse}>Data do evento</label>
            <input id="lead-data" type="date" value={form.dataEvento} onChange={alterar('dataEvento')} className={campoClasse} />
          </div>
          <div>
            <label htmlFor="lead-convidados" className={rotuloClasse}>Convidados</label>
            <input id="lead-convidados" type="number" min="0" inputMode="numeric" value={form.convidados} onChange={alterar('convidados')} placeholder="Ex: 80" className={campoClasse} />
          </div>
          <div>
            <label htmlFor="lead-valor" className={rotuloClasse}>Valor estimado (R$)</label>
            <input id="lead-valor" type="number" min="0" step="0.01" inputMode="decimal" value={form.valorEstimado} onChange={alterar('valorEstimado')} placeholder="Ex: 3500" className={campoClasse} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lead-origem" className={rotuloClasse}>De onde veio</label>
            <Selecao id="lead-origem" value={form.origem} onChange={alterar('origem')} className={campoClasse}>
              {Object.entries(ORIGENS).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
            </Selecao>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="lead-obs" className={rotuloClasse}>Observações</label>
            <textarea id="lead-obs" rows={3} value={form.observacoes} onChange={alterar('observacoes')} placeholder="O que o cliente pediu, orçamento enviado, próximos passos..." className={campoClasse} />
          </div>
          {erroForm && <p role="alert" className="sm:col-span-2 rounded-btn border border-red-100 bg-red-50 px-3 py-2 text-label text-danger">{erroForm}</p>}
        </form>
      </Modal>

      <ConfirmModal
        open={confirmarExclusao}
        onClose={() => setConfirmarExclusao(false)}
        onConfirm={excluir}
        titulo="Excluir lead?"
        mensagem={`"${leadAberto?.nome ?? ''}" sai do CRM de vez.`}
        textoConfirmar="Excluir"
        corConfirmar="bg-red-600 hover:bg-red-700"
      />
    </div>
  )
}
