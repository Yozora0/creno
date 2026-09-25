import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-6xl font-semibold text-brand">404</p>
      <h1 className="mt-4 text-2xl font-semibold">Cette page n'existe pas</h1>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
        Retour à l'accueil
      </Link>
    </div>
  )
}
