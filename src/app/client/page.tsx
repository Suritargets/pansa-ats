/**
 * client/page.tsx
 * WAT:    Login-scherm voor klantaccounts (mijnbouwbedrijven zoals ZIJIN-RGM).
 */

import { PortalLogin } from '@/components/portal/PortalLogin'

export default function ClientLoginPage() {
  return (
    <PortalLogin
      variant="client"
      title="Klantportaal"
      subtitle="Bekijk gedeelde kandidaatprofielen en plaats vacature-aanvragen."
    />
  )
}
