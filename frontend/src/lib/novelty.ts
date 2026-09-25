/**
 * Un RDV est « nouveau » s'il a été pris depuis la connexion précédente de l'utilisateur.
 * Sans connexion précédente (compte tout juste créé), tout ce qu'il a réservé est nouveau.
 */
export function isNewSince(createdAt: string, previousLoginAt: string | null | undefined) {
  if (!previousLoginAt) return true
  return new Date(createdAt).getTime() > new Date(previousLoginAt).getTime()
}
