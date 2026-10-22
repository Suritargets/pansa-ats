/**
 * PageHero.tsx
 * WAT:    Paginakop in het Pansa-dashboardontwerp: eyebrow, grote titel, ondertitel, rechts een
 *         vervagende foto met groene diagonaal en een actie (bv. jaarkeuze).
 * WAAROM: Server component; de foto komt uit /public/landing (zelfde set als de voorpagina).
 */

export function PageHero({
  eyebrow = 'Pansa ATS',
  title,
  subtitle,
  image = 'hero',
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  /** Bestandsnaam in /public/landing zonder extensie. */
  image?: string
  action?: React.ReactNode
}) {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8">
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-full bg-cover bg-[center_30%] md:w-3/5"
        style={{ backgroundImage: `url(/landing/${image}.jpg)` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,var(--card)_0%,var(--card)_38%,color-mix(in_oklab,var(--card)_55%,transparent)_58%,transparent_100%)] md:bg-[linear-gradient(90deg,var(--card)_0%,var(--card)_42%,color-mix(in_oklab,var(--card)_60%,transparent)_60%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute top-0 right-[28%] hidden h-full w-24 -skew-x-[18deg] bg-[color-mix(in_oklab,var(--color-brand-green)_28%,transparent)] md:block"
      />

      <div className="relative flex flex-wrap items-end justify-between gap-4 px-6 py-6 sm:px-8">
        <div>
          <p className="text-sm font-bold tracking-[0.2em] text-muted-foreground uppercase">{eyebrow}</p>
          <h1 className="mt-1 text-5xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  )
}
