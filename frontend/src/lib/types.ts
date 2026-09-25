export type Role = 'CLIENT' | 'ADMIN'

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: Role
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

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

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
