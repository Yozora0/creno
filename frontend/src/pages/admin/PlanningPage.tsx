import { useState } from 'react'
import { useAdminPlanning, useChangeAppointmentStatus, useRecentBookings } from '../../api/appointments'
import { useAuth } from '../../auth/useAuth'
import { NewBadge } from '../../components/NewBadge'
import { useOpeningHours } from '../../api/schedule'
import { Alert, Badge, Button, Card, Spinner } from '../../components/ui'
import {
  addDays,
  dayOfWeek,
  formatDayLong,
  formatInstantTime,
  formatPrice,
  SHOP_TIME_ZONE,
  todayInShop,
  shopDateOf,
  relativeDay,
} from '../../lib/format'
import type { AdminAppointment, AppointmentStatus } from '../../lib/types'

const STATUS: Record<AppointmentStatus, { label: string; tone: 'brand' | 'neutral' | 'danger' }> = {
  BOOKED: { label: 'Réservé', tone: 'brand' },
  COMPLETED: { label: 'Honoré', tone: 'neutral' },
  NO_SHOW: { label: 'Absent', tone: 'danger' },
  CANCELLED: { label: 'Annulé', tone: 'neutral' },
}

const shopDay = new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE })

/** Lundi de la semaine contenant la date donnée. */
function mondayOf(isoDate: string) {
  const index = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].indexOf(
    dayOfWeek(isoDate),
  )
  return addDays(isoDate, -index)
}

