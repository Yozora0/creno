import { useContext } from 'react'
import { ToastContext } from './context'

/** Affiche un message éphémère en bas de l'écran : `const toast = useToast(); toast('Enregistré')`. */
export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast doit être utilisé dans <ToastProvider>')
  return show
}
