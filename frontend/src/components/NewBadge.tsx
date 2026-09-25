/** Petit tag doré « Nouveau ». */
export function NewBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-sans text-[10px] font-semibold tracking-wider text-white uppercase">
      <span className="size-1.5 rounded-full bg-white/90" aria-hidden />
      Nouveau
    </span>
  )
}
