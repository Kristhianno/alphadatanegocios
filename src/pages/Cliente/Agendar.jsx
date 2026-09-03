import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarPlus, IconMapPin } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import CalendarioMensal from '../../components/ui/CalendarioMensal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'
const DIAS_JANELA_DISPONIBILIDADE = 90

const CATEGORIAS_MANUTENCAO = [
  { valor: 'preventiva', label: 'Preventiva' },
  { valor: 'corretiva', label: 'Corretiva' },
  { valor: 'emergencia', label: 'Emergência' },
]

// Restrições de horário/local que o backend já valida por vertical
// (server/src/models/Agendamento.ts, Strategy VALIDADORES) — replicadas
// aqui só como guia visual no calendário/inputs, pra não deixar o
// cliente preencher tudo e só então tomar um 400/409. O backend segue
// sendo a fonte da verdade: continua validando tudo de novo no submit.
const RESTRICOES_POR_VERTICAL = {
  confeitaria: { horasAntecedenciaMinima: 24, horaMin: null, horaMax: null, exigeServico: false },
  salao_festas: { horasAntecedenciaMinima: 0, horaMin: null, horaMax: null, exigeServico: true },
  fotografia_video: { horasAntecedenciaMinima: 0, horaMin: '08:00', horaMax: '20:00', exigeServico: false },
  outro: { horasAntecedenciaMinima: 0, horaMin: null, horaMax: null, exigeServico: false },
}

function inicioDoDia(data) {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d
}

