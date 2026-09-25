import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { Role } from '../lib/types'
import { Spinner } from '../components/ui'
import { useAuth } from './useAuth'

/**
 * Protège une route côté front (confort d'utilisation uniquement :
 * la vraie sécurité est assurée par l'API, qui vérifie le rôle à chaque requête).
 */
export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner />
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}
