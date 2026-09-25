import { createContext } from 'react'
import type { IconName } from '../components/ui'

export interface ToastOptions {
  icon?: IconName
  /** Durée d'affichage en millisecondes (4 s par défaut). */
  duration?: number
}

export const ToastContext = createContext<((message: string, options?: ToastOptions) => void) | null>(null)
