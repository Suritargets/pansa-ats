/**
 * KpiCard.tsx
 * WAT:    KPI-kaart in de Pansa-rapportagestijl: icoontegel in donkergroen, grote waarde met label,
 *         trend t.o.v. de vorige maand en (optioneel) een sparkline.
 * WAAROM: Eén kaart voor Rapportages en Dashboard zodat cijfers overal hetzelfde ogen.
 */

import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { MiniBars, Sparkline } from '@/components/admin/charts'
import { cn } from '@/lib/utils'

export function KpiCard({
  icon: Icon,
  value,
  label,
  trend,
  sparkline,
  bars,
  warn = false,
}: {
  icon: LucideIcon
  value: string | number
  label: string
  /** Verandering t.o.v. de vorige maand; `null` toont een streepje (niet te berekenen). Weglaten = geen trendregel. */
  trend?: { delta: number | null; unit: '%' | 'pt' }
  sparkline?: number[]
  /** Zoals `sparkline`, maar als mini-staafjes (dashboard-ontwerp). */
  bars?: number[]
  /** Kleurt de waarde rood als er aandacht nodig is (bv. verlopende contracten). */
  warn?: boolean
}) {
  const direction = trend?.delta == null ? 'flat' : trend.delta > 0 ? 'up' : trend.delta < 0 ? 'down' : 'flat'
  const TrendIcon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/8">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-deep)] text-white shadow-sm">
          <Icon className="size-7" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className={cn('font-heading text-4xl leading-none font-semibold tabular-nums', warn && Number(value) > 0 ? 'text-destructive' : 'text-foreground')}>
            {value}
          </p>
          <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
        </div>
      </div>

      {trend && (
        <div className="flex items-end justify-between gap-2">
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-semibold',
              direction === 'up' && 'text-primary',
              direction === 'down' && 'text-destructive',
              direction === 'flat' && 'text-muted-foreground'
            )}
          >
            <TrendIcon className="size-4" />
            <span className="tabular-nums">
              {trend.delta == null ? '—' : `${trend.delta > 0 ? '+' : ''}${trend.delta}${trend.unit === 'pt' ? ' pt' : '%'}`}
            </span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">vs vorige maand</span>
          </div>
          {sparkline && <Sparkline values={sparkline} className="text-primary" />}
          {bars && <MiniBars values={bars} className="text-primary" />}
        </div>
      )}
    </div>
  )
}
