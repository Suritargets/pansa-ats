/**
 * page.tsx (home)
 * WAT:    Publieke voorpagina — kandidaten (Werkzoeken) en bedrijven (Voor bedrijven), naar het
 *         Pansa-ontwerp. Data en logo komen van de server; de modus-schakelaar is client-side.
 */

import { getLandingData } from '@/services/queries'
import { LandingPage, type LandingMode } from '@/components/landing/LandingPage'
import { logoSrc } from '@/components/landing/PublicShell'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const [{ mode }, data] = await Promise.all([searchParams, getLandingData()])
  const initialMode: LandingMode = mode === 'bedrijven' ? 'bedrijven' : 'werkzoeken'


  return <LandingPage data={data} initialMode={initialMode} logoSrc={logoSrc()} />
}
