import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { useAuth } from '../auth/useAuth'
import { AuthShell } from '../components/AuthShell'
import { Alert, Button, Field, Input } from '../components/ui'

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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', password, { shouldValidate: true })
  }

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
    <AuthShell title="Connexion" subtitle="Accédez à vos rendez-vous et réservez en quelques secondes.">
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
        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-medium text-brand hover:underline">
          Créer un compte
        </Link>
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-accent/50 bg-accent-soft/40 p-4">
        <p className="text-sm font-medium">Comptes de démonstration</p>
        <p className="mt-1 text-xs text-muted">Un clic remplit le formulaire.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fillDemo('client@creno.dev', 'Client123!')}
          >
            Client · Léa
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => fillDemo('admin@creno.dev', 'Admin123!')}>
            Commerçant · Camille
          </Button>
        </div>
      </div>
    </AuthShell>
  )
}
