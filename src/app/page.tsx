/**
 * page.tsx (home)
 * WAT:    Landingspagina met links naar het sollicitatieformulier en het staff-portaal.
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Pansa Group of Companies
      </p>
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
        Applicant Tracking System
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Solliciteer bij CCC H. Pansa &amp; Sons N.V. en de andere bedrijven binnen de Pansa Group
        voor manpower- en outsourcing-plaatsingen in de industriële en mijnbouwsector.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button className="w-full sm:w-auto" render={<Link href="/apply" />}>
          Solliciteer nu
        </Button>
        <Button variant="secondary" className="w-full sm:w-auto" render={<Link href="/admin" />}>
          Staff / Admin login
        </Button>
      </div>
      <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
        <Link href="/client" className="hover:text-foreground hover:underline">
          Klantportaal
        </Link>
        <Link href="/candidate" className="hover:text-foreground hover:underline">
          Mijn sollicitatie
        </Link>
      </div>
    </main>
  )
}
