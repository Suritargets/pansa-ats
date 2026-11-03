/**
 * AuthShell.tsx
 * WAT:    Gedeelde omlijsting voor inlog- en wachtwoordpagina's (staff, kandidaat, klant): lichte foto-
 *         achtergrond, logo, kop en een witte kaart — dezelfde look als de voorpagina.
 */

import { LogoMark } from '@/components/landing/LogoMark'
import { logoSrc } from '@/components/landing/PublicShell'

export function AuthShell({
  title,
  subtitle,
  accent = 'var(--color-brand-lime)',
  children,
  footer,
}: {
  title: string
  subtitle?: string
  accent?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <main
      className="flex min-h-dvh flex-col bg-[#0b100c] bg-cover bg-center px-5 py-8 text-white"
      style={{
        // Lichte laag bovenin zodat het donkere logo leesbaar is; de foto blijft zichtbaar.
        backgroundImage:
          'linear-gradient(180deg,rgba(255,255,255,.88) 0%,rgba(255,255,255,.4) 32%,rgba(11,16,12,.15) 55%,rgba(11,16,12,.55) 100%),url(/landing/hero.jpg)',
        ['--mode' as string]: accent,
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark src={logoSrc()} size={110} />
          <p className="mt-2 text-[11px] font-bold tracking-wider text-[#1f4d27] uppercase">The moving force of the industries</p>
        </div>

        <h1 className="font-sans text-3xl font-black italic drop-shadow-[0_1px_3px_rgba(0,0,0,.6)]">{title}</h1>
        {subtitle && <p className="mt-1 mb-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.7)]">{subtitle}</p>}

        <div className="mt-5 rounded-2xl bg-white p-5 text-[#10150f] shadow-xl">{children}</div>

        {footer && <div className="mt-6 flex flex-col items-center gap-2 text-sm text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.7)]">{footer}</div>}
      </div>
    </main>
  )
}
