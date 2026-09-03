import { STATUS_CORES } from '../../data/mock'

// `cores`/`label` deixam o Badge reutilizável com outros vocabulários de
// status (ex: o enum real de Agendamento, em snake_case, que não bate
// com os status em português das telas mockadas) sem precisar duplicar
// o componente — por padrão continua usando STATUS_CORES e o próprio
// `status` como texto, igual antes.
export default function Badge({ status, children, cores = STATUS_CORES, label }) {
  if (status) {
    const cor = cores[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label font-medium ${cor.bg} ${cor.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cor.dot}`} />
        {label ?? status}
      </span>
    )
  }
  return <span className="inline-flex items-center rounded-full bg-primary-light text-primary px-2.5 py-1 text-label font-medium">{children}</span>
}
