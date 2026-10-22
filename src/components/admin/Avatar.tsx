/**
 * Avatar.tsx
 * WAT:    Initialen-cirkel voor kandidaten/gebruikers in lijsten en profielkoppen — er worden geen
 *         portretfoto's opgeslagen, dus initialen op donkergroen zijn de vaste vorm.
 */

import { cn } from '@/lib/utils'

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-deep)] font-semibold text-white',
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-20 text-2xl ring-4 ring-[var(--color-brand-lime)]',
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
