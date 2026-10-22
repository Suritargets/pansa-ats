/**
 * charts.tsx
 * WAT:    Kleine SVG-grafieken voor Rapportages en Dashboard: sparkline, staafdiagram, donut.
 * WAAROM: Pure server components zonder chart-bibliotheek — de datasets zijn klein (12 maanden,
 *         5 statussen) en SVG houdt de bundel leeg en de grafiek printbaar. Elke grafiek heeft een
 *         tekstalternatief (`aria-label` + sr-only tabel) zodat de cijfers ook zonder zicht leesbaar zijn.
 */

import { cn } from '@/lib/utils'

/** Lijntje met zacht gevuld vlak, in de huidige tekstkleur (`currentColor`). */
export function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const width = 120
  const height = 36
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const step = values.length > 1 ? width / (values.length - 1) : width
  const points = values.map((v, i) => [i * step, height - 4 - ((v - min) / span) * (height - 10)] as const)
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-9 w-28', className)} aria-hidden="true" preserveAspectRatio="none">
      <path d={area} fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function niceMax(value: number): number {
  if (value <= 5) return 5
  const step = value <= 20 ? 5 : value <= 50 ? 10 : 20
  return Math.ceil(value / step) * step
}

export function BarChart({
  labels,
  values,
  unit = 'plaatsingen',
}: {
  labels: string[]
  values: number[]
  unit?: string
}) {
  const width = 640
  const height = 260
  const pad = { top: 12, right: 8, bottom: 28, left: 32 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const max = niceMax(Math.max(...values, 0))
  const ticks = 4
  const slot = innerW / values.length
  const barW = slot * 0.62

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Staafdiagram ${unit} per maand: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}`}
      >
        <defs>
          <linearGradient id="bar-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-lime)" />
            <stop offset="100%" stopColor="var(--color-brand-green)" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const value = (max / ticks) * i
          const y = pad.top + innerH - (value / max) * innerH
          return (
            <g key={i}>
              <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="currentColor" opacity={i === 0 ? 0.25 : 0.1} strokeDasharray={i === 0 ? undefined : '3 4'} />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                {Math.round(value)}
              </text>
            </g>
          )
        })}
        {values.map((v, i) => {
          const h = (v / max) * innerH
          const x = pad.left + slot * i + (slot - barW) / 2
          const y = pad.top + innerH - h
          return (
            <g key={labels[i]}>
              {v > 0 && <rect x={x} y={y} width={barW} height={h} rx="3" fill="url(#bar-fill)" />}
              <text x={x + barW / 2} y={height - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                {labels[i]}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="sr-only">
        <table>
          <caption>{unit} per maand</caption>
          <tbody>
            {labels.map((label, i) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{values[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}

export interface DonutSlice {
  key: string
  label: string
  count: number
  /** CSS-kleur, bv. `var(--status-new)`. */
  color: string
}

export function DonutChart({ slices, totalLabel = 'totaal' }: { slices: DonutSlice[]; totalLabel?: string }) {
  const total = slices.reduce((sum, s) => sum + s.count, 0)
  const size = 220
  const stroke = 38
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-52 shrink-0 -rotate-90"
        role="img"
        aria-label={`Kandidaten per status: ${slices.map((s) => `${s.label} ${s.count}`).join(', ')}`}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" opacity="0.08" strokeWidth={stroke} />
        {total > 0 &&
          slices
            .filter((s) => s.count > 0)
            .map((slice) => {
              const length = (slice.count / total) * circumference
              const circle = (
                <circle
                  key={slice.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`}
                  strokeDashoffset={-offset}
                />
              )
              offset += length
              return circle
            })}
        <g className="rotate-90 origin-center">
          <text x={size / 2} y={size / 2 + 2} textAnchor="middle" className="fill-foreground font-heading text-[40px] font-semibold">
            {total}
          </text>
          <text x={size / 2} y={size / 2 + 22} textAnchor="middle" className="fill-muted-foreground text-[12px]">
            {totalLabel}
          </text>
        </g>
      </svg>

      <ul className="min-w-48 space-y-2.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-3">
            <span className="size-3.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
            <span className="flex-1 text-foreground">{slice.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {total > 0 ? Math.round((slice.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
