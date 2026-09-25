import { useState } from 'react'
import { useLocation } from 'react-router'
import { useCancelAppointment, useMyAppointments } from '../api/appointments'
import { useAuth } from '../auth/useAuth'
import { NewBadge } from '../components/NewBadge'
import { Alert, Badge, Button, ButtonLink, Card, Page, PageHeader, Spinner } from '../components/ui'
import { formatDuration, formatInstantDay, formatInstantTime, formatPrice } from '../lib/format'
import { isNewSince } from '../lib/novelty'
import type { Appointment, AppointmentStatus } from '../lib/types'

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  BOOKED: 'Confirmé',
  COMPLETED: 'Honoré',
  NO_SHOW: 'Absent',
  CANCELLED: 'Annulé',
}

export function MyAppointmentsPage() {
  const { data, isPending, isError, error } = useMyAppointments()
  const cancel = useCancelAppointment()
  const { user } = useAuth()
  const bookedId = (useLocation().state as { bookedId?: number } | null)?.bookedId
  const [now] = useState(() => Date.now()) // figé au montage : le rendu reste pur

  if (isPending)
    return (
      <Page narrow>
        <Spinner />
      </Page>
    )
  if (isError)
    return (
      <Page narrow>
        <Alert>{error.message}</Alert>
      </Page>
    )

  const upcoming = data
    .filter((a) => a.status === 'BOOKED' && new Date(a.endAt).getTime() > now)
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
  const history = data.filter((a) => !upcoming.includes(a))

  const onCancel = (a: Appointment) => {
    if (window.confirm(`Annuler votre rendez-vous « ${a.serviceName} » du ${formatInstantDay(a.startAt)} ?`)) {
      cancel.mutate(a.id)
    }
  }

  return (
    <Page narrow className="space-y-8">
      <PageHeader
        eyebrow="Mon espace"
        title="Mes rendez-vous"
        actions={<ButtonLink to="/#prestations">Prendre rendez-vous</ButtonLink>}
      />

      {bookedId && upcoming.some((a) => a.id === bookedId) && (
        <Alert tone="success">C'est réservé ! Votre rendez-vous apparaît ci-dessous.</Alert>
      )}
      {cancel.isError && <Alert>{cancel.error.message}</Alert>}

      <section className="space-y-3">
        <h2 className="text-2xl font-medium">À venir</h2>
        {upcoming.length === 0 && <Card className="text-center text-sm text-muted">Aucun rendez-vous à venir.</Card>}
        {upcoming.map((a) => (
          <AppointmentCard
            key={a.id}
            appointment={a}
            highlighted={a.id === bookedId}
            isNew={isNewSince(a.createdAt, user?.previousLoginAt)}
          >
            {a.cancellable ? (
              <Button
                variant="danger"
                loading={cancel.isPending && cancel.variables === a.id}
                onClick={() => onCancel(a)}
              >
                Annuler
              </Button>
            ) : (
              <span className="text-xs text-muted">Annulation en ligne impossible à moins de 2 h</span>
            )}
          </AppointmentCard>
        ))}
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl font-medium">Historique</h2>
          {history.map((a) => (
            <AppointmentCard key={a.id} appointment={a} muted>
              <Badge tone={a.status === 'COMPLETED' ? 'brand' : 'neutral'}>{STATUS_LABEL[a.status]}</Badge>
            </AppointmentCard>
          ))}
        </section>
      )}
    </Page>
  )
}

function AppointmentCard({
  appointment: a,
  highlighted,
  isNew,
  muted,
  children,
}: {
  appointment: Appointment
  highlighted?: boolean
  isNew?: boolean
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <Card
      padding="p-5"
      className={`flex flex-wrap items-center justify-between gap-4 ${highlighted ? 'border-brand ring-2 ring-brand/15' : ''} ${
        muted ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-brand text-paper">
          <span className="font-display text-xl">{formatInstantTime(a.startAt)}</span>
        </div>
        <div>
          <p className="flex flex-wrap items-center gap-2 font-medium">
            <span className="first-letter:uppercase">{formatInstantDay(a.startAt)}</span>
            {isNew && <NewBadge />}
          </p>
          <p className="text-sm text-muted">
            {a.serviceName} · {formatDuration(a.durationMinutes)} · {formatPrice(a.priceCents)}
          </p>
        </div>
      </div>
      {children}
    </Card>
  )
}
