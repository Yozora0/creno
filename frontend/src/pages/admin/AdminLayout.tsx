import { NavLink, Outlet } from 'react-router'

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
    isActive ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'
  }`

export function AdminLayout() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Back-office</h1>
      <nav className="mt-6 mb-8 flex gap-6 border-b border-line" aria-label="Back-office">
        <NavLink to="/admin/prestations" className={tabClass}>
          Prestations
        </NavLink>
        <NavLink to="/admin/horaires" className={tabClass}>
          Horaires &amp; fermetures
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}
