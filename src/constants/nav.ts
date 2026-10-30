/**
 * nav.ts
 * WAT:    Navigatiestructuur voor de drie shells (admin-sidebar, client-topbar, candidate-topbar).
 */

import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  Code2,
  Download,
  FileSignature,
  GraduationCap,
  History,
  Inbox,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  MessageCircleQuestion,
  MessagesSquare,
  ScanLine,
  Share2,
  Tags,
  Truck,
  Users,
  Webhook,
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
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Rapportages', href: '/admin/reports', icon: BarChart3 },
    ],
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
      { label: 'Contracten & badges', href: '/admin/contracts', icon: FileSignature },
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
    items: [
      { label: 'Functiecategorieën', href: '/admin/settings/job-categories', icon: Tags },
      { label: 'Interviewvragen', href: '/admin/settings/interview-questions', icon: MessageCircleQuestion },
      { label: 'Gebruikers & rollen', href: '/admin/settings/users', icon: Users },
      { label: 'Audit-log', href: '/admin/settings/audit-log', icon: History },
      { label: 'Handleiding', href: '/admin/settings/handleiding', icon: BookOpen },
    ],
  },
  {
    label: 'Integraties',
    roles: ['super_admin'],
    items: [
      { label: 'Formulier embedden', href: '/admin/settings/embed', icon: Code2 },
      { label: 'API-sleutels', href: '/admin/settings/api-keys', icon: KeyRound },
      { label: 'Webhooks', href: '/admin/settings/webhooks', icon: Webhook },
      { label: 'Chat-kennisbank', href: '/admin/settings/chat-kb', icon: MessagesSquare },
    ],
  },
]

/** Iconsleutels voor de mobiele onderbalk (client component kan geen icoon-functies als props ontvangen). */
export type TabIcon = 'home' | 'jobs' | 'applications' | 'profile' | 'dashboard' | 'candidates' | 'more'

export interface PortalTab {
  label: string
  href: string
  icon: TabIcon
  /** Vereist een ingelogde sessie; anders verwijst de tab naar de loginpagina van het portaal. */
  protected: boolean
}

export const CANDIDATE_TABS: PortalTab[] = [
  { label: 'Home', href: '/candidate/home', icon: 'home', protected: true },
  { label: 'Vacatures', href: '/vacatures', icon: 'jobs', protected: false },
  { label: 'Sollicitaties', href: '/candidate/dashboard', icon: 'applications', protected: true },
  { label: 'Profiel', href: '/candidate/profile', icon: 'profile', protected: true },
]

export const CLIENT_TABS: PortalTab[] = [
  { label: 'Dashboard', href: '/client/dashboard', icon: 'dashboard', protected: true },
  { label: 'Vacatures', href: '/client/requests', icon: 'jobs', protected: true },
  { label: 'Kandidaten', href: '/client/candidates', icon: 'candidates', protected: true },
  { label: 'Meer', href: '/client/more', icon: 'more', protected: true },
]
