import { IconCheck, IconX } from '@tabler/icons-react'

export default function Checklist({ itens, onChange, readOnly = false }) {
  const total = itens.length
  const concluidos = itens.filter((i) => i.concluido).length
  const progresso = total ? Math.round((concluidos / total) * 100) : 0

  function toggle(id) {
    if (readOnly) return
    onChange(itens.map((i) => (i.id === id ? { ...i, concluido: !i.concluido } : i)))
  }

  function setObservacao(id, texto) {
    if (readOnly) return
    onChange(itens.map((i) => (i.id === id ? { ...i, observacao: texto } : i)))
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-body font-semibold text-[#333]">Progresso do checklist</span>
          <span className="text-body font-bold text-primary">{progresso}%</span>
        </div>
        <div className="w-full h-2 bg-muted-dark rounded-full overflow-hidden">
          <div className="h-full bg-success transition-all" style={{ width: `${progresso}%` }} />
        </div>
      </div>

      {itens.map((item) => (
        <div key={item.id} className="border border-muted-dark rounded-card p-3">
          <label className={`flex items-center gap-3 ${readOnly ? '' : 'cursor-pointer'}`}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              disabled={readOnly}
              className={`w-6 h-6 shrink-0 rounded-btn border flex items-center justify-center ${
                item.concluido ? 'bg-success border-success text-white' : 'border-muted-dark text-transparent'
              }`}
            >
              {item.concluido ? <IconCheck size={16} /> : <IconX size={14} />}
            </button>
            <span className={`text-body ${item.concluido ? 'text-[#333]' : 'text-[#666]'}`}>{item.label}</span>
          </label>
          <textarea
            rows={1}
            disabled={readOnly}
            value={item.observacao}
            onChange={(e) => setObservacao(item.id, e.target.value)}
            placeholder="Observação (opcional)"
            className="w-full mt-2 rounded-input border border-muted-dark px-2.5 py-1.5 text-label focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted disabled:text-[#999]"
          />
        </div>
      ))}
    </div>
  )
}
