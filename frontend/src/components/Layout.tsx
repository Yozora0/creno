import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-2 py-2 text-sm font-medium transition-colors sm:px-3 ${
    isActive ? 'bg-ink/5 text-ink' : 'text-muted hover:text-ink'
  }`

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="font-display text-xl font-semibold">Créno</span>
          </Link>

          <nav className="-mx-2 flex flex-wrap items-center gap-1 sm:mx-0" aria-label="Navigation principale">
            <NavLink to="/" end className={navClass}>
              Prestations
            </NavLink>
            {user && (
              <NavLink to="/mes-rendez-vous" className={navClass}>
                Mes rendez-vous
              </NavLink>
            )}
            {user?.role === 'ADMIN' && (
              <NavLink to="/admin" className={navClass}>
                Back-office
              </NavLink>
            )}
            {user ? (
              <button
                type="button"
                className={navClass({ isActive: false })}
                onClick={() => {
                  logout()
                  navigate('/')
                }}
              >
                Déconnexion
              </button>
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
