'use client'

/**
 * PrintButton.tsx
 * WAT: Client-knop die window.print() triggert — voor de standalone CV-pagina.
 */

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer className="size-4" />
      Afdrukken / PDF
    </Button>
  )
}
