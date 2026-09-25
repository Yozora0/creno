import type { ReactNode } from 'react'
import { Page, PageHeader } from '../components/ui'
import { SHOP } from '../lib/shop'

const LAST_UPDATE = '25 septembre 2026'

/**
 * Mentions légales (loi n° 2004-575 du 21 juin 2004, LCEN) et information RGPD (art. 13).
 * Site de démonstration : l'éditeur est l'auteur du projet, le salon est fictif.
 */
export function LegalPage() {
  return (
    <Page narrow>
      <PageHeader
        eyebrow="Informations"
        title="Mentions légales"
        description={`Dernière mise à jour : ${LAST_UPDATE}.`}
      />

      <div className="mb-10 rounded-2xl border border-accent/40 bg-accent-soft/50 p-5 text-sm leading-relaxed">
        <strong className="font-semibold">Site de démonstration.</strong> {SHOP.name} est un salon fictif créé pour
        illustrer le projet Créno. Aucune prestation n'est réellement vendue et aucun rendez-vous pris sur ce site ne
        sera honoré.
      </div>

      <div className="space-y-12">
        <Section id="editeur" title="Éditeur du site">
          <p>
            Ce site est édité à titre personnel et non commercial par <strong>Pablo Correia Mourato</strong>, étudiant
            en développement web, dans le cadre de son portfolio.
          </p>
          <p>
            Contact : via le formulaire du site{' '}
            <a href="https://pablomourato.fr" className="font-medium text-brand underline underline-offset-2">
              pablomourato.fr
            </a>
            .
          </p>
          <p>Directeur de la publication : Pablo Correia Mourato.</p>
        </Section>

        <Section id="hebergement" title="Hébergement">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Host
              role="Application (interface)"
              name="Vercel Inc."
              address="440 N Barranca Ave #4133, Covina, CA 91723, États-Unis"
              url="https://vercel.com"
            />
            <Host
              role="API et base de données"
              name="Render Services, Inc."
              address="525 Brannan St, Suite 300, San Francisco, CA 94107, États-Unis"
              url="https://render.com"
            />
          </dl>
        </Section>

        <Section id="donnees" title="Données personnelles">
          <p>
            Le responsable du traitement est l'éditeur du site. Les données sont traitées conformément au Règlement
            général sur la protection des données (RGPD) et à la loi Informatique et Libertés.
          </p>
          <Table
            rows={[
              [
                'Données collectées',
                'Prénom, nom, adresse email, téléphone (facultatif), mot de passe chiffré, rendez-vous pris.',
              ],
              [
                'Finalité',
                "Créer votre compte, gérer vos rendez-vous et vous envoyer les emails de confirmation ou d'annulation.",
              ],
              ['Base légale', 'Exécution du service que vous demandez (article 6.1.b du RGPD).'],
              [
                'Destinataires',
                'Uniquement le salon (pour organiser son planning) et les hébergeurs techniques cités plus haut.',
              ],
              [
                'Durée de conservation',
                "Tant que le compte existe. S'agissant d'une démonstration, la base peut être réinitialisée à tout moment.",
              ],
              [
                'Transferts hors UE',
                'Les hébergeurs sont situés aux États-Unis et encadrés par des clauses contractuelles types.',
              ],
            ]}
          />
          <p>
            Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de
            portabilité de vos données. Pour l'exercer, contactez l'éditeur via{' '}
            <a href="https://pablomourato.fr" className="font-medium text-brand underline underline-offset-2">
              pablomourato.fr
            </a>
            . Vous pouvez aussi adresser une réclamation à la{' '}
            <a href="https://www.cnil.fr/fr/plaintes" className="font-medium text-brand underline underline-offset-2">
              CNIL
            </a>
            .
          </p>
          <p>
            Merci de ne pas saisir de données réelles sensibles : ce site est une démonstration, utilisez de préférence
            les comptes de test proposés sur la page de connexion.
          </p>
        </Section>

        <Section id="cookies" title="Cookies et stockage local">
          <p>
            Ce site ne dépose <strong>aucun cookie</strong> et n'utilise aucun outil de mesure d'audience ni de
            publicité. Lorsque vous vous connectez, un jeton de session est enregistré dans le stockage local de votre
            navigateur afin de vous garder connecté. Ce stockage est strictement nécessaire au service et ne requiert
            donc pas de consentement ; il est effacé à la déconnexion.
          </p>
          <p>
            Les polices de caractères (Fraunces, Inter) sont hébergées sur le site : aucune requête n'est faite vers un
            service tiers.
          </p>
        </Section>

        <Section id="propriete" title="Propriété intellectuelle">
          <p>
            Le code, le design et les textes de ce site sont la propriété de leur auteur, sauf mention contraire. Les
            polices Fraunces et Inter sont distribuées sous licence SIL Open Font License. Toute reproduction du contenu
            sans autorisation est interdite.
          </p>
        </Section>
      </div>
    </Page>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-2xl font-medium">{title}</h2>
      <div className="space-y-4 leading-relaxed text-ink/85">{children}</div>
    </section>
  )
}

function Host({ role, name, address, url }: { role: string; name: string; address: string; url: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <dt className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{role}</dt>
      <dd className="mt-2 space-y-1 text-sm">
        <p className="font-medium text-ink">{name}</p>
        <p className="text-muted">{address}</p>
        <a href={url} className="text-brand underline underline-offset-2">
          {url.replace('https://', '')}
        </a>
      </dd>
    </div>
  )
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-line">
          {rows.map(([label, value]) => (
            <tr key={label} className="align-top">
              <th scope="row" className="w-1/3 px-5 py-3.5 font-medium">
                {label}
              </th>
              <td className="px-5 py-3.5 text-muted">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
