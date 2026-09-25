import type { ReactNode } from 'react'
import { SHOP } from '../lib/shop'
import { Eyebrow, Icon } from './ui'

/** Mise en page commune connexion / inscription : panneau de marque à gauche, formulaire à droite. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-line bg-surface shadow-lift lg:grid-cols-2">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-paper lg:flex">
          <div aria-hidden className="absolute -right-24 -bottom-24 size-80 rounded-full border border-paper/10" />
          <div aria-hidden className="absolute -right-10 -bottom-10 size-52 rounded-full border border-paper/10" />
          <div>
            <Eyebrow className="mb-4">{SHOP.name}</Eyebrow>
            <p className="font-display text-4xl leading-tight">
              Votre prochain rendez-vous, <em className="text-accent-soft italic">à deux clics.</em>
            </p>
          </div>
          <ul className="relative space-y-3 text-sm text-paper/80">
            {[
              'Créneaux libres en temps réel',
              'Confirmation immédiate par email',
              "Annulation en ligne jusqu'à 2 h avant",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Icon name="check" className="size-4 text-accent" />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <div className="p-6 sm:p-12">
          <h1 className="text-4xl font-medium">{title}</h1>
          <p className="mt-2 mb-8 text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
