import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Button } from './ui'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-ink/5 text-ink' : 'text-muted hover:text-ink'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-display text-xl font-semibold">Créno</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Navigation principale">
            <NavLink to="/" end className={navClass}>
              Prestations
            </NavLink>
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={navClass}>
                Back-office
              </NavLink>
            )}
            {user ? (
              <Button
                variant="ghost"
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Déconnexion
              </Button>
            ) : (
              <NavLink to="/connexion" className={navClass}>
                Connexion
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Créno · projet portfolio de Pablo Correia Mourato
      </footer>
    </div>
  )
}
