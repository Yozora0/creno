import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { addDays } from '../lib/format'
import type { AdminAppointment, Appointment, AppointmentStatus, Slot } from '../lib/types'

const keys = {
  availability: (serviceId: number, date: string) => ['availability', serviceId, date] as const,
  mine: ['appointments', 'me'] as const,
}

export function useAvailability(serviceId: number, date: string | null) {
  return useQuery({
    queryKey: keys.availability(serviceId, date ?? ''),
    queryFn: () => api.get<Slot[]>(`/api/services/${serviceId}/availability?date=${date}`),
    enabled: date !== null,
    staleTime: 0, // les créneaux bougent vite : toujours rafraîchir
    placeholderData: keepPreviousData,
  })
}

export function useBookAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { serviceId: number; startAt: string }) => api.post<Appointment>('/api/appointments', input),
    // Succès ou conflit, les disponibilités ont changé.
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['availability'] }),
        qc.invalidateQueries({ queryKey: keys.mine }),
      ]),
  })
}

export function useMyAppointments(enabled = true) {
  return useQuery({
    queryKey: keys.mine,
    enabled,
    queryFn: () => api.get<Appointment[]>('/api/appointments/me'),
  })
}

export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post<Appointment>(`/api/appointments/${id}/cancel`),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: keys.mine }),
        qc.invalidateQueries({ queryKey: ['availability'] }),
      ]),
  })
}

// ---------- Back-office ----------

export function useAdminPlanning(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ['admin', 'appointments', from, to],
    enabled,
    queryFn: () => api.get<AdminAppointment[]>(`/api/admin/appointments?from=${from}&to=${to}`),
    placeholderData: keepPreviousData,
  })
}

export function useChangeAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) =>
      api.patch<AdminAppointment>(`/api/admin/appointments/${id}/status`, { status }),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'appointments'] }),
        qc.invalidateQueries({ queryKey: ['availability'] }),
      ]),
  })
}

/**
 * Premier créneau libre d'une prestation dans les 14 prochains jours.
 * Les jours sont interrogés un par un et on s'arrête au premier créneau trouvé.
 */
export function useNextSlot(serviceId: number | undefined, fromDate: string) {
  return useQuery({
    queryKey: ['next-slot', serviceId, fromDate],
    enabled: serviceId !== undefined,
    staleTime: 60_000,
    queryFn: async () => {
      for (let i = 0; i < 14; i++) {
        const date = addDays(fromDate, i)
        const slots = await api.get<Slot[]>(`/api/services/${serviceId}/availability?date=${date}`)
        if (slots.length > 0) return { date, slot: slots[0] }
      }
      return null
    },
  })
}

/** RDV pris depuis la connexion précédente du commerçant. */
export function useRecentBookings(enabled = true) {
  return useQuery({
    queryKey: ['admin', 'appointments', 'recent'],
    queryFn: () => api.get<AdminAppointment[]>('/api/admin/appointments/recent'),
    enabled,
  })
}
