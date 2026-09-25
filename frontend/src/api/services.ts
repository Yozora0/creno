import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { ServiceOffering, ServiceOfferingInput } from '../lib/types'

const keys = {
  public: ['services'] as const,
  admin: ['admin', 'services'] as const,
}

export function useServices() {
  return useQuery({
    queryKey: keys.public,
    queryFn: () => api.get<ServiceOffering[]>('/api/services'),
  })
}

export function useService(id: number) {
  return useQuery({
    queryKey: [...keys.public, id],
    queryFn: () => api.get<ServiceOffering>(`/api/services/${id}`),
  })
}

export function useAdminServices() {
  return useQuery({
    queryKey: keys.admin,
    queryFn: () => api.get<ServiceOffering[]>('/api/admin/services'),
  })
}

/** Après une modification, on invalide les deux listes (publique et admin). */
function useInvalidateServices() {
  const qc = useQueryClient()
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.public }),
      qc.invalidateQueries({ queryKey: keys.admin }),
    ])
}

export function useSaveService() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: ServiceOfferingInput }) =>
      id === undefined
        ? api.post<ServiceOffering>('/api/admin/services', input)
        : api.put<ServiceOffering>(`/api/admin/services/${id}`, input),
    onSuccess: invalidate,
  })
}

export function useDeleteService() {
  const invalidate = useInvalidateServices()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/services/${id}`),
    onSuccess: invalidate,
  })
}
