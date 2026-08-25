const CORES = {
  azul: { bg: 'bg-blue-50', icon: 'text-primary', ring: 'ring-blue-100' },
  verde: { bg: 'bg-green-50', icon: 'text-success', ring: 'ring-green-100' },
  laranja: { bg: 'bg-orange-50', icon: 'text-warning', ring: 'ring-orange-100' },
  roxo: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
}

export default function KpiCard({ icon: Icon, valor, label, sublabel, cor = 'azul' }) {
  const c = CORES[cor] ?? CORES.azul
  return (
    <div className="bg-surface rounded-card shadow-card p-5 flex items-start gap-4 hover:shadow-cardHover transition-shadow">
      <div className={`w-12 h-12 rounded-card flex items-center justify-center ${c.bg} ring-4 ${c.ring}`}>
        <Icon size={24} className={c.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[#1a1a1a] truncate">{valor}</p>
        <p className="text-body font-medium text-[#333] truncate">{label}</p>
        {sublabel && <p className="text-label text-[#999]">{sublabel}</p>}
      </div>
    </div>
  )
}
