/**
 * Mêmes listes blanches que le back (InputPatterns.java). Côté front, elles servent au confort :
 * l'erreur s'affiche avant l'envoi. La vraie protection reste la validation de l'API.
 */

/** Lettres (tous alphabets, accents), espaces, apostrophes, points et tirets. */
export const PERSON_NAME = /^\p{L}[\p{L}\p{M} '’.-]*$/u
export const PERSON_NAME_MESSAGE = 'Uniquement des lettres, espaces, apostrophes ou tirets'

/** Texte sur une ligne, sans caractère de contrôle (retour à la ligne, tabulation…). */
// eslint-disable-next-line no-control-regex
export const SINGLE_LINE_TEXT = /^[^\u0000-\u001f\u007f]*$/
export const SINGLE_LINE_TEXT_MESSAGE = 'Caractères non autorisés'
