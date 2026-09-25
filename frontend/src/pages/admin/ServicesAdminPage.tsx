import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useAdminServices, useDeleteService, useSaveService } from '../../api/services'
import { Alert, Badge, Button, Card, Field, Input, Spinner } from '../../components/ui'
import { formatDuration, formatPrice } from '../../lib/format'
import type { ServiceOffering } from '../../lib/types'

const schema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(120),
  description: z.string().trim().max(1000).optional(),
  durationMinutes: z.number('Durée requise').int().min(5, '5 min minimum').max(480, '8 h maximum'),
  priceEuros: z.number('Prix requis').min(0, 'Le prix ne peut pas être négatif'),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

/** null = formulaire fermé, 'new' = création, sinon la prestation en cours d'édition */
type Editing = null | 'new' | ServiceOffering

export function ServicesAdminPage() {
  const { data, isPending, isError, error } = useAdminServices()
  const [editing, setEditing] = useState<Editing>(null)
  const deleteService = useDeleteService()

  const onDelete = (s: ServiceOffering) => {
    if (window.confirm(`Supprimer « ${s.name} » ?`)) deleteService.mutate(s.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">Les prestations inactives ne sont pas visibles par les clients.</p>
        {editing === null && <Button onClick={() => setEditing('new')}>Nouvelle prestation</Button>}
      </div>

      {editing !== null && (
        <ServiceForm
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      )}

      {deleteService.isError && <Alert>{deleteService.error.message}</Alert>}
      {isPending && <Spinner />}
      {isError && <Alert>{error.message}</Alert>}

      {data && (
        <Card className="overflow-x-auto" padding="p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Prestation</th>
                <th className="px-5 py-3 font-medium">Durée</th>
                <th className="px-5 py-3 font-medium">Prix</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((s) => (
                <tr key={s.id} className={s.active ? '' : 'text-muted'}>
                  <td className="px-5 py-3 font-medium">{s.name}</td>
                  <td className="px-5 py-3">{formatDuration(s.durationMinutes)}</td>
                  <td className="px-5 py-3">{formatPrice(s.priceCents)}</td>
                  <td className="px-5 py-3">
                    {s.active ? <Badge tone="brand">Active</Badge> : <Badge>Inactive</Badge>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" onClick={() => setEditing(s)}>
                      Modifier
                    </Button>
                    <Button variant="danger" onClick={() => onDelete(s)}>
                      Supprimer
                    </Button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted">
                    Aucune prestation. Créez la première !
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

function ServiceForm({ initial, onDone }: { initial?: ServiceOffering; onDone: () => void }) {
  const save = useSaveService()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          name: initial.name,
          description: initial.description ?? '',
          durationMinutes: initial.durationMinutes,
          priceEuros: initial.priceCents / 100,
          active: initial.active,
        }
      : { name: '', description: '', durationMinutes: 30, priceEuros: 0, active: true },
  })

  const onSubmit = (v: FormValues) =>
    save.mutate(
      {
        id: initial?.id,
        input: {
          name: v.name,
          description: v.description || null,
          durationMinutes: v.durationMinutes,
          priceCents: Math.round(v.priceEuros * 100), // les prix transitent en centimes
          active: v.active,
        },
      },
      { onSuccess: onDone },
    )

  return (
    <Card>
      <h2 className="mb-4 text-xl font-semibold">{initial ? 'Modifier la prestation' : 'Nouvelle prestation'}</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {save.isError && <Alert>{save.error.message}</Alert>}
        <Field label="Nom" htmlFor="name" error={errors.name?.message}>
          <Input id="name" aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Input id="description" {...register('description')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Durée (minutes)" htmlFor="durationMinutes" error={errors.durationMinutes?.message}>
            <Input
              id="durationMinutes"
              type="number"
              min={5}
              step={5}
              aria-invalid={!!errors.durationMinutes}
              {...register('durationMinutes', { valueAsNumber: true })}
            />
          </Field>
          <Field label="Prix (€)" htmlFor="priceEuros" error={errors.priceEuros?.message}>
            <Input
              id="priceEuros"
              type="number"
              min={0}
              step={0.5}
              aria-invalid={!!errors.priceEuros}
              {...register('priceEuros', { valueAsNumber: true })}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-brand" {...register('active')} />
          Visible par les clients
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onDone}>
            Annuler
          </Button>
          <Button type="submit" loading={save.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  )
}
