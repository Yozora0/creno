import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { useAuth } from '../auth/useAuth'
import { Alert, Button, Card, Field, Input } from '../components/ui'

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Adresse email invalide')),
  password: z.string().min(1, 'Mot de passe requis'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      const user = await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? (user.role === 'ADMIN' ? '/admin' : '/'), { replace: true })
    } catch (e) {
      setServerError((e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-3xl font-semibold">Connexion</h1>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && <Alert>{serverError}</Alert>}
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
          </Field>
          <Field label="Mot de passe" htmlFor="password" error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">
            Se connecter
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-medium text-brand hover:underline">
          Créer un compte
        </Link>
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-line p-4 text-xs text-muted">
        <p className="font-medium text-ink">Comptes de démonstration</p>
        <p className="mt-1">Commerçant : admin@creno.dev / Admin123!</p>
        <p>Client : client@creno.dev / Client123!</p>
      </div>
    </div>
  )
}
