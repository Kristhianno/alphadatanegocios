import { useState } from 'react'
import { IconPlus, IconTrash, IconUsersGroup, IconTools } from '@tabler/icons-react'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { EQUIPE_SALAO, EQUIPAMENTOS_SALAO } from '../../data/mock'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'
const CARGOS = ['Garçom', 'Garçonete', 'Segurança', 'Recepcionista', 'DJ', 'Cerimonialista', 'Cozinheiro', 'Auxiliar de Cozinha']

export default function EquipeEquipamentosSalao() {
  const [equipe, setEquipe] = usePersisted('alphadata_equipe_salao', EQUIPE_SALAO)
  const [equipamentos, setEquipamentos] = usePersisted('alphadata_equipamentos_salao', EQUIPAMENTOS_SALAO)
  const { showToast } = useToast()

  const [modalEquipe, setModalEquipe] = useState(false)
  const [modalEquipamento, setModalEquipamento] = useState(false)
  const [membroParaRemover, setMembroParaRemover] = useState(null)
  const [equipamentoParaRemover, setEquipamentoParaRemover] = useState(null)

  const [nomeMembro, setNomeMembro] = useState('')
  const [cargoMembro, setCargoMembro] = useState(CARGOS[0])
  const [telefoneMembro, setTelefoneMembro] = useState('')

  const [nomeEquipamento, setNomeEquipamento] = useState('')
  const [quantidadeTotal, setQuantidadeTotal] = useState(1)

  function handleCriarMembro(e) {
    e.preventDefault()
    const novo = { id: `EQP-${String(equipe.length + 1).padStart(2, '0')}`, nome: nomeMembro, cargo: cargoMembro, telefone: telefoneMembro, disponivel: true }
    setEquipe((prev) => [novo, ...prev])
    showToast('Membro da equipe adicionado!')
    setModalEquipe(false)
    setNomeMembro('')
    setTelefoneMembro('')
  }

  function alternarDisponivel(id) {
    setEquipe((prev) => prev.map((m) => (m.id === id ? { ...m, disponivel: !m.disponivel } : m)))
  }

  function handleCriarEquipamento(e) {
    e.preventDefault()
    const novo = { id: `EQM-${String(equipamentos.length + 1).padStart(2, '0')}`, nome: nomeEquipamento, quantidadeTotal: Number(quantidadeTotal) || 1, quantidadeEmUso: 0, condicao: 'Ótimo' }
    setEquipamentos((prev) => [novo, ...prev])
    showToast('Equipamento adicionado!')
    setModalEquipamento(false)
    setNomeEquipamento('')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 text-primary">Equipe e Equipamentos</h1>

      <div className="bg-surface rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-[#1a1a1a] flex items-center gap-2"><IconUsersGroup size={20} /> Equipe Disponível</h2>
          <button onClick={() => setModalEquipe(true)} className="flex items-center gap-1.5 text-primary hover:underline text-body font-medium">
            <IconPlus size={16} /> Adicionar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-body">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Nome</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Cargo</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Telefone</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Disponibilidade</th>
                <th className="text-left px-4 py-2 text-label font-semibold text-[#666]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipe.map((m) => (
                <tr key={m.id} className="border-t border-muted-dark">
                  <td className="px-4 py-2">{m.nome}</td>
                  <td className="px-4 py-2">{m.cargo}</td>
                  <td className="px-4 py-2">{m.telefone}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => alternarDisponivel(m.id)} className={`text-label font-medium rounded-full px-2.5 py-1 ${m.disponivel ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {m.disponivel ? 'Disponível' : 'Indisponível'}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => setMembroParaRemover(m)} className="p-1.5 rounded-btn hover:bg-red-50 text-danger" aria-label="Remover">
                      <IconTrash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface rounded-card shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h2 text-[#1a1a1a] flex items-center gap-2"><IconTools size={20} /> Equipamentos</h2>
          <button onClick={() => setModalEquipamento(true)} className="flex items-center gap-1.5 text-primary hover:underline text-body font-medium">
            <IconPlus size={16} /> Adicionar
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {equipamentos.map((eq) => (
            <div key={eq.id} className="border border-muted-dark rounded-card p-3 flex flex-col gap-1">
              <div className="flex items-start justify-between">
                <p className="text-body font-semibold text-[#1a1a1a]">{eq.nome}</p>
                <button onClick={() => setEquipamentoParaRemover(eq)} className="text-danger hover:bg-red-50 p-1 rounded-btn" aria-label="Remover">
                  <IconTrash size={14} />
                </button>
              </div>
              <p className="text-label text-[#666]">{eq.quantidadeEmUso} em uso de {eq.quantidadeTotal}</p>
              <span className="text-label text-[#999]">Condição: {eq.condicao}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal open={modalEquipe} onClose={() => setModalEquipe(false)} title="Adicionar Membro da Equipe" size="sm">
        <form onSubmit={handleCriarMembro} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Nome *</label>
            <input required className={inputClasse} value={nomeMembro} onChange={(e) => setNomeMembro(e.target.value)} />
          </div>
          <div>
            <label className={labelClasse}>Cargo</label>
            <select className={inputClasse} value={cargoMembro} onChange={(e) => setCargoMembro(e.target.value)}>
              {CARGOS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClasse}>Telefone</label>
            <input className={inputClasse} value={telefoneMembro} onChange={(e) => setTelefoneMembro(e.target.value)} placeholder="(11) 98765-4321" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalEquipe(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal open={modalEquipamento} onClose={() => setModalEquipamento(false)} title="Adicionar Equipamento" size="sm">
        <form onSubmit={handleCriarEquipamento} className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Nome *</label>
            <input required className={inputClasse} value={nomeEquipamento} onChange={(e) => setNomeEquipamento(e.target.value)} />
          </div>
          <div>
            <label className={labelClasse}>Quantidade total</label>
            <input type="number" min={1} className={inputClasse} value={quantidadeTotal} onChange={(e) => setQuantidadeTotal(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
            <button type="button" onClick={() => setModalEquipamento(false)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark">Salvar</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!membroParaRemover}
        onClose={() => setMembroParaRemover(null)}
        onConfirm={() => { setEquipe((prev) => prev.filter((m) => m.id !== membroParaRemover.id)); showToast('Membro removido.'); setMembroParaRemover(null) }}
        titulo="Remover membro"
        mensagem={`Tem certeza que deseja remover ${membroParaRemover?.nome} da equipe?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
      <ConfirmModal
        open={!!equipamentoParaRemover}
        onClose={() => setEquipamentoParaRemover(null)}
        onConfirm={() => { setEquipamentos((prev) => prev.filter((eq) => eq.id !== equipamentoParaRemover.id)); showToast('Equipamento removido.'); setEquipamentoParaRemover(null) }}
        titulo="Remover equipamento"
        mensagem={`Tem certeza que deseja remover ${equipamentoParaRemover?.nome}?`}
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
