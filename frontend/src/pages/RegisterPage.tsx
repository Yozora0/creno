import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { useAuth } from '../auth/useAuth'
import { Alert, Button, Card, Field, Input } from '../components/ui'
import { ApiError } from '../lib/api'

// Mêmes règles que le back (RegisterRequest.java) : le front valide pour le confort,
// le back valide pour la sécurité.
const schema = z.object({
  firstName: z.string().trim().min(1, 'Prénom requis').max(100),
  lastName: z.string().trim().min(1, 'Nom requis').max(100),
  email: z.string().trim().toLowerCase().pipe(z.email('Adresse email invalide')),
  phone: z
    .string()
    .trim()
    .regex(/^$|^[+0-9 .-]{6,30}$/, 'Numéro de téléphone invalide')
    .optional(),
  password: z.string().min(8, 'Au moins 8 caractères').max(72),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await registerUser(values)
      navigate('/', { replace: true })
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fieldErrors).length > 0) {
        // Les erreurs de validation du back s'affichent sous les bons champs.
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          setError(field as keyof FormValues, { message })
        }
      } else {
        setServerError((e as Error).message)
      }
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-semibold">Créer un compte</h1>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && <Alert>{serverError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" htmlFor="firstName" error={errors.firstName?.message}>
              <Input id="firstName" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register('firstName')} />
            </Field>
            <Field label="Nom" htmlFor="lastName" error={errors.lastName?.message}>
              <Input id="lastName" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register('lastName')} />
            </Field>
          </div>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
          </Field>
          <Field label="Téléphone" htmlFor="phone" error={errors.phone?.message} hint="Facultatif, pour être prévenu en cas d'imprévu.">
            <Input id="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...register('phone')} />
          </Field>
          <Field label="Mot de passe" htmlFor="password" error={errors.password?.message} hint="8 caractères minimum.">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Créer mon compte
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-muted">
        Déjà inscrit ?{' '}
        <Link to="/connexion" className="font-medium text-brand hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
