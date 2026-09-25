/** Concatène des classes CSS en ignorant les valeurs falsy. */
export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')
