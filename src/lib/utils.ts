import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return format(date, "d MMM yyyy", { locale: nl })
}

export function daysSince(value: string | Date): number {
  const start = typeof value === "string" ? new Date(value) : value
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24)))
}
