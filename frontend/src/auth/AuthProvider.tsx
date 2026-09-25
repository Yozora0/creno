import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, tokenStorage } from '../lib/api'
import type { AuthResponse, User } from '../lib/types'
import { AuthContext, type RegisterInput } from './context'

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

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    queryClient.removeQueries({ queryKey: ['admin'] })
  }, [queryClient])

  // Déconnexion automatique si l'API répond 401 (token expiré).
  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener('creno:unauthorized', onUnauthorized)
    return () => window.removeEventListener('creno:unauthorized', onUnauthorized)
  }, [])

  const handleAuth = useCallback((res: AuthResponse) => {
    tokenStorage.set(res.token)
    setUser(res.user)
    return res.user
  }, [])

  const login = useCallback(
    (email: string, password: string) =>
      api.post<AuthResponse>('/api/auth/login', { email, password }).then(handleAuth),
    [handleAuth],
  )

  const register = useCallback(
    (input: RegisterInput) => api.post<AuthResponse>('/api/auth/register', input).then(handleAuth),
    [handleAuth],
  )

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
