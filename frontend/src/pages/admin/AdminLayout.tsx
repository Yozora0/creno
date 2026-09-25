import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useRecentBookings } from '../../api/appointments'
import { useAuth } from '../../auth/useAuth'
import { Page, PageHeader } from '../../components/ui'
import { useToast } from '../../toast/useToast'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
    isActive ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'
  }`

/** Une seule annonce par connexion : la clé change avec la date de connexion précédente. */
function useNewBookingsToast() {
  const { user } = useAuth()
  const { data } = useRecentBookings(!!user?.previousLoginAt)
  const toast = useToast()
  const count = data?.length ?? 0

  useEffect(() => {
    if (!user?.previousLoginAt || count === 0) return
    const key = `creno.recent-toast:${user.id}:${user.previousLoginAt}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // stockage indisponible (navigation privée stricte) : on annonce quand même
    }
    const label = count > 1 ? `${count} nouveaux rendez-vous` : '1 nouveau rendez-vous'
    toast(`${label} depuis votre dernière connexion`, { icon: 'calendar', duration: 5000 })
  }, [count, user?.id, user?.previousLoginAt, toast])
}

export function AdminLayout() {
  useNewBookingsToast()
  return (
    <Page>
      <PageHeader eyebrow="Espace commerçant" title="Back-office" />
      <nav
        className="-mt-4 mb-8 flex gap-5 overflow-x-auto border-b border-line whitespace-nowrap sm:gap-6"
        aria-label="Back-office"
      >
        <NavLink to="/admin/planning" className={tabClass}>
          Planning
        </NavLink>
        <NavLink to="/admin/prestations" className={tabClass}>
          Prestations
        </NavLink>
        <NavLink to="/admin/horaires" className={tabClass}>
          Horaires &amp; fermetures
        </NavLink>
      </nav>
      <Outlet />
    </Page>
  )
}
