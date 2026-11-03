'use client'

/**
 * NotificationDrawer.tsx
 * WAT:    Bel in de topbalk met een teller; opent rechts een paneel met alles wat nu aandacht vraagt
 *         (contracten, badges, proeftijdevaluaties, overeenkomsten, sollicitaties, klantaanvragen, mail).
 * WAAROM: De lijst wordt op de server berekend uit de gegevens zelf: een melding verdwijnt vanzelf zodra
 *         het punt is opgelost. Het paneel sluit na het kiezen van een melding (zelfde aanpak als het mobiele menu).
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { AdminNotification } from '@/services/queries'
import { cn } from '@/lib/utils'

const ICON = {
  error: <CircleAlert className="size-4 text-destructive" aria-label="Dringend" />,
  warn: <TriangleAlert className="size-4 text-amber-500" aria-label="Aandacht" />,
  info: <Info className="size-4 text-[var(--color-brand-green)]" aria-label="Info" />,
}

const FILTERS = [
  { key: 'all', label: 'Alles' },
  { key: 'urgent', label: 'Actie nodig' },
  { key: 'info', label: 'Nieuw' },
] as const

export function NotificationDrawer({ items }: { items: AdminNotification[] }) {
  const pathname = usePathname()
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')
  const open = openedAt === pathname

  const urgent = items.filter((i) => i.level !== 'info').length
  const shown = items.filter((i) => (filter === 'all' ? true : filter === 'urgent' ? i.level !== 'info' : i.level === 'info'))
  const groups = [...new Set(shown.map((i) => i.group))]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenedAt(pathname)}
        className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-background text-foreground hover:bg-muted"
        aria-label={items.length > 0 ? `${items.length} meldingen, ${urgent} met actie` : 'Geen meldingen'}
        title="Meldingen"
      >
        <Bell className="size-4" />
        {items.length > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white',
              urgent > 0 ? 'bg-destructive' : 'bg-[var(--color-brand-green)]'
            )}
          >
            {items.length > 99 ? '99+' : items.length}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={(next) => setOpenedAt(next ? pathname : null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle>Meldingen</SheetTitle>
            <SheetDescription>
              {items.length === 0 ? 'Alles is bijgewerkt.' : `${items.length} melding${items.length === 1 ? '' : 'en'}, waarvan ${urgent} met actie.`}
            </SheetDescription>
            <div className="mt-2 flex gap-1 text-sm">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-full border px-3 py-1',
                    filter === f.key ? 'border-primary bg-primary/10 font-medium text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {shown.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-muted-foreground">Geen meldingen in deze selectie.</p>
            ) : (
              groups.map((group) => (
                <section key={group} className="mb-4">
                  <h3 className="mb-1 px-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">{group}</h3>
                  <ul className="space-y-1">
                    {shown
                      .filter((i) => i.group === group)
                      .map((i) => (
                        <li key={i.key}>
                          <Link href={i.href} className="flex items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted">
                            <span className="mt-0.5 shrink-0">{ICON[i.level]}</span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground">{i.title}</span>
                              <span className="block text-xs text-muted-foreground">{i.detail}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </section>
              ))
            )}
          </div>

          <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Meldingen verdwijnen vanzelf zodra het punt is opgelost.{' '}
            <Link href="/admin/validity" className="font-medium text-primary hover:underline">
              Alles wat afloopt
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
