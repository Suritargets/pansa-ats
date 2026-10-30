'use client'

/**
 * MobileAdminNav.tsx
 * WAT:    Hamburgerknop + inschuivend menu (Sheet) met dezelfde navigatie als de sidebar, voor admin op
 *         telefoon en tablet (< lg, waar de vaste sidebar verborgen is).
 * WAAROM: Het menu sluit zichzelf na het kiezen van een pagina: "open" is gekoppeld aan het pad waarop
 *         het geopend werd, dus een andere route betekent automatisch dicht.
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from '@/components/admin/Sidebar'
import type { UserRole } from '../../../drizzle/schema'

export function MobileAdminNav({ role, openGroups }: { role: UserRole; openGroups: string[] }) {
  const pathname = usePathname()
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const open = openedAt === pathname

  return (
    <>
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu openen" onClick={() => setOpenedAt(pathname)}>
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={(next) => setOpenedAt(next ? pathname : null)}>
        <SheetContent side="left" className="w-72 max-w-[85vw] border-r-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-xs">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>Navigatie van Pansa ATS</SheetDescription>
          </SheetHeader>
          <Sidebar role={role} initialCollapsed={false} initialOpenGroups={openGroups} embedded />
        </SheetContent>
      </Sheet>
    </>
  )
}
