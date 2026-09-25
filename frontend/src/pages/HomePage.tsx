import { Link } from 'react-router'
import { useNextSlot } from '../api/appointments'
import { useClosures, useOpeningHours } from '../api/schedule'
import { useServices } from '../api/services'
import { useAuth } from '../auth/useAuth'
import { Alert, ButtonLink, Eyebrow, Icon, Spinner, type IconName } from '../components/ui'
import {
  DAYS,
  formatDate,
  formatDuration,
  formatHour,
  formatPrice,
  formatTime,
  relativeDay,
  todayInShop,
} from '../lib/format'
import { SHOP } from '../lib/shop'
import type { ServiceOffering } from '../lib/types'

export function HomePage() {
  const services = useServices()

  return (
    <>
      <Hero firstService={services.data?.[0]} />
      <Promises />

      <section id="prestations" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
            <div>
              <Eyebrow className="mb-3">La carte</Eyebrow>
              <h2 className="text-4xl font-medium sm:text-5xl">Nos prestations</h2>
            </div>
            <p className="text-muted md:text-right">
              Choisissez une prestation pour voir les créneaux libres. Le règlement se fait au salon.
            </p>
          </div>

          {services.isPending && <Spinner />}
          {services.isError && <Alert>{services.error.message}</Alert>}
          {services.data?.length === 0 && <p className="text-muted">Aucune prestation pour le moment.</p>}
          {services.data && services.data.length > 0 && <ServiceMenu services={services.data} />}
        </div>
      </section>

      <SalonInfo />
    </>
  )
}

// ---------- Hero ----------

