import { useClosures, useOpeningHours } from '../api/schedule'
import { useServices } from '../api/services'
import { useAuth } from '../auth/useAuth'
import { Alert, Badge, Card, Spinner } from '../components/ui'
import { DAYS, formatDate, formatDuration, formatPrice, formatTime } from '../lib/format'

export function HomePage() {
  const { user } = useAuth()
  const services = useServices()

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <section>
        <p className="text-sm font-medium text-brand">Salon Camille · Blois</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">
          Réservez votre créneau
          <br />
          en quelques clics.
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          {user
            ? `Bonjour ${user.firstName}, choisissez une prestation pour voir les créneaux disponibles.`
            : 'Choisissez une prestation, un jour, un horaire : c’est réservé. Sans appel, sans attente.'}
        </p>

        <h2 className="mt-10 mb-4 text-2xl font-semibold">Nos prestations</h2>
        {services.isPending && <Spinner />}
        {services.isError && <Alert>{services.error.message}</Alert>}
        {services.data?.length === 0 && <p className="text-muted">Aucune prestation pour le moment.</p>}

        <ul className="grid gap-3 sm:grid-cols-2">
          {services.data?.map((s) => (
            <li key={s.id}>
              <Card className="flex h-full flex-col gap-2 p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold">{s.name}</h3>
                  <span className="font-medium whitespace-nowrap">{formatPrice(s.priceCents)}</span>
                </div>
                {s.description && <p className="text-sm text-muted">{s.description}</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <Badge>{formatDuration(s.durationMinutes)}</Badge>
                  {/* La réservation arrive en semaine 2 */}
                  <span className="text-xs text-muted">Réservation bientôt disponible</span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <aside className="space-y-4">
        <OpeningHoursCard />
        <ClosuresCard />
      </aside>
    </div>
  )
}

function OpeningHoursCard() {
  const { data } = useOpeningHours()
  if (!data) return null

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">Horaires</h2>
      <dl className="space-y-2 text-sm">
        {DAYS.map((day) => {
          const slots = data.filter((h) => h.dayOfWeek === day.value)
          return (
            <div key={day.value} className="flex justify-between gap-4">
              <dt className="text-muted">{day.label}</dt>
              <dd className="text-right">
                {slots.length === 0
                  ? 'Fermé'
                  : slots.map((s) => `${formatTime(s.opensAt)}–${formatTime(s.closesAt)}`).join(', ')}
              </dd>
            </div>
          )
        })}
      </dl>
    </Card>
  )
}

function ClosuresCard() {
  const { data } = useClosures()
  if (!data || data.length === 0) return null

  return (
    <Card className="border-accent/40 bg-accent/10">
      <h2 className="mb-3 text-lg font-semibold">Fermetures à venir</h2>
      <ul className="space-y-2 text-sm">
        {data.map((c) => (
          <li key={c.id}>
            {c.startDate === c.endDate
              ? `Le ${formatDate(c.startDate)}`
              : `Du ${formatDate(c.startDate)} au ${formatDate(c.endDate)}`}
            {c.reason && <span className="text-muted"> · {c.reason}</span>}
          </li>
        ))}
      </ul>
    </Card>
  )
}
