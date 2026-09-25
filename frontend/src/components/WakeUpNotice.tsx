import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

/** Au-delà de ce délai, une requête lente est presque toujours l'API qui sort de veille. */
const SLOW_AFTER_MS = 2500

/**
 * L'API de démonstration est hébergée gratuitement : elle s'endort après 15 minutes sans visite
 * et met quelques dizaines de secondes à redémarrer. Plutôt qu'une page qui semble figée,
 * on prévient le visiteur dès qu'une requête traîne.
 */
export function WakeUpNotice() {
  const busy = useIsFetching() + useIsMutating() > 0
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!busy) {
      const id = window.setTimeout(() => setSlow(false), 0)
      return () => window.clearTimeout(id)
    }
    const id = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => window.clearTimeout(id)
  }, [busy])

  if (!slow) return null
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4">
      <p className="flex animate-fade-up items-center gap-3 rounded-2xl border sm:rounded-full border-line bg-surface px-5 py-3 text-sm text-ink shadow-lift">
        <span className="size-4 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <span>
          Le salon ouvre ses portes…{' '}
          <span className="text-muted">le serveur de démonstration se réveille, cela peut prendre une minute.</span>
        </span>
      </p>
    </div>
  )
}