function Hero({ firstService }: { firstService?: ServiceOffering }) {
  const { user } = useAuth()

  return (
    <section className="relative overflow-hidden">
      {/* Halo décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-accent-soft blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24 lg:pb-28">
        <div className="animate-fade-up">
          <Eyebrow className="mb-6">
            {SHOP.kind} · {SHOP.city}
          </Eyebrow>
          <h1 className="text-5xl leading-[1.05] font-medium sm:text-6xl lg:text-7xl">
            L'art de la coupe, <em className="font-normal text-brand italic">réservé en un clic.</em>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            {user
              ? `Ravi de vous revoir, ${user.firstName}. Choisissez votre prestation et votre créneau : c'est confirmé tout de suite.`
              : 'Choisissez votre prestation, votre jour et votre heure. Confirmation immédiate par email, sans appel ni attente.'}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ButtonLink to="/#prestations" size="lg">
              Prendre rendez-vous <Icon name="arrow" className="size-4" />
            </ButtonLink>
            <ButtonLink to="/#horaires" size="lg" variant="ghost">
              Horaires & accès
            </ButtonLink>
          </div>
        </div>

        <HeroVisual firstService={firstService} />
      </div>
    </section>
  )
}

/** Composition graphique : une arche (miroir de salon) et le prochain créneau réellement disponible. */
function HeroVisual({ firstService }: { firstService?: ServiceOffering }) {
  const next = useNextSlot(firstService?.id, todayInShop())

  return (
    <div className="relative mx-auto w-full max-w-[18rem] animate-fade-up [animation-delay:150ms] sm:max-w-md">
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-3xl bg-brand shadow-lift">
        <svg viewBox="0 0 400 500" className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <linearGradient id="arche" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2b6358" />
              <stop offset="1" stopColor="#10302a" />
            </linearGradient>
          </defs>
          <rect width="400" height="500" fill="url(#arche)" />
          {/* Arches concentriques, comme des reflets de miroir */}
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${60 + i * 28} 500 V${210 + i * 10} a${140 - i * 28} ${140 - i * 28} 0 0 1 ${280 - i * 56} 0 V500`}
              fill="none"
              stroke="#f5efe6"
              strokeOpacity={0.14 - i * 0.02}
              strokeWidth="1.5"
            />
          ))}
          {/* Ciseaux stylisés */}
          <g
            transform="translate(200 250) rotate(-35)"
            stroke="#b8864b"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          >
            <circle cx="-62" cy="-16" r="16" />
            <circle cx="-62" cy="16" r="16" />
            <path d="M-48 -8 L70 22 M-48 8 L70 -22" />
          </g>
        </svg>
      </div>

      {/* Carte flottante : prochain créneau */}
      <div className="absolute -bottom-8 -left-6 w-72 rounded-2xl border border-line bg-surface p-4 shadow-lift sm:-left-10">
        <p className="flex items-center gap-2 text-xs font-medium text-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/60" />
            <span className="relative inline-flex size-2 rounded-full bg-brand" />
          </span>
          Prochain créneau disponible
        </p>
        {next.data ? (
          <Link
            to={`/reserver/${firstService?.id}?date=${next.data.date}&start=${encodeURIComponent(next.data.slot.startAt)}`}
            className="group mt-2 block"
          >
            <p className="font-display text-xl first-letter:uppercase">
              {relativeDay(next.data.date)} · {formatHour(next.data.slot.time)}
            </p>
            <p className="mt-0.5 flex items-center justify-between text-sm text-muted">
              {firstService?.name}
              <Icon name="arrow" className="size-4 text-brand transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ) : (
          <p className="mt-2 font-display text-xl text-muted">{next.isPending ? 'Recherche…' : 'Bientôt'}</p>
        )}
      </div>

      <div className="absolute top-10 -right-6 flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium shadow-soft sm:-right-8">
        <Icon name="mail" className="size-4 text-accent" />
        Confirmation par email
      </div>
    </div>
  )
}

// ---------- Engagements ----------

const PROMISES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'calendar',
    title: 'Réservation 24 h/24',
    text: 'Les créneaux libres en temps réel, même quand le salon est fermé.',
  },
  {
    icon: 'mail',
    title: 'Confirmation immédiate',
    text: 'Un email récapitulatif dès que votre rendez-vous est enregistré.',
  },
  { icon: 'undo', title: 'Annulation libre', text: "Un empêchement ? Annulez en ligne jusqu'à 2 h avant, sans frais." },
]

function Promises() {
  return (
    <section className="border-t border-line">
      <ul className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        {PROMISES.map((p) => (
          <li key={p.title} className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Icon name={p.icon} />
            </span>
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

// ---------- Carte des prestations ----------

function ServiceMenu({ services }: { services: ServiceOffering[] }) {
  return (
    <ul className="grid gap-x-16 md:grid-cols-2">
      {services.map((s) => (
        <li key={s.id} className="border-b border-line">
          <Link
            to={`/reserver/${s.id}`}
            className="group -mx-4 flex flex-col gap-1.5 rounded-2xl px-4 py-6 transition-colors hover:bg-paper"
          >
            {/* Nom ····· prix, façon carte de restaurant */}
            <div className="flex items-baseline gap-3">
              <h3 className="font-display text-2xl">{s.name}</h3>
              <span aria-hidden className="mb-1.5 flex-1 border-b border-dotted border-ink/25" />
              <span className="font-display text-xl">{formatPrice(s.priceCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm text-muted">
              <span>
                {formatDuration(s.durationMinutes)}
                {s.description && <> · {s.description}</>}
              </span>
              <span className="flex shrink-0 items-center gap-1 font-medium text-brand opacity-70 transition-opacity group-hover:opacity-100">
                Réserver <Icon name="arrow" className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// ---------- Horaires & accès ----------

function SalonInfo() {
  const hours = useOpeningHours()
  const closures = useClosures()

  return (
    <section id="horaires" className="scroll-mt-20 bg-brand text-paper">
      <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <Eyebrow className="mb-3">Le salon</Eyebrow>
          <h2 className="text-4xl font-medium text-paper sm:text-5xl">Horaires & accès</h2>

          <ul className="mt-10 space-y-5 text-paper/85">
            <li className="flex items-start gap-4">
              <Icon name="pin" className="mt-0.5 size-5 text-accent" />
              {SHOP.address}
            </li>
            <li className="flex items-start gap-4">
              <Icon name="phone" className="mt-0.5 size-5 text-accent" />
              <a href={`tel:${SHOP.phone.replace(/\s/g, '')}`} className="hover:text-paper">
                {SHOP.phone}
              </a>
            </li>
          </ul>

          {closures.data && closures.data.length > 0 && (
            <div className="mt-10 rounded-2xl border border-paper/15 bg-paper/5 p-5">
              <p className="mb-2 text-sm font-medium text-accent">Fermetures exceptionnelles</p>
              <ul className="space-y-1 text-sm text-paper/85">
                {closures.data.map((c) => (
                  <li key={c.id}>
                    {c.startDate === c.endDate
                      ? `Le ${formatDate(c.startDate)}`
                      : `Du ${formatDate(c.startDate)} au ${formatDate(c.endDate)}`}
                    {c.reason && <span className="text-paper/60"> · {c.reason}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ButtonLink to="/#prestations" variant="light" size="lg" className="mt-10">
            Réserver un créneau <Icon name="arrow" className="size-4" />
          </ButtonLink>
        </div>

        <div className="rounded-3xl border border-paper/15 bg-paper/5 p-6 sm:p-8">
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-accent">
            <Icon name="clock" className="size-4" /> Heures d'ouverture
          </p>
          <dl className="divide-y divide-paper/10">
            {DAYS.map((day) => {
              const slots = hours.data?.filter((h) => h.dayOfWeek === day.value) ?? []
              return (
                <div key={day.value} className="flex justify-between gap-4 py-3.5">
                  <dt className="text-paper/70">{day.label}</dt>
                  <dd className={slots.length ? 'text-right font-medium text-paper' : 'text-right text-paper/40'}>
                    {slots.length === 0
                      ? 'Fermé'
                      : slots.map((s) => `${formatTime(s.opensAt)} – ${formatTime(s.closesAt)}`).join('  ·  ')}
                  </dd>
                </div>
              )
            })}
          </dl>
        </div>
      </div>
    </section>
  )
}
