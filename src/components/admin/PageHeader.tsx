/**
 * PageHeader.tsx
 * WAT:    Standaard paginakop voor lijst- en beheerschermen: titel (+ aantal), ondertitel en rechts
 *         de filters/zoekbalk/actieknop. Zelfde opzet als het Pansa-dashboardontwerp.
 */

export function PageHeader({
  title,
  subtitle,
  count,
  children,
}: {
  title: string
  subtitle?: string
  count?: number
  children?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-semibold text-foreground">
          {title}
          {count !== undefined && <span className="ml-2 text-2xl text-muted-foreground">({count})</span>}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
