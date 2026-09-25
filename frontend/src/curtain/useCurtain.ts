import { useContext } from 'react'
import { CurtainContext } from './context'

/**
 * Transition « voile » entre deux états de l'application (connexion, déconnexion) :
 * `curtain({ label: 'À bientôt', action: () => … })`.
 */
export function useCurtain() {
  const play = useContext(CurtainContext)
  if (!play) throw new Error('useCurtain doit être utilisé dans <CurtainProvider>')
  return play
}
