/**
 * candidate/page.tsx
 * WAT:    Login-scherm voor kandidaten om hun eigen sollicitatiestatus te bekijken.
 */

import { PortalLogin } from '@/components/portal/PortalLogin'

export default function CandidateLoginPage() {
  return <PortalLogin variant="candidate" title="Mijn sollicitatie" subtitle="Log in om je sollicitaties en profiel te bekijken." />
}