export function PlanningPage() {
  const { user } = useAuth()
  const today = todayInShop()
  const [weekStart, setWeekStart] = useState(() => mondayOf(today))
  const [showCancelled, setShowCancelled] = useState(false)
  const [now] = useState(() => Date.now())
  const weekEnd = addDays(weekStart, 6)

  const { data, isPending, isError, error, isPlaceholderData } = useAdminPlanning(weekStart, weekEnd)
  const recent = useRecentBookings()
  const recentIds = new Set(recent.data?.map((a) => a.id))
  const openingHours = useOpeningHours()
  const changeStatus = useChangeAppointmentStatus()

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const visible = (data ?? []).filter((a) => showCancelled || a.status !== 'CANCELLED')

  // Indicateurs de la semaine
  const active = (data ?? []).filter((a) => a.status !== 'CANCELLED')
  const done = active.filter((a) => a.status === 'COMPLETED' || a.status === 'NO_SHOW')
  const noShows = active.filter((a) => a.status === 'NO_SHOW').length
  const revenue = active.filter((a) => a.status !== 'NO_SHOW').reduce((sum, a) => sum + a.priceCents, 0)

  const onChange = (a: AdminAppointment, status: AppointmentStatus) => {
    if (status === 'CANCELLED' && !window.confirm(`Annuler le RDV de ${a.clientName} ? Un email le préviendra.`)) return
    changeStatus.mutate({ id: a.id, status })
  }

  return (
    <div className="space-y-6">
      {recent.data && recent.data.length > 0 && (
        <RecentSummary
          appointments={recent.data}
          since={user?.previousLoginAt ?? null}
          onOpenWeek={(iso) => setWeekStart(mondayOf(shopDateOf(iso)))}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            aria-label="Semaine précédente"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            ←
          </Button>
          <Button
            variant="secondary"
            onClick={() => setWeekStart(mondayOf(today))}
            disabled={weekStart === mondayOf(today)}
          >
            Cette semaine
          </Button>
          <Button variant="secondary" aria-label="Semaine suivante" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            →
          </Button>
        </div>
        <p className="font-medium first-letter:uppercase">
          Du {formatDayLong(weekStart)} au {formatDayLong(weekEnd)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Rendez-vous" value={String(active.length)} />
        <Stat label="Chiffre d'affaires prévu" value={formatPrice(revenue)} />
        <Stat label="Déjà passés" value={String(done.length)} />
        <Stat
          label="Absences"
          value={done.length ? `${noShows} (${Math.round((noShows / done.length) * 100)} %)` : '0'}
        />
      </dl>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          className="size-4 accent-brand"
          checked={showCancelled}
          onChange={(e) => setShowCancelled(e.target.checked)}
        />
        Afficher les rendez-vous annulés
      </label>

      {changeStatus.isError && <Alert>{changeStatus.error.message}</Alert>}
      {isPending && <Spinner />}
      {isError && <Alert>{error.message}</Alert>}

      {data && (
        <div className={`space-y-4 transition-opacity ${isPlaceholderData ? 'opacity-50' : ''}`}>
          {days.map((day) => {
            const items = visible.filter((a) => shopDay.format(new Date(a.startAt)) === day)
            const open = openingHours.data?.some((h) => h.dayOfWeek === dayOfWeek(day)) ?? true
            const isToday = day === today
            return (
              <Card key={day} padding="p-0" className={isToday ? 'border-brand' : ''}>
                <div
                  className={`flex items-center justify-between gap-3 px-5 py-3 ${items.length > 0 || open ? 'border-b border-line' : ''}`}
                >
                  <h2 className="font-sans text-base font-semibold first-letter:uppercase">
                    {formatDayLong(day)}
                    {isToday && <span className="ml-2 text-xs font-medium text-brand">Aujourd'hui</span>}
                  </h2>
                  <span className="text-xs text-muted">
                    {!open && items.length === 0 ? 'Fermé' : `${items.length} RDV`}
                  </span>
                </div>
                {items.length === 0 ? (
                  open && <p className="px-5 py-4 text-sm text-muted">Aucun rendez-vous.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {items.map((a) => (
                      <PlanningRow
                        key={a.id}
                        appointment={a}
                        started={new Date(a.startAt).getTime() <= now}
                        isNew={recentIds.has(a.id)}
                        pending={changeStatus.isPending && changeStatus.variables?.id === a.id}
                        onChange={(status) => onChange(a, status)}
                      />
                    ))}
                  </ul>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-display text-3xl">{value}</dd>
    </div>
  )
}

function PlanningRow({
  appointment: a,
  started,
  isNew,
  pending,
  onChange,
}: {
  appointment: AdminAppointment
  started: boolean
  isNew: boolean
  pending: boolean
  onChange: (status: AppointmentStatus) => void
}) {
  const status = STATUS[a.status]
  return (
    <li
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 ${a.status === 'CANCELLED' ? 'opacity-50' : ''}`}
    >
      <span className="shrink-0 text-sm font-semibold whitespace-nowrap tabular-nums sm:w-28">
        {formatInstantTime(a.startAt)}–{formatInstantTime(a.endAt)}
      </span>
      {/* Sur mobile : horaire + statut sur la 1re ligne, client sur la 2e */}
      <div className="order-3 min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{a.clientName}</span>
          {isNew && <NewBadge />}
        </p>
        <p className="truncate text-xs text-muted">
          {a.serviceName} · {formatPrice(a.priceCents)}
          {a.clientPhone && (
            <>
              {' · '}
              <a href={`tel:${a.clientPhone.replace(/\s/g, '')}`} className="hover:text-brand">
                {a.clientPhone}
              </a>
            </>
          )}
        </p>
      </div>
      <span className="ml-auto sm:ml-0">
        <Badge tone={status.tone}>{status.label}</Badge>
      </span>
      <div className="order-4 flex gap-1 sm:order-none">
        {a.status === 'BOOKED' && !started && (
          <Button variant="danger" size="sm" loading={pending} onClick={() => onChange('CANCELLED')}>
            Annuler
          </Button>
        )}
        {started && a.status !== 'CANCELLED' && (
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={a.status === 'COMPLETED' || pending}
              onClick={() => onChange('COMPLETED')}
            >
              Honoré
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={a.status === 'NO_SHOW' || pending}
              onClick={() => onChange('NO_SHOW')}
            >
              Absent
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

/** Encadré « nouveaux RDV depuis votre dernière connexion ». Un clic ouvre la semaine du RDV. */
function RecentSummary({
  appointments,
  since,
  onOpenWeek,
}: {
  appointments: AdminAppointment[]
  since: string | null
  onOpenWeek: (startAt: string) => void
}) {
  const shown = appointments.slice(0, 5)
  const revenue = appointments.reduce((sum, a) => sum + a.priceCents, 0)

  return (
    <Card padding="p-0" className="overflow-hidden border-accent/40">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-accent-soft/60 px-5 py-4">
        <div>
          <p className="flex items-center gap-2 font-display text-xl">
            {appointments.length} nouveau{appointments.length > 1 ? 'x' : ''} rendez-vous <NewBadge />
          </p>
          {since && (
            <p className="text-xs text-muted">
              Depuis votre dernière connexion, {relativeDay(shopDateOf(since)).toLowerCase()} à{' '}
              {formatInstantTime(since)}
            </p>
          )}
        </div>
        <p className="text-sm text-muted">
          <span className="font-display text-xl text-ink">{formatPrice(revenue)}</span> de chiffre d'affaires prévu
        </p>
      </div>
      <ul className="divide-y divide-line">
        {shown.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onOpenWeek(a.startAt)}
              className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left text-sm transition-colors hover:bg-paper"
            >
              <span className="font-medium first-letter:uppercase sm:w-56">
                {relativeDay(shopDateOf(a.startAt))} · {formatInstantTime(a.startAt)}
              </span>
              <span className="flex-1 text-muted">
                {a.clientName} · {a.serviceName}
              </span>
              <span className="text-xs text-brand">Voir la semaine →</span>
            </button>
          </li>
        ))}
      </ul>
      {appointments.length > shown.length && (
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          et {appointments.length - shown.length} autre{appointments.length - shown.length > 1 ? 's' : ''}, signalé
          {appointments.length - shown.length > 1 ? 's' : ''} par le tag « Nouveau » dans le planning.
        </p>
      )}
    </Card>
  )
}
