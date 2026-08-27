import { useEffect, useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import { useToast } from '../../hooks/useToast'
import { api, ApiError } from '../../services/api'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'

const inputClasse = 'w-full rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

function formatarMoeda(valor) {
  if (valor === null || valor === undefined) return '—'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR')
}

export default function Financeiro() {
  const { showToast } = useToast()

  const [lancamentos, setLancamentos] = useState([])
  const [resumo, setResumo] = useState({ totalReceitas: 0, totalDespesas: 0, saldo: 0 })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [processandoId, setProcessandoId] = useState(null)

  function carregar() {
    setCarregando(true)
    api
      .get('/financeiro')
      .then((dados) => {
        setLancamentos(dados.lancamentos)
        setResumo(dados.resumo)
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Falha ao carregar o financeiro.'))
      .finally(() => setCarregando(false))
  }

  useEffect(() => {
    carregar()
  }, [])

  function abrirCriar() {
    setForm({ tipo: 'receita', categoria: '', descricao: '', valor: '', dataPrevista: '' })
  }

  async function handleSalvar(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      await api.post('/financeiro', {
        tipo: form.tipo,
        ...(form.categoria.trim() && { categoria: form.categoria.trim() }),
        descricao: form.descricao,
        valor: Number(form.valor),
        ...(form.dataPrevista && { dataPrevista: form.dataPrevista }),
      })
      showToast('Lançamento criado com sucesso!')
      setForm(null)
      carregar()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao criar lançamento.', 'erro')
    } finally {
      setSalvando(false)
    }
  }

  async function marcarPago(id) {
    setProcessandoId(id)
    try {
      await api.patch(`/financeiro/${id}/pagar`, {})
      showToast('Lançamento marcado como pago!')
      carregar()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao marcar como pago.', 'erro')
    } finally {
      setProcessandoId(null)
    }
  }

  async function cancelar(id) {
    setProcessandoId(id)
    try {
      await api.post(`/financeiro/${id}/cancelar`, {})
      showToast('Lançamento cancelado.')
      carregar()
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'Falha ao cancelar o lançamento.', 'erro')
    } finally {
      setProcessandoId(null)
    }
  }

  const colunas = [
    { header: 'Descrição', accessorKey: 'descricao' },
    { header: 'Categoria', accessorKey: 'categoria', cell: (info) => info.getValue() ?? '—' },
    { header: 'Tipo', accessorKey: 'tipo', cell: (info) => (info.getValue() === 'receita' ? 'Receita' : 'Despesa') },
    { header: 'Valor', accessorKey: 'valor', cell: (info) => formatarMoeda(info.getValue()) },
    { header: 'Status', accessorKey: 'status', cell: (info) => <Badge status={info.getValue()} /> },
    { header: 'Data prevista', accessorKey: 'dataPrevista', cell: (info) => formatarData(info.getValue()) },
    {
      header: 'Ações',
      id: 'acoes',
      cell: (info) =>
        info.row.original.status === 'pendente' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => marcarPago(info.row.original.id)}
              disabled={processandoId === info.row.original.id}
              className="rounded-btn px-2.5 py-1.5 text-label font-medium bg-success text-white hover:opacity-90 disabled:opacity-60"
            >
              Marcar pago
            </button>
            <button
              onClick={() => cancelar(info.row.original.id)}
              disabled={processandoId === info.row.original.id}
              className="rounded-btn px-2.5 py-1.5 text-label font-medium bg-danger text-white hover:opacity-90 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Financeiro</h1>
        <button onClick={abrirCriar} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white rounded-btn px-4 py-2 text-body font-medium">
          <IconPlus size={18} /> Novo Lançamento
        </button>
      </div>

      {carregando && <p className="text-body text-[#999]">Carregando...</p>}
      {erro && <p className="text-body text-danger">{erro}</p>}

      {!carregando && !erro && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface rounded-card shadow-card p-4">
              <p className="text-label text-[#666]">Receitas (pagas)</p>
              <p className="text-h2 text-success mt-1">{formatarMoeda(resumo.totalReceitas)}</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-4">
              <p className="text-label text-[#666]">Despesas (pagas)</p>
              <p className="text-h2 text-danger mt-1">{formatarMoeda(resumo.totalDespesas)}</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-4">
              <p className="text-label text-[#666]">Saldo</p>
              <p className="text-h2 text-primary mt-1">{formatarMoeda(resumo.saldo)}</p>
            </div>
          </div>

          <div className="bg-surface rounded-card shadow-card p-5">
            <DataTable data={lancamentos} columns={colunas} />
          </div>
        </>
      )}

      <Modal open={!!form} onClose={() => setForm(null)} title="Novo Lançamento" size="sm">
        {form && (
          <form onSubmit={handleSalvar} className="flex flex-col gap-4">
            <div>
              <label className={labelClasse}>Tipo *</label>
              <select required className={inputClasse} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div>
              <label className={labelClasse}>Descrição *</label>
              <input required className={inputClasse} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div>
              <label className={labelClasse}>Categoria</label>
              <input className={inputClasse} value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasse}>Valor *</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={inputClasse}
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClasse}>Data prevista</label>
                <input
                  type="date"
                  className={inputClasse}
                  value={form.dataPrevista}
                  onChange={(e) => setForm((f) => ({ ...f, dataPrevista: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-muted-dark">
              <button type="button" onClick={() => setForm(null)} className="rounded-btn px-4 py-2 text-body font-medium bg-muted-dark text-[#333] hover:bg-gray-300">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="rounded-btn px-4 py-2 text-body font-medium bg-primary text-white hover:bg-primary-dark disabled:opacity-60">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
