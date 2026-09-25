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

/** Fuseau du salon : les heures sont toujours affichées à l'heure de Paris, où que soit le client. */
export const SHOP_TIME_ZONE = 'Europe/Paris'

const isoDay = new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIME_ZONE })

/** Date du jour au salon, au format "YYYY-MM-DD". */
export const todayInShop = () => isoDay.format(new Date())

/** Ajoute des jours à une date "YYYY-MM-DD" (calcul en UTC pour éviter les surprises de fuseau). */
export function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

const JS_DAY_TO_API: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export function dayOfWeek(isoDate: string): DayOfWeek {
  const [y, m, d] = isoDate.split('-').map(Number)
  return JS_DAY_TO_API[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

const dayParts = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

/** "mar. 29 sept." découpé pour l'affichage en pastille */
export function dayChip(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const parts = dayParts.formatToParts(new Date(Date.UTC(y, m - 1, d)))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { weekday: get('weekday').replace('.', ''), day: get('day'), month: get('month').replace('.', '') }
}

const fullDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

export function formatDayLong(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return fullDay.format(new Date(Date.UTC(y, m - 1, d)))
}

const instantDay = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: SHOP_TIME_ZONE,
})
const instantTime = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: SHOP_TIME_ZONE })

export const formatInstantDay = (iso: string) => instantDay.format(new Date(iso))
export const formatInstantTime = (iso: string) => formatHour(instantTime.format(new Date(iso)))

/** "09:45" -> "9h45" */
export const formatHour = (hhmm: string) => hhmm.replace(/^0/, '').replace(':', 'h')

/** "Aujourd'hui", "Demain" ou "mardi 29 septembre" */
export function relativeDay(isoDate: string) {
  const today = todayInShop()
  if (isoDate === today) return "Aujourd'hui"
  if (isoDate === addDays(today, 1)) return 'Demain'
  return formatDayLong(isoDate)
}
