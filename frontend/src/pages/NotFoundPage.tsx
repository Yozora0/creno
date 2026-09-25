import { ButtonLink, Page } from '../components/ui'

export function NotFoundPage() {
  return (
    <Page narrow className="py-24 text-center">
      <p className="font-display text-8xl text-accent italic">404</p>
      <h1 className="mt-4 text-3xl font-medium">Cette page n'existe pas</h1>
      <p className="mt-2 text-muted">Le lien est peut-être incorrect ou la page a été déplacée.</p>
      <ButtonLink to="/" className="mt-8">
        Retour à l'accueil
      </ButtonLink>
    </Page>
  )
}
