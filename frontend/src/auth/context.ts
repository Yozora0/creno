import { createContext } from 'react'
import type { User } from '../lib/types'

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

/**
 * Identifiants validés par l'API mais session pas encore ouverte : l'appelant choisit le moment
 * d'appeler `open()` (ex. sous le voile de transition, pour que l'en-tête ne change pas à vue).
 */
export interface PendingSession {
  user: User
  open: () => void
}

export interface AuthContextValue {
  user: User | null
  /** true tant qu'on vérifie le token stocké au démarrage */
  loading: boolean
  login: (email: string, password: string) => Promise<PendingSession>
  register: (input: RegisterInput) => Promise<PendingSession>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
