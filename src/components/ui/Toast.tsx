import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import s from './ui.module.css'

type Kind = 'info' | 'success' | 'error'
type ToastItem = { id: number; message: string; kind: Kind }
type ToastFn = (message: string, kind?: Kind) => void

const ToastContext = createContext<ToastFn>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const toast = useCallback<ToastFn>((message, kind = 'info') => {
    const id = nextId.current++
    setItems((list) => [...list.filter((t) => t.message !== message), { id, message, kind }].slice(-3))
    window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), kind === 'error' ? 5000 : 2800)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={s.toasts} role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={[s.toast, t.kind === 'error' && s.toastError, t.kind === 'success' && s.toastSuccess].filter(Boolean).join(' ')}>
            {t.kind === 'error' ? <CircleAlert size={18} /> : t.kind === 'success' ? <CircleCheck size={18} /> : <Info size={18} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
