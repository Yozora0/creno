import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { Closure, ClosureInput, OpeningHour } from '../lib/types'

const keys = {
  openingHours: ['opening-hours'] as const,
  closures: ['closures'] as const,
}

export function useOpeningHours() {
  return useQuery({
    queryKey: keys.openingHours,
    queryFn: () => api.get<OpeningHour[]>('/api/opening-hours'),
  })
}

export function useSaveOpeningHours() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (slots: OpeningHour[]) => api.put<OpeningHour[]>('/api/admin/opening-hours', { slots }),
    onSuccess: (data) => qc.setQueryData(keys.openingHours, data),
  })
}

export function useClosures() {
  return useQuery({
    queryKey: keys.closures,
    queryFn: () => api.get<Closure[]>('/api/closures'),
  })
}

export function useAddClosure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ClosureInput) => api.post<Closure>('/api/admin/closures', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.closures }),
  })
}

export function useDeleteClosure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/closures/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.closures }),
  })
}
