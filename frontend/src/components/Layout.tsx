import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { SHOP } from '../lib/shop'
import { cx } from '../lib/cx'
import { ButtonLink, Icon } from './ui'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-ink/[0.06] text-ink' : 'text-muted hover:text-ink',
  )

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  // Remonte en haut de page à chaque navigation (sauf ancres).
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0)
      return
    }
    // Lien vers une ancre (ex. /#prestations) : on attend le rendu de la page cible.
    const id = window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 60)
    return () => window.clearTimeout(id)
  }, [location.pathname, location.hash])

  const onLogout = () => {
    logout()
    navigate('/')
  }

  const links = (
    <>
      <NavLink to="/" end className={navClass}>
        Accueil
      </NavLink>
      {user?.role === 'CLIENT' && (
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
        <button type="button" className={navClass({ isActive: false })} onClick={onLogout}>
          Déconnexion
        </button>
      ) : (
        <NavLink to="/connexion" className={navClass}>
          Connexion
        </NavLink>
      )}
    </>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Aller au contenu
      </a>

      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label={`${SHOP.name}, accueil`}>
            <img src="/favicon.svg" alt="" className="size-8" />
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold">{SHOP.name}</span>
              <span className="block text-[11px] tracking-wide text-muted">réservation par Créno</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            {links}
            {/* Le commerçant ne réserve pas pour lui-même : pas de bouton « Réserver » */}
            {user?.role !== 'ADMIN' && (
              <ButtonLink to="/#prestations" size="md" className="ml-2">
                Réserver
              </ButtonLink>
            )}
          </nav>

          <button
            type="button"
            className="rounded-full p-2 text-ink hover:bg-ink/5 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} className="size-6" />
          </button>
        </div>

        {menuOpen && (
          <nav
            id="menu-mobile"
            className="flex flex-col gap-1 border-t border-line px-4 pt-3 pb-5 md:hidden"
            aria-label="Navigation mobile"
            // Referme le menu dès qu'on choisit un lien
            onClick={(e) => (e.target as HTMLElement).closest('a, button') && setMenuOpen(false)}
          >
            {links}
            {user?.role !== 'ADMIN' && (
              <ButtonLink to="/#prestations" className="mt-2">
                Réserver un créneau
              </ButtonLink>
            )}
          </nav>
        )}
      </header>

      <main id="contenu" className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-brand-deep text-paper/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl text-paper">{SHOP.name}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed">
            {SHOP.kind} à {SHOP.city}. Réservez votre créneau en ligne, 24 h/24, et recevez votre confirmation par
            email.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-accent uppercase">Le salon</p>
          <ul className="space-y-2 text-sm">
            <li>{SHOP.address}</li>
            <li>
              <a href={`tel:${SHOP.phone.replace(/\s/g, '')}`} className="hover:text-paper">
                {SHOP.phone}
              </a>
            </li>
            <li>
              <Link to="/#horaires" className="hover:text-paper">
                Horaires d'ouverture
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-accent uppercase">Informations</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/mentions-legales" className="hover:text-paper">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link to="/mentions-legales#donnees" className="hover:text-paper">
                Données personnelles
              </Link>
            </li>
            <li>
              <a href="https://pablomourato.fr" className="hover:text-paper">
                Réalisé par Pablo Correia Mourato
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-paper/50 sm:px-6">
          Site de démonstration : {SHOP.name} est un salon fictif, aucune prestation réelle n'est vendue.
        </p>
      </div>
    </footer>
  )
}
