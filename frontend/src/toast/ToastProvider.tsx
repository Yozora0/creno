import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '../components/ui'
import { ToastContext, type ToastOptions } from './context'

interface Toast {
  id: number
  message: string
  icon: IconName
}

/** Un seul toast à la fois : un nouveau message remplace le précédent. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const show = useCallback((message: string, { icon = 'check', duration = 4000 }: ToastOptions = {}) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), message, icon })
    timer.current = window.setTimeout(() => setToast(null), duration)
  }, [])

  return (
    <ToastContext value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
      >
        {toast && (
          <p
            key={toast.id}
            className="pointer-events-auto flex animate-fade-up items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-paper shadow-lift"
          >
            <Icon name={toast.icon} className="size-4 shrink-0 text-accent" />
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext>
  )
}