function paraChaveData(data) {
  const d = new Date(data)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function FormularioChamado() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tipoManutencao, setTipoManutencao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!tipoManutencao || descricao.trim().length < 5) return
    setEnviando(true)
    try {
      await api.post('/manutencao/chamados', { tipoManutencao, descricao })
      showToast('Chamado aberto com sucesso!')
      navigate('/cliente/minhas-ordens')
    } catch (erro) {
      showToast(erro instanceof ApiError ? erro.message : 'Falha ao abrir o chamado.', 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-4 max-w-xl">
      <div>
        <label className={labelClasse}>Tipo de Manutenção *</label>
        <select required className={inputClasse} value={tipoManutencao} onChange={(e) => setTipoManutencao(e.target.value)}>
          <option value="">Selecione...</option>
          {CATEGORIAS_MANUTENCAO.map((c) => <option key={c.valor} value={c.valor}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClasse}>Descreva o problema *</label>
        <textarea
          required
          minLength={5}
          rows={4}
          className={inputClasse}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Conte com detalhes o que está acontecendo..."
        />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
        <button type="button" onClick={() => navigate('/cliente/dashboard')} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
          <IconCalendarPlus size={18} /> {enviando ? 'Enviando...' : 'Abrir Chamado'}
        </button>
      </div>
    </form>
  )
}

function FormularioAgendamento({ user }) {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const restricoes = RESTRICOES_POR_VERTICAL[user.tipoNegocio] ?? RESTRICOES_POR_VERTICAL.outro
  const localFixoDoNegocio = user.tipoNegocio === 'salao_festas' ? user.enderecoNegocio : null

  const [servicos, setServicos] = useState([])
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState('')
  const [horario, setHorario] = useState(restricoes.horaMin ?? '09:00')
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ocupados, setOcupados] = useState([])

  useEffect(() => {
    api
      .get('/servicos?ativo=true')
      .then(setServicos)
      .catch(() => setServicos([]))
  }, [])

  // Pré-preenche o local com o endereço já cadastrado do cliente — só
  // faz sentido quando o evento não acontece num endereço fixo da
  // empresa (ver localFixoDoNegocio acima, caso do salão de festas).
  useEffect(() => {
    if (localFixoDoNegocio) return
    api
      .get('/clientes/me')
      .then((cliente) => {
        if (!cliente) return
        const partes = [cliente.endereco, cliente.cidade, cliente.estado].filter(Boolean)
        if (partes.length) setEndereco(partes.join(', '))
      })
      .catch(() => {})
  }, [localFixoDoNegocio])

  useEffect(() => {
    const de = new Date()
    const ate = new Date(Date.now() + DIAS_JANELA_DISPONIBILIDADE * 24 * 3_600_000)
    api
      .get(`/agendamentos/disponibilidade?de=${de.toISOString()}&ate=${ate.toISOString()}`)
      .then(setOcupados)
      .catch(() => setOcupados([]))
  }, [])

  const eventosOcupados = useMemo(
    () =>
      ocupados.map((o, i) => ({
        id: `ocupado-${i}`,
        data: paraChaveData(o.inicio),
        hora: new Date(o.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        titulo: 'Ocupado',
      })),
    [ocupados]
  )

  const diaSelecionado = data ? new Date(`${data}T00:00:00`) : null
  const horariosOcupadosNoDia = data ? eventosOcupados.filter((o) => o.data === data) : []

  function desabilitarDia(d) {
    const hoje = inicioDoDia(new Date())
    if (d < hoje) return true
    if (restricoes.horasAntecedenciaMinima > 0) {
      const minimo = inicioDoDia(new Date(Date.now() + restricoes.horasAntecedenciaMinima * 3_600_000))
      if (d < minimo) return true
    }
    return false
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!data) return
    setEnviando(true)
    try {
      await api.post('/agendamentos', {
        clienteId: user.clienteId,
        ...(servicoId && { servicoId }),
        dataHoraInicio: new Date(`${data}T${horario || '09:00'}`).toISOString(),
        ...(endereco && { endereco }),
        ...(observacoes && { observacoes }),
      })
      showToast('Agendamento realizado com sucesso!')
      navigate('/cliente/agendamentos')
    } catch (erro) {
      if (erro instanceof ApiError && erro.codigo === 'CONFLITO') {
        showToast('Esse horário acabou de ser reservado. Escolha outro dia ou horário.', 'erro')
        const de = new Date()
        const ate = new Date(Date.now() + DIAS_JANELA_DISPONIBILIDADE * 24 * 3_600_000)
        api.get(`/agendamentos/disponibilidade?de=${de.toISOString()}&ate=${ate.toISOString()}`).then(setOcupados).catch(() => {})
      } else {
        showToast(erro instanceof ApiError ? erro.message : 'Falha ao criar o agendamento.', 'erro')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-5 max-w-3xl">
      <div>
        <label className={labelClasse}>Serviço {restricoes.exigeServico && '*'}</label>
        <select required={restricoes.exigeServico} className={inputClasse} value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
          <option value="">Selecione...</option>
          {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClasse}>Escolha o dia *</label>
        <CalendarioMensal
          eventos={eventosOcupados}
          corStatus={{}}
          tituloAccessor="titulo"
          onSelecionarEvento={(ev) => {
            if (!desabilitarDia(new Date(`${ev.data}T00:00:00`))) setData(ev.data)
          }}
          onSelecionarDia={(d) => setData(paraChaveData(d))}
          diaSelecionado={diaSelecionado}
          desabilitarDia={desabilitarDia}
        />
        <p className="text-label text-[#999] mt-2">Dias em cinza não atendem a antecedência mínima deste tipo de serviço. Horários marcados em cada dia já estão ocupados.</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4 bg-muted/60 rounded-card p-3">
          <div>
            <label className={labelClasse}>Data escolhida</label>
            <p className="text-body font-semibold text-[#1a1a1a]">{new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <label className={labelClasse}>Horário *</label>
            <input
              required
              type="time"
              min={restricoes.horaMin ?? undefined}
              max={restricoes.horaMax ?? undefined}
              className={inputClasse}
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
          </div>
          {horariosOcupadosNoDia.length > 0 && (
            <p className="col-span-2 text-label text-[#999]">Já ocupado nesse dia: {horariosOcupadosNoDia.map((o) => o.hora).join(', ')}</p>
          )}
        </div>
      )}

      <div>
        <label className={labelClasse}><IconMapPin size={13} className="inline mr-1" />Local</label>
        {localFixoDoNegocio ? (
          <p className="text-body text-[#1a1a1a] bg-muted/60 rounded-input px-3 py-2">{localFixoDoNegocio}</p>
        ) : (
          <input
            className={inputClasse}
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder={user.tipoNegocio === 'salao_festas' ? 'Endereço do seu espaço de festas' : 'Endereço onde o serviço será realizado'}
          />
        )}
      </div>

      <div>
        <label className={labelClasse}>Observações</label>
        <textarea rows={3} className={inputClasse} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Detalhes adicionais..." />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
        <button type="button" onClick={() => navigate('/cliente/dashboard')} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          Cancelar
        </button>
        <button type="submit" disabled={enviando || !data} className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
          <IconCalendarPlus size={18} /> {enviando ? 'Agendando...' : 'Agendar Agora'}
        </button>
      </div>
    </form>
  )
}

export default function Agendar() {
  const { user } = useAuth()
  const { nomeExibido } = useBranding()
  const ehManutencao = user.tipoNegocio === 'manutencao'

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">{ehManutencao ? 'Abrir Novo Chamado' : 'Agendar Novo Serviço'} {nomeExibido}</h1>
      {ehManutencao ? <FormularioChamado /> : <FormularioAgendamento user={user} />}
    </div>
  )
}
