/**
 * nav.ts
 * WAT:    Navigatiestructuur voor de drie shells (admin-sidebar, client-topbar, candidate-topbar).
 */

import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Building2,
  ClipboardList,
  Download,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  ListChecks,
  ScanLine,
  Settings,
  Share2,
  Tags,
  Truck,
  Users,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  label?: string
  items: NavItem[]
  /** Alleen tonen als de sessie-rol in deze lijst zit; ontbreekt = voor alle staff-rollen. */
  roles?: string[]
}

export const ADMIN_NAV: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Kandidaten', href: '/admin/candidates', icon: Users },
      { label: 'Clienten', href: '/admin/clients', icon: Building2 },
      { label: 'Leverancier/Relatie', href: '/admin/suppliers', icon: Truck },
    ],
  },
  {
    label: 'Werving & Selectie',
    items: [
      { label: 'Sollicitaties', href: '/admin/applications', icon: ClipboardList },
      { label: 'Digitaliseren', href: '/admin/digitize', icon: ScanLine },
    ],
  },
  {
    label: 'Clientzone',
    items: [
      { label: 'Vacature-aanvragen', href: '/admin/client-requests', icon: Inbox },
      { label: 'Gedeelde profielen', href: '/admin/client-shares', icon: Share2 },
    ],
  },
  {
    label: 'Onboarding & Training',
    items: [
      { label: 'Onboarding', href: '/admin/onboarding', icon: ListChecks },
      { label: 'Trainingen', href: '/admin/trainings', icon: GraduationCap },
    ],
  },
  {
    label: 'Export',
    items: [
      { label: 'Payroll export', href: '/admin/export/payroll', icon: Banknote },
      { label: 'Algemene export', href: '/admin/export', icon: Download },
    ],
  },
  {
    label: 'Instellingen',
    roles: ['super_admin'],
    items: [{ label: 'Functiecategorieën', href: '/admin/settings/job-categories', icon: Tags }],
  },
]

export const CLIENT_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { label: 'Vacature-aanvragen', href: '/client/requests', icon: Inbox },
]

export const CANDIDATE_NAV: NavItem[] = [
  { label: 'Mijn sollicitatie', href: '/candidate/dashboard', icon: ClipboardList },
  { label: 'Mijn profiel', href: '/candidate/profile', icon: Settings },
]
