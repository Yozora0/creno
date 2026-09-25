import { NavLink, Outlet } from 'react-router'
import { Page, PageHeader } from '../../components/ui'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
    isActive ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'
  }`

export function AdminLayout() {
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
