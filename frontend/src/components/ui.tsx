import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from '../lib/cx'

// ---------- Boutons ----------

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'light'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-soft hover:bg-brand-hover',
  secondary: 'bg-surface text-ink border border-line hover:border-ink/30',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'text-danger hover:bg-danger-soft',
  light: 'bg-paper text-brand-deep hover:bg-white', // sur fond sombre
}

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(buttonBase, sizes[size], variants[variant], className)}
      {...props}
    >
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

/** Lien stylé comme un bouton (navigation, pas d'action). */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={cx(buttonBase, sizes[size], variants[variant], className)} {...props} />
}

// ---------- Formulaires ----------

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition-colors placeholder:text-muted/60 ' +
  'focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10 aria-invalid:border-danger'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cx(inputClass, className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, ...props },
  ref,
) {
  return <select ref={ref} className={cx(inputClass, className)} {...props} />
})

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

// ---------- Mise en page ----------

/** padding : classe de marge interne (p-6 par défaut). Passée à part pour ne pas entrer en conflit avec className. */
export function Card({
  className,
  padding = 'p-6',
  children,
}: {
  className?: string
  padding?: string
  children: ReactNode
}) {
  return (
    <div className={cx('rounded-2xl border border-line bg-surface shadow-soft', padding, className)}>{children}</div>
  )
}

/** Conteneur standard des pages. */
export function Page({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return (
    <div className={cx('mx-auto px-4 py-12 sm:px-6 sm:py-16', narrow ? 'max-w-3xl' : 'max-w-6xl', className)}>
      {children}
    </div>
  )
}

/** Petit sur-titre en capitales, précédé d'un filet doré. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cx('flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-accent uppercase', className)}
    >
      <span className="h-px w-8 bg-accent" aria-hidden />
      {children}
    </p>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h1 className="text-4xl font-medium sm:text-5xl">{title}</h1>
        {description && <p className="mt-3 text-muted">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

// ---------- Retours ----------

export function Alert({ tone = 'danger', children }: { tone?: 'danger' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cx(
        'rounded-xl px-4 py-3 text-sm',
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
  accent: 'bg-accent-soft text-accent',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', badgeTones[tone])}>
      {children}
    </span>
  )
}

// ---------- Icônes (traits fins, héritent de la couleur du texte) ----------

const iconPaths = {
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  phone: 'M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.1 7.9 20 20M8.1 16.1 20 4',
} as const

export type IconName = keyof typeof iconPaths

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}
