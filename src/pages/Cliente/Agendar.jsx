import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendarPlus } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'
import { useClientes } from '../../hooks/useClientes'
import { useOrdensServico } from '../../hooks/useOrdensServico'
import { useToast } from '../../hooks/useToast'
import { TIPOS_SERVICO } from '../../data/mock'

const OPCOES_SERVICO = [
  'Limpeza Residencial',
  'Limpeza Comercial',
  'Manutenção Predial',
  'Serviço de HVAC',
  'Encanamento',
  'Paisagismo',
  'Outro',
]

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function Agendar() {
  const { user } = useAuth()
  const { getById } = useClientes()
  const { addOrdem } = useOrdensServico()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const cliente = getById(user.clienteId)

  const [dados, setDados] = useState({
    tipoServico: '',
    dataDesejada: '',
    horario: '',
    repetir: 'Não',
    descricao: '',
    endereco: cliente?.endereco ?? '',
    telefone: cliente?.telefone ?? '',
    email: user.email,
  })

  function set(campo, valor) {
    setDados((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!dados.tipoServico || !dados.dataDesejada) return

    const tipoRef = TIPOS_SERVICO.find((t) => dados.tipoServico.includes(t.nome.replace('Serviço de ', '')))
    const nova = addOrdem({
      clienteId: user.clienteId,
      clienteNome: cliente?.nome ?? user.nome,
      tecnicoId: null,
      tecnicoNome: null,
      tipoServicoId: tipoRef?.id ?? 'reparos-gerais',
      tipoServico: dados.tipoServico,
      categoria: tipoRef?.categoria ?? 'geral',
      descricao: dados.descricao,
      dataAgendada: dados.dataDesejada,
      hora: dados.horario || '09:00',
      endereco: dados.endereco,
      valor: tipoRef ? Math.round((tipoRef.min + tipoRef.max) / 2) : 200,
      prioridade: 'Normal',
      notasInternas: dados.repetir !== 'Não' ? `Repetição: ${dados.repetir}` : '',
    })

    showToast(`Agendamento realizado! Número: #${nova.id}`)
    navigate('/cliente/minhas-ordens')
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <h1 className="text-h1 text-primary">Agendar Novo Serviço ALPHADATA</h1>

      <form onSubmit={handleSubmit} className="bg-surface rounded-card shadow-card p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClasse}>Tipo de Serviço *</label>
              <select required className={inputClasse} value={dados.tipoServico} onChange={(e) => set('tipoServico', e.target.value)}>
                <option value="">Selecione...</option>
                {OPCOES_SERVICO.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClasse}>Data Desejada *</label>
              <input required type="date" className={inputClasse} value={dados.dataDesejada} onChange={(e) => set('dataDesejada', e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Horário Preferido</label>
              <input type="time" className={inputClasse} value={dados.horario} onChange={(e) => set('horario', e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Repetir?</label>
              <select className={inputClasse} value={dados.repetir} onChange={(e) => set('repetir', e.target.value)}>
                <option>Não</option>
                <option>Semanal</option>
                <option>Quinzenal</option>
                <option>Mensal</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className={labelClasse}>Descrição</label>
              <textarea rows={4} className={inputClasse} value={dados.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="Descreva o que precisa..." />
            </div>
            <div>
              <label className={labelClasse}>Endereço</label>
              <input className={inputClasse} value={dados.endereco} onChange={(e) => set('endereco', e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Telefone de Contato</label>
              <input className={inputClasse} value={dados.telefone} onChange={(e) => set('telefone', e.target.value)} />
            </div>
            <div>
              <label className={labelClasse}>Email</label>
              <input className={inputClasse} value={dados.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-muted-dark">
          <button type="button" onClick={() => navigate('/cliente/dashboard')} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
            Cancelar
          </button>
          <button type="submit" className="flex items-center gap-2 rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">
            <IconCalendarPlus size={18} /> Agendar Agora
          </button>
        </div>
      </form>
    </div>
  )
}
