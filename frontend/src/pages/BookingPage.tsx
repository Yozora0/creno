import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAvailability, useBookAppointment } from '../api/appointments'
import { useClosures, useOpeningHours } from '../api/schedule'
import { useService } from '../api/services'
import { useAuth } from '../auth/useAuth'
import { Alert, Badge, Button, Card, Spinner } from '../components/ui'
import { addDays, dayChip, dayOfWeek, formatDayLong, formatDuration, formatHour, formatPrice, todayInShop } from '../lib/format'
import type { Slot } from '../lib/types'

const DAYS_SHOWN = 14

/**
 * Parcours de réservation. Le jour et le créneau choisis vivent dans l'URL (?date=…&start=…) :
 * si le client doit se connecter, il retrouve sa sélection au retour.
 */
export function BookingPage() {
  const serviceId = Number(useParams().serviceId)
  const [params, setParams] = useSearchParams()
  const service = useService(serviceId)
  const openingHours = useOpeningHours()
  const closures = useClosures()

  // Les 14 prochains jours, en marquant ceux où le salon est fermé.
  const days = useMemo(() => {
    const today = todayInShop()
    return Array.from({ length: DAYS_SHOWN }, (_, i) => {
      const date = addDays(today, i)
      const hasHours = openingHours.data?.some((h) => h.dayOfWeek === dayOfWeek(date)) ?? false
      const closed = closures.data?.some((c) => c.startDate <= date && date <= c.endDate) ?? false
      return { date, open: hasHours && !closed }
    })
  }, [openingHours.data, closures.data])

  const selectedDate = params.get('date') ?? days.find((d) => d.open)?.date ?? null
  const selectedStart = params.get('start')

  const select = (date: string, start?: string) =>
    setParams(start ? { date, start } : { date }, { replace: true, preventScrollReset: true })

  if (service.isPending || openingHours.isPending) return <Spinner />
  if (service.isError) {
    return (
      <div className="space-y-4">
        <Alert>Cette prestation n'existe pas ou n'est plus proposée.</Alert>
        <Link to="/" className="text-sm font-medium text-brand hover:underline">
          ← Voir les prestations
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/" className="text-sm text-muted hover:text-ink">
        ← Toutes les prestations
      </Link>
      <div className="mt-3 mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{service.data.name}</h1>
          {service.data.description && <p className="mt-1 text-muted">{service.data.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge>{formatDuration(service.data.durationMinutes)}</Badge>
          <span className="text-lg font-medium">{formatPrice(service.data.priceCents)}</span>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        {/* min-w-0 : sans ça, la bande de jours défilante élargit la colonne de la grille sur mobile */}
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="day-title">
            <h2 id="day-title" className="mb-3 text-xl font-semibold">
              1. Choisissez un jour
            </h2>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
              {days.map(({ date, open }) => {
                const chip = dayChip(date)
                const active = date === selectedDate
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={!open}
                    aria-pressed={active}
                    aria-label={`${formatDayLong(date)}${open ? '' : ' (fermé)'}`}
                    onClick={() => select(date)}
                    className={`flex w-16 shrink-0 flex-col items-center rounded-xl border py-2.5 transition-colors ${
                      active
                        ? 'border-brand bg-brand text-white'
                        : open
                          ? 'border-line bg-surface hover:border-brand'
                          : 'cursor-not-allowed border-transparent bg-transparent text-muted/50 line-through'
                    }`}
                  >
                    <span className="text-xs capitalize">{chip.weekday}</span>
                    <span className="text-lg font-semibold">{chip.day}</span>
                    <span className="text-xs">{chip.month}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {selectedDate && (
            <SlotPicker
              serviceId={serviceId}
              date={selectedDate}
              selectedStart={selectedStart}
              onSelect={(start) => select(selectedDate, start)}
            />
          )}
        </div>

        <Summary
          serviceId={serviceId}
          serviceName={service.data.name}
          priceCents={service.data.priceCents}
          date={selectedDate}
          start={selectedStart}
          onConflict={() => selectedDate && select(selectedDate)}
        />
      </div>
    </div>
  )
}

function SlotPicker({
  serviceId,
  date,
  selectedStart,
  onSelect,
}: {
  serviceId: number
  date: string
  selectedStart: string | null
  onSelect: (start: string) => void
}) {
  const { data, isPending, isError, error, isPlaceholderData } = useAvailability(serviceId, date)

  const groups: { label: string; slots: Slot[] }[] = [
    { label: 'Matin', slots: data?.filter((s) => s.time < '12:00') ?? [] },
    { label: 'Après-midi', slots: data?.filter((s) => s.time >= '12:00') ?? [] },
  ]

  return (
    <section aria-labelledby="slot-title">
      <h2 id="slot-title" className="mb-3 text-xl font-semibold">
        2. Choisissez un horaire <span className="text-base font-normal text-muted">· {formatDayLong(date)}</span>
      </h2>
      {isPending && <Spinner label="Recherche des créneaux…" />}
      {isError && <Alert>{error.message}</Alert>}
      {data?.length === 0 && (
        <Card className="text-center text-sm text-muted">Plus aucun créneau libre ce jour-là. Essayez un autre jour.</Card>
      )}
      <div className={`space-y-5 transition-opacity ${isPlaceholderData ? 'opacity-50' : ''}`}>
        {groups
          .filter((g) => g.slots.length > 0)
          .map((group) => (
            <div key={group.label}>
              <h3 className="mb-2 font-sans text-sm font-medium text-muted">{group.label}</h3>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {group.slots.map((slot) => {
                  const active = slot.startAt === selectedStart
                  return (
                    <button
                      key={slot.startAt}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelect(slot.startAt)}
                      className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                        active ? 'border-brand bg-brand text-white' : 'border-line bg-surface hover:border-brand'
                      }`}
                    >
                      {formatHour(slot.time)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}

function Summary({
  serviceId,
  serviceName,
  priceCents,
  date,
  start,
  onConflict,
}: {
  serviceId: number
  serviceName: string
  priceCents: number
  date: string | null
  start: string | null
  onConflict: () => void
}) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const book = useBookAppointment()
  const { data: slots } = useAvailability(serviceId, date)
  const slot = slots?.find((s) => s.startAt === start)

  const confirm = () => {
    if (!slot) return
    book.mutate(
      { serviceId, startAt: slot.startAt },
      {
        onSuccess: (appointment) => navigate('/mes-rendez-vous', { state: { bookedId: appointment.id } }),
        onError: onConflict, // le créneau a été pris entre-temps : on le désélectionne
      },
    )
  }

  return (
    <Card className="lg:sticky lg:top-6">
      <h2 className="mb-4 text-xl font-semibold">Récapitulatif</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Prestation</dt>
          <dd className="text-right font-medium">{serviceName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Date</dt>
          <dd className="text-right font-medium">{date ? formatDayLong(date) : '—'}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Heure</dt>
          <dd className="text-right font-medium">{slot ? formatHour(slot.time) : '—'}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-line pt-2">
          <dt className="text-muted">À régler sur place</dt>
          <dd className="text-right font-medium">{formatPrice(priceCents)}</dd>
        </div>
      </dl>

      <div className="mt-5 space-y-3">
        {book.isError && <Alert>{book.error.message}</Alert>}
        {user ? (
          <Button className="w-full" disabled={!slot} loading={book.isPending} onClick={confirm}>
            Confirmer le rendez-vous
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={!slot}
            onClick={() => navigate('/connexion', { state: { from: location.pathname + location.search } })}
          >
            Se connecter pour réserver
          </Button>
        )}
        {!slot && <p className="text-center text-xs text-muted">Sélectionnez un horaire pour continuer.</p>}
      </div>
    </Card>
  )
}
