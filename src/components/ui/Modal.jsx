import { IconX } from '@tabler/icons-react'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null
  const larguras = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-4 overflow-y-auto">
      <div className={`bg-surface w-full ${larguras[size]} rounded-none sm:rounded-card shadow-cardHover my-0 sm:my-8 min-h-full sm:min-h-0`}>
        <div className="flex items-center justify-between border-b border-muted-dark px-6 py-4">
          <h2 className="text-h2 text-[#1a1a1a]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <IconX size={22} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-muted-dark px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}
