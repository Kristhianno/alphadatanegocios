import { STATUS_CORES } from '../../data/mock'

export default function Badge({ status, children }) {
  if (status) {
    const cor = STATUS_CORES[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label font-medium ${cor.bg} ${cor.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cor.dot}`} />
        {status}
      </span>
    )
  }
  return <span className="inline-flex items-center rounded-full bg-primary-light text-primary px-2.5 py-1 text-label font-medium">{children}</span>
}
