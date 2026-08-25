import { useEffect, useMemo, useState } from 'react'
import { TIPOS_SERVICO } from '../data/mock'
import { useClientes } from '../hooks/useClientes'
import { usePrestadores } from '../hooks/usePrestadores'

const PRIORIDADES = ['Normal', 'Alta', 'Urgente']

const ESTADO_INICIAL = {
  clienteId: '',
  tipoServicoId: '',
  descricao: '',
  dataAgendada: '',
  hora: '',
  tecnicoId: '',
  endereco: '',
  valor: '',
  notasInternas: '',
  prioridade: 'Normal',
}

export default function FormularioOS({ ordemExistente, onSubmit, onCancel, onDelete }) {
  const { clientes } = useClientes()
  const { prestadores } = usePrestadores()
  const [dados, setDados] = useState(ESTADO_INICIAL)
  const [tocado, setTocado] = useState({})
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (ordemExistente) {
      setDados({
        clienteId: ordemExistente.clienteId ?? '',
        tipoServicoId: ordemExistente.tipoServicoId ?? '',
        descricao: ordemExistente.descricao ?? '',
        dataAgendada: ordemExistente.dataAgendada ?? '',
        hora: ordemExistente.hora ?? '',
        tecnicoId: ordemExistente.tecnicoId ?? '',
        endereco: ordemExistente.endereco ?? '',
        valor: ordemExistente.valor ?? '',
        notasInternas: ordemExistente.notasInternas ?? '',
        prioridade: ordemExistente.prioridade ?? 'Normal',
      })
    }
  }, [ordemExistente])

  const clientesFiltrados = useMemo(
    () => clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase())),
    [clientes, busca]
  )

  const erros = {
    clienteId: !dados.clienteId ? 'Selecione um cliente.' : '',
    tipoServicoId: !dados.tipoServicoId ? 'Selecione o tipo de serviço.' : '',
    dataAgendada: !dados.dataAgendada ? 'Informe a data agendada.' : '',
    tecnicoId: !dados.tecnicoId ? 'Selecione um técnico.' : '',
  }
  const valido = Object.values(erros).every((e) => !e)

  function set(campo, valor) {
    setDados((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleClienteChange(clienteId) {
    set('clienteId', clienteId)
    const cliente = clientes.find((c) => c.id === clienteId)
    if (cliente && !dados.endereco) set('endereco', cliente.endereco)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setTocado({ clienteId: true, tipoServicoId: true, dataAgendada: true, tecnicoId: true })
    if (!valido) return

    const cliente = clientes.find((c) => c.id === dados.clienteId)
    const tecnico = prestadores.find((p) => p.id === dados.tecnicoId)
    const tipo = TIPOS_SERVICO.find((t) => t.id === dados.tipoServicoId)

    onSubmit({
      ...dados,
      valor: Number(dados.valor) || tipo?.min || 0,
      clienteNome: cliente?.nome,
      tecnicoNome: tecnico?.nome,
      tipoServico: tipo?.nome,
    })
  }

  const erroClasse = 'text-danger text-label mt-1'
  const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
  const labelClasse = 'text-label text-[#666] block mb-1'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Coluna 1 */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Cliente *</label>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`${inputClasse} mb-1.5`}
            />
            <select
              value={dados.clienteId}
              onChange={(e) => handleClienteChange(e.target.value)}
              onBlur={() => setTocado((t) => ({ ...t, clienteId: true }))}
              className={inputClasse}
            >
              <option value="">Selecione...</option>
              {clientesFiltrados.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
            {tocado.clienteId && erros.clienteId && <p className={erroClasse}>{erros.clienteId}</p>}
          </div>

          <div>
            <label className={labelClasse}>Tipo de Serviço *</label>
            <select
              value={dados.tipoServicoId}
              onChange={(e) => set('tipoServicoId', e.target.value)}
              onBlur={() => setTocado((t) => ({ ...t, tipoServicoId: true }))}
              className={inputClasse}
            >
              <option value="">Selecione...</option>
              {TIPOS_SERVICO.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            {tocado.tipoServicoId && erros.tipoServicoId && <p className={erroClasse}>{erros.tipoServicoId}</p>}
          </div>

          <div>
            <label className={labelClasse}>Descrição</label>
            <textarea
              rows={3}
              value={dados.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Descreva o serviço..."
              className={inputClasse}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasse}>Data Agendada *</label>
              <input
                type="date"
                value={dados.dataAgendada}
                onChange={(e) => set('dataAgendada', e.target.value)}
                onBlur={() => setTocado((t) => ({ ...t, dataAgendada: true }))}
                className={inputClasse}
              />
              {tocado.dataAgendada && erros.dataAgendada && <p className={erroClasse}>{erros.dataAgendada}</p>}
            </div>
            <div>
              <label className={labelClasse}>Hora</label>
              <input type="time" value={dados.hora} onChange={(e) => set('hora', e.target.value)} className={inputClasse} />
            </div>
          </div>
        </div>

        {/* Coluna 2 */}
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClasse}>Técnico *</label>
            <select
              value={dados.tecnicoId}
              onChange={(e) => set('tecnicoId', e.target.value)}
              onBlur={() => setTocado((t) => ({ ...t, tecnicoId: true }))}
              className={inputClasse}
            >
              <option value="">Selecione...</option>
              {prestadores.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {p.especialidade}</option>
              ))}
            </select>
            {tocado.tecnicoId && erros.tecnicoId && <p className={erroClasse}>{erros.tecnicoId}</p>}
          </div>

          <div>
            <label className={labelClasse}>Endereço</label>
            <input type="text" value={dados.endereco} onChange={(e) => set('endereco', e.target.value)} className={inputClasse} />
          </div>

          <div>
            <label className={labelClasse}>Valor Estimado (R$)</label>
            <input type="number" min="0" value={dados.valor} onChange={(e) => set('valor', e.target.value)} className={inputClasse} />
          </div>

          <div>
            <label className={labelClasse}>Notas Internas</label>
            <textarea rows={2} value={dados.notasInternas} onChange={(e) => set('notasInternas', e.target.value)} className={inputClasse} />
          </div>

          <div>
            <label className={labelClasse}>Prioridade</label>
            <select value={dados.prioridade} onChange={(e) => set('prioridade', e.target.value)} className={inputClasse}>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-muted-dark mt-2">
        {ordemExistente && onDelete && (
          <button type="button" onClick={onDelete} className="rounded-btn px-4 py-2 text-body font-medium bg-danger text-white hover:bg-red-600 mr-auto">
            Deletar
          </button>
        )}
        <button type="button" onClick={onCancel} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!valido}
          className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Salvar Ordem
        </button>
      </div>
    </form>
  )
}
