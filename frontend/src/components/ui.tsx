import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'bg-surface text-ink border border-line hover:border-ink/40',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'text-danger hover:bg-danger-soft',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm transition-colors placeholder:text-muted/70 ' +
  'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 aria-invalid:border-danger'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(inputClass, className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return <select ref={ref} className={cx(inputClass, className)} {...props} />
  },
)

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  )
}

/** padding : classe de marge interne (p-6 par défaut). Passée à part pour ne pas entrer en conflit avec className. */
export function Card({ className, padding = 'p-6', children }: { className?: string; padding?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-surface', padding, className)}>{children}</div>
}

export function Alert({ tone = 'danger', children }: { tone?: 'danger' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(
        'rounded-lg px-4 py-3 text-sm',
        tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-brand-soft text-brand',
      )}
    >
      {children}
    </div>
  )
}

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      {label}
    </div>
  )
}

const badgeTones = {
  neutral: 'bg-ink/5 text-muted',
  brand: 'bg-brand-soft text-brand',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  )
}
