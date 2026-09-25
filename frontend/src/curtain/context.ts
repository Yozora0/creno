import { createContext } from 'react'

export interface CurtainOptions {
  /** Texte affiché au centre du voile (ex. « À bientôt »). */
  label: string
  /** Exécuté une fois la page recouverte : changement de page, de session… */
  action: () => void
  /** Temps pendant lequel le voile reste affiché après l'action, en millisecondes. */
  hold?: number
}

export const CurtainContext = createContext<((options: CurtainOptions) => void) | null>(null)
