import { useMemo, useState } from 'react'
import { IconTrash, IconEyeOff, IconEye } from '@tabler/icons-react'
import { usePersisted } from '../../hooks/usePersisted'
import { useToast } from '../../hooks/useToast'
import { PORTFOLIO_FOTOGRAFIA } from '../../data/mock'
import ConfirmModal from '../../components/ui/ConfirmModal'

const inputClasse = 'rounded-input border border-muted-dark px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary'
const labelClasse = 'text-label text-[#666] block mb-1'

export default function PortfolioFotografia() {
  const [portfolio, setPortfolio] = usePersisted('alphadata_portfolio_fotografia', PORTFOLIO_FOTOGRAFIA)
  const { showToast } = useToast()

  const [filtroTipo, setFiltroTipo] = useState('')
  const [paraRemover, setParaRemover] = useState(null)

  const tipos = useMemo(() => [...new Set(portfolio.map((f) => f.tipoSessao))], [portfolio])
  const fotosFiltradas = useMemo(
    () => (filtroTipo ? portfolio.filter((f) => f.tipoSessao === filtroTipo) : portfolio),
    [portfolio, filtroTipo]
  )

  function alternarPublico(id) {
    setPortfolio((prev) => prev.map((f) => (f.id === id ? { ...f, publico: !f.publico } : f)))
  }

  function handleRemover() {
    setPortfolio((prev) => prev.filter((f) => f.id !== paraRemover.id))
    showToast('Foto removida do portfólio.')
    setParaRemover(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-h1 text-primary">Portfólio</h1>
        <div>
          <label className={labelClasse}>Filtrar por tipo</label>
          <select className={inputClasse} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos</option>
            {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {fotosFiltradas.map((foto) => (
          <div key={foto.id} className="bg-surface rounded-card shadow-card overflow-hidden group relative">
            <img src={foto.fotoUrl} alt={foto.tipoSessao} className="w-full aspect-square object-cover" />
            <div className="p-3">
              <p className="text-body font-medium text-[#1a1a1a] truncate">{foto.clienteNome}</p>
              <p className="text-label text-[#666]">{foto.tipoSessao}</p>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => alternarPublico(foto.id)}
                className="w-7 h-7 rounded-btn bg-white/90 hover:bg-white flex items-center justify-center text-primary shadow"
                aria-label={foto.publico ? 'Tornar privado' : 'Tornar público'}
              >
                {foto.publico ? <IconEye size={16} /> : <IconEyeOff size={16} />}
              </button>
              <button
                onClick={() => setParaRemover(foto)}
                className="w-7 h-7 rounded-btn bg-white/90 hover:bg-white flex items-center justify-center text-danger shadow"
                aria-label="Remover"
              >
                <IconTrash size={16} />
              </button>
            </div>
            {!foto.publico && (
              <span className="absolute top-2 left-2 text-label font-medium rounded-full px-2 py-0.5 bg-gray-800/80 text-white">Privado</span>
            )}
          </div>
        ))}
        {fotosFiltradas.length === 0 && <p className="text-body text-[#999] col-span-full">Nenhuma foto encontrada.</p>}
      </div>

      <ConfirmModal
        open={!!paraRemover}
        onClose={() => setParaRemover(null)}
        onConfirm={handleRemover}
        titulo="Remover do portfólio"
        mensagem="Tem certeza que deseja remover esta foto do portfólio?"
        corConfirmar="bg-danger hover:bg-red-600"
        textoConfirmar="Remover"
      />
    </div>
  )
}
