import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { CurtainContext, type CurtainOptions } from './context'

const COVER_MS = 320
const REVEAL_MS = 450

type Phase = 'covering' | 'revealing'

/**
 * Transition en trois temps pour éviter l'effet « coupure » :
 * 1. un voile couleur papier recouvre la page en fondu ;
 * 2. sous le voile, on exécute l'action (changer de page, ouvrir ou fermer la session) ;
 * 3. le voile se retire en fondu sur la nouvelle page.
 */
export function CurtainProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ phase: Phase; label: string } | null>(null)
  const busy = useRef(false)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const play = useCallback(({ label, action, hold = 0 }: CurtainOptions) => {
    if (busy.current) return
    busy.current = true
    setState({ phase: 'covering', label })
    later(() => {
      action()
      later(() => {
        setState({ phase: 'revealing', label })
        later(() => {
          setState(null)
          busy.current = false
        }, REVEAL_MS)
      }, hold)
    }, COVER_MS)
  }, [])

  return (
    <CurtainContext value={play}>
      {children}
      {state && (
        <div
          aria-hidden
          className={cx(
            'fixed inset-0 z-50 flex items-center justify-center bg-paper',
            state.phase === 'covering' ? 'animate-fade-in' : 'animate-fade-out',
          )}
        >
          <div className="flex flex-col items-center gap-4 text-muted">
            <img src="/favicon.svg" alt="" className="size-12" />
            <p className="font-display text-2xl text-ink italic">{state.label}</p>
          </div>
        </div>
      )}
    </CurtainContext>
  )
}
