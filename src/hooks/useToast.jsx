import { createContext, useCallback, useContext, useState } from 'react'
import { IconCircleCheck, IconAlertCircle, IconX } from '@tabler/icons-react'

const ToastContext = createContext(null)
let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (mensagem, tipo = 'sucesso') => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, mensagem, tipo }])
      setTimeout(() => remove(id), 4000)
    },
    [remove]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(90vw,360px)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-card shadow-cardHover px-4 py-3 text-body text-white animate-[fadeIn_0.2s_ease-out] ${
              t.tipo === 'erro' ? 'bg-danger' : 'bg-success'
            }`}
          >
            {t.tipo === 'erro' ? <IconAlertCircle size={20} className="shrink-0" /> : <IconCircleCheck size={20} className="shrink-0" />}
            <span className="flex-1">{t.mensagem}</span>
            <button onClick={() => remove(t.id)} aria-label="Fechar">
              <IconX size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de um ToastProvider')
  return ctx
}
