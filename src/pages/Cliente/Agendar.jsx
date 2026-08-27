import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarPlus } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useBranding } from '../../hooks/useBranding'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

const CATEGORIAS_MANUTENCAO = [
  { valor: 'preventiva', label: 'Preventiva' },
  { valor: 'corretiva', label: 'Corretiva' },
  { valor: 'emergencia', label: 'Emergência' },
]

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
  const [servicos, setServicos] = useState([])
  const [servicoId, setServicoId] = useState('')
  const [data, setData] = useState('')
  const [horario, setHorario] = useState('')
  const [endereco, setEndereco] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    api
      .get('/servicos?ativo=true')
      .then(setServicos)
      .catch(() => setServicos([]))
  }, [])

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
      showToast(erro instanceof ApiError ? erro.message : 'Falha ao criar o agendamento.', 'erro')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-card shadow-card p-5 flex flex-col gap-4 max-w-xl">
      <div>
        <label className={labelClasse}>Serviço</label>
        <select className={inputClasse} value={servicoId} onChange={(e) => setServicoId(e.target.value)}>
          <option value="">Selecione...</option>
          {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasse}>Data Desejada *</label>
          <input required type="date" className={inputClasse} value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div>
          <label className={labelClasse}>Horário</label>
          <input type="time" className={inputClasse} value={horario} onChange={(e) => setHorario(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={labelClasse}>Endereço</label>
        <input className={inputClasse} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
      </div>
      <div>
        <label className={labelClasse}>Observações</label>
        <textarea rows={3} className={inputClasse} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Detalhes adicionais..." />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
        <button type="button" onClick={() => navigate('/cliente/dashboard')} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
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
