import type { DayOfWeek } from './types'

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export const formatPrice = (cents: number) => euro.format(cents / 100)

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

export const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Lundi' },
  { value: 'TUESDAY', label: 'Mardi' },
  { value: 'WEDNESDAY', label: 'Mercredi' },
  { value: 'THURSDAY', label: 'Jeudi' },
  { value: 'FRIDAY', label: 'Vendredi' },
  { value: 'SATURDAY', label: 'Samedi' },
  { value: 'SUNDAY', label: 'Dimanche' },
]

/** "09:00" -> "9h", "14:30" -> "14h30" */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':')
  return `${Number(h)}h${m === '00' ? '' : m}`
}

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export function formatDate(isoDate: string) {
  // On construit la date en local pour éviter un décalage d'un jour lié au fuseau.
  const [y, mo, d] = isoDate.split('-').map(Number)
  return longDate.format(new Date(y, mo - 1, d))
}
