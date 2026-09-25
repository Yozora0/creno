export type Role = 'CLIENT' | 'ADMIN'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: Role
  /** Connexion précédente (null à la première) : sert à repérer ce qui est nouveau. */
  previousLoginAt: string | null
}

export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
}

export interface ServiceOffering {
  id: number
  name: string
  description: string | null
  durationMinutes: number
  priceCents: number
  active: boolean
}

export type ServiceOfferingInput = Omit<ServiceOffering, 'id'>

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface OpeningHour {
  dayOfWeek: DayOfWeek
  opensAt: string // "HH:mm"
  closesAt: string
}

export interface Closure {
  id: number
  startDate: string // "YYYY-MM-DD"
  endDate: string
  reason: string | null
}

export type ClosureInput = Omit<Closure, 'id'>

export interface Slot {
  startAt: string // instant ISO, à renvoyer tel quel pour réserver
  endAt: string
  time: string // "09:15", heure locale du salon
}

export type AppointmentStatus = 'BOOKED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED'

export interface Appointment {
  id: number
  serviceId: number
  serviceName: string
  durationMinutes: number
  priceCents: number
  startAt: string
  endAt: string
  status: AppointmentStatus
  createdAt: string
  cancellable: boolean
}

export interface AdminAppointment {
  id: number
  startAt: string
  endAt: string
  status: AppointmentStatus
  createdAt: string
  serviceId: number
  serviceName: string
  priceCents: number
  clientId: number
  clientName: string
  clientEmail: string
  clientPhone: string | null
}
