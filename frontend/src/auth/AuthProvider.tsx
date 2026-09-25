import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStorage } from '../lib/api'
import type { AuthResponse, User } from '../lib/types'
import { AuthContext, type PendingSession, type RegisterInput } from './context'

/** Données propres à un compte : effacées à chaque changement d'utilisateur. Le reste (catalogue, horaires) est public. */
const PRIVATE_KEYS = new Set(['appointments', 'admin'])

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => tokenStorage.get() !== null)

  // Au chargement : si un token est stocké, on vérifie qu'il est toujours valide.
  useEffect(() => {
    if (!tokenStorage.get()) return
    api
      .get<User>('/api/auth/me')
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  /**
   * Changement d'utilisateur : on efface les données propres à l'ancien compte (ex. « Mes rendez-vous »),
   * sinon elles seraient réaffichées au compte suivant. Les données publiques restent en cache.
   */
  const switchUser = useCallback(
    (next: User | null) => {
      queryClient.removeQueries({ predicate: (q) => PRIVATE_KEYS.has(String(q.queryKey[0])) })
      setUser(next)
    },
    [queryClient],
  )

  const logout = useCallback(() => {
    tokenStorage.clear()
    switchUser(null)
  }, [switchUser])

  // Déconnexion automatique si l'API répond 401 (token expiré).
  useEffect(() => {
    const onUnauthorized = () => switchUser(null)
    window.addEventListener('creno:unauthorized', onUnauthorized)
    return () => window.removeEventListener('creno:unauthorized', onUnauthorized)
  }, [switchUser])

  const handleAuth = useCallback(
    (res: AuthResponse): PendingSession => ({
      user: res.user,
      open: () => {
        tokenStorage.set(res.token)
        switchUser(res.user)
      },
    }),
    [switchUser],
  )

  const login = useCallback(
    (email: string, password: string) =>
      api.post<AuthResponse>('/api/auth/login', { email, password }).then(handleAuth),
    [handleAuth],
  )

  const register = useCallback(
    (input: RegisterInput) => api.post<AuthResponse>('/api/auth/register', input).then(handleAuth),
    [handleAuth],
  )

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])

  return <AuthContext value={value}>{children}</AuthContext>
}
