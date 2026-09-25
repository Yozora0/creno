import { useState, type FormEvent } from 'react'
import { useAddClosure, useClosures, useDeleteClosure, useOpeningHours, useSaveOpeningHours } from '../../api/schedule'
import { Alert, Button, Card, Field, Input, Spinner } from '../../components/ui'
import { DAYS, formatDate } from '../../lib/format'
import type { DayOfWeek, OpeningHour } from '../../lib/types'

export function ScheduleAdminPage() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
      <WeekEditorLoader />
      <ClosuresManager />
    </div>
  )
}

function WeekEditorLoader() {
  const { data, isPending, isError, error } = useOpeningHours()
  if (isPending) return <Spinner />
  if (isError) return <Alert>{error.message}</Alert>
  // L'éditeur garde son propre état local, initialisé une fois avec les données serveur.
  return <WeekEditor initial={data} />
}

type Slot = { id: string; opensAt: string; closesAt: string }
type Week = Record<DayOfWeek, Slot[]>

let nextId = 0
const newSlot = (opensAt = '09:00', closesAt = '18:00'): Slot => ({ id: `slot-${nextId++}`, opensAt, closesAt })

function toWeek(hours: OpeningHour[]): Week {
  const week = Object.fromEntries(DAYS.map((d) => [d.value, [] as Slot[]])) as Week
  for (const h of hours) week[h.dayOfWeek].push(newSlot(h.opensAt, h.closesAt))
  return week
}

function WeekEditor({ initial }: { initial: OpeningHour[] }) {
  const [week, setWeek] = useState<Week>(() => toWeek(initial))
  const save = useSaveOpeningHours()

  const updateDay = (day: DayOfWeek, slots: Slot[]) => {
    save.reset()
    setWeek((w) => ({ ...w, [day]: slots }))
  }

  const onSave = () => {
    const slots: OpeningHour[] = DAYS.flatMap((d) =>
      week[d.value].map((s) => ({ dayOfWeek: d.value, opensAt: s.opensAt, closesAt: s.closesAt })),
    )
    save.mutate(slots)
  }

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium">Horaires d'ouverture</h2>
          <p className="text-sm text-muted">Plusieurs plages par jour possibles (ex. pause déjeuner).</p>
        </div>
        <Button onClick={onSave} loading={save.isPending}>
          Enregistrer
        </Button>
      </div>

      {save.isError && <Alert>{save.error.message}</Alert>}
      {save.isSuccess && <Alert tone="success">Horaires enregistrés.</Alert>}

      <ul className="mt-4 divide-y divide-line">
        {DAYS.map((day) => {
          const slots = week[day.value]
          return (
            <li key={day.value} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
              <span className="w-24 pt-2.5 text-sm font-medium">{day.label}</span>
              <div className="flex-1 space-y-2">
                {slots.length === 0 && <p className="pt-2.5 text-sm text-muted">Fermé</p>}
                {slots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`${day.label} ouverture`}
                      value={slot.opensAt}
                      onChange={(e) =>
                        updateDay(
                          day.value,
                          slots.map((s) => (s.id === slot.id ? { ...s, opensAt: e.target.value } : s)),
                        )
                      }
                      className="w-32"
                    />
                    <span className="text-muted">à</span>
                    <Input
                      type="time"
                      aria-label={`${day.label} fermeture`}
                      value={slot.closesAt}
                      onChange={(e) =>
                        updateDay(
                          day.value,
                          slots.map((s) => (s.id === slot.id ? { ...s, closesAt: e.target.value } : s)),
                        )
                      }
                      className="w-32"
                    />
                    <Button
                      variant="danger"
                      aria-label={`Retirer la plage du ${day.label}`}
                      onClick={() =>
                        updateDay(
                          day.value,
                          slots.filter((s) => s.id !== slot.id),
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  const last = slots.at(-1)
                  updateDay(day.value, [...slots, last ? newSlot(last.closesAt, '19:00') : newSlot()])
                }}
              >
                + Plage
              </Button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ClosuresManager() {
  const { data } = useClosures()
  const add = useAddClosure()
  const remove = useDeleteClosure()
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    add.mutate(
      { startDate: form.startDate, endDate: form.endDate || form.startDate, reason: form.reason || null },
      { onSuccess: () => setForm({ startDate: '', endDate: '', reason: '' }) },
    )
  }

  return (
    <Card>
      <h2 className="text-2xl font-medium">Fermetures exceptionnelles</h2>
      <p className="mb-4 text-sm text-muted">Congés, jours fériés… Aucun créneau ne sera proposé ces jours-là.</p>

      <form onSubmit={onSubmit} className="space-y-3">
        {add.isError && <Alert>{add.error.message}</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Du" htmlFor="startDate">
            <Input
              id="startDate"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="Au" htmlFor="endDate">
            <Input
              id="endDate"
              type="date"
              min={form.startDate}
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Motif" htmlFor="reason">
          <Input
            id="reason"
            placeholder="Congés d'été"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </Field>
        <Button type="submit" variant="secondary" loading={add.isPending} className="w-full">
          Ajouter la fermeture
        </Button>
      </form>

      <ul className="mt-6 space-y-2">
        {data?.length === 0 && <li className="text-sm text-muted">Aucune fermeture prévue.</li>}
        {data?.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 text-sm">
            <span>
              {c.startDate === c.endDate
                ? formatDate(c.startDate)
                : `${formatDate(c.startDate)} → ${formatDate(c.endDate)}`}
              {c.reason && <span className="block text-xs text-muted">{c.reason}</span>}
            </span>
            <Button variant="danger" aria-label="Supprimer la fermeture" onClick={() => remove.mutate(c.id)}>
              ✕
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
