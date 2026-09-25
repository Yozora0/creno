import { createContext } from 'react'
import type { User } from '../lib/types'

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface AuthContextValue {
  user: User | null
  /** true tant qu'on vérifie le token stocké au démarrage */
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
