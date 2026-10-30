/**
 * mail-templates.ts
 * WAT:    Nederlandse e-mailteksten (platte tekst + eenvoudige HTML) voor de systeemmails.
 * WAAROM: Pure functies zonder database, zodat de teksten los te testen zijn. Mails met een link naar
 *         een eenmalig token zijn `sensitive`: de outbox maakt de inhoud leeg zodra de mail is verzonden,
 *         zodat een werkend token niet in de database blijft liggen.
 */

import { escapeHtml, singleLine } from '@/lib/mail-core'

export type MailData =
  | { template: 'invite'; name: string; link: string; validHours: number }
  | { template: 'password_reset'; name: string; link: string; validMinutes: number }
  | { template: 'application_received'; name: string; position: string }
  | { template: 'test' }

export type MailTemplate = MailData['template']

export interface RenderedMail {
  subject: string
  text: string
  html: string
  sensitive: boolean
}

const BRAND_GREEN = '#1c9848'
const SIGN_OFF = 'Met vriendelijke groet,\nPansa Group'

function wrapHtml(title: string, paragraphs: string[], action?: { label: string; href: string }): string {
  const body = paragraphs.map((p) => `<p style="margin:0 0 16px;line-height:1.5">${escapeHtml(p)}</p>`).join('')
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.href)}" style="background:${BRAND_GREEN};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">${escapeHtml(action.label)}</a></p>` +
      `<p style="margin:0 0 16px;line-height:1.5;font-size:13px;color:#555555">Werkt de knop niet? Kopieer dan deze link in je browser:<br><span style="word-break:break-all">${escapeHtml(action.href)}</span></p>`
    : ''
  return (
    `<!doctype html><html lang="nl"><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">` +
    `<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">` +
    `<h1 style="margin:0 0 20px;font-size:20px;color:${BRAND_GREEN}">${escapeHtml(title)}</h1>` +
    body +
    button +
    `<p style="margin:24px 0 0;line-height:1.5;white-space:pre-line">${escapeHtml(SIGN_OFF)}</p>` +
    `</div></body></html>`
  )
}

function firstName(name: string): string {
  return singleLine(name).split(' ')[0] || 'collega'
}

export function renderMail(data: MailData): RenderedMail {
  switch (data.template) {
    case 'invite': {
      const subject = 'Je account voor Pansa ATS is klaar'
      const paragraphs = [
        `Hallo ${firstName(data.name)},`,
        'Er is een account voor je aangemaakt in Pansa ATS. Kies via onderstaande link je eigen wachtwoord om in te loggen.',
        `De link is ${data.validHours} uur geldig en werkt één keer.`,
      ]
      return {
        subject,
        text: `${paragraphs.join('\n\n')}\n\n${data.link}\n\n${SIGN_OFF}`,
        html: wrapHtml(subject, paragraphs, { label: 'Wachtwoord kiezen', href: data.link }),
        sensitive: true,
      }
    }
    case 'password_reset': {
      const subject = 'Wachtwoord opnieuw instellen'
      const paragraphs = [
        `Hallo ${firstName(data.name)},`,
        'Er is gevraagd om het wachtwoord van je Pansa ATS-account opnieuw in te stellen. Gebruik daarvoor onderstaande link.',
        `De link is ${data.validMinutes} minuten geldig en werkt één keer. Heb je dit niet aangevraagd? Dan hoef je niets te doen; je wachtwoord blijft zoals het was.`,
      ]
      return {
        subject,
        text: `${paragraphs.join('\n\n')}\n\n${data.link}\n\n${SIGN_OFF}`,
        html: wrapHtml(subject, paragraphs, { label: 'Nieuw wachtwoord kiezen', href: data.link }),
        sensitive: true,
      }
    }
    case 'application_received': {
      const position = singleLine(data.position)
      const subject = 'We hebben je sollicitatie ontvangen'
      const paragraphs = [
        `Hallo ${firstName(data.name)},`,
        `Bedankt voor je sollicitatie als ${position}. We hebben je gegevens ontvangen en bekijken ze zo snel mogelijk.`,
        'Als je door wilt naar de volgende stap, nemen we contact met je op.',
      ]
      return {
        subject,
        text: `${paragraphs.join('\n\n')}\n\n${SIGN_OFF}`,
        html: wrapHtml(subject, paragraphs),
        sensitive: false,
      }
    }
    case 'test': {
      const subject = 'Testmail van Pansa ATS'
      const paragraphs = ['Dit is een testmail. Als je dit leest, werkt het versturen van e-mail vanuit Pansa ATS.']
      return { subject, text: `${paragraphs.join('\n\n')}\n\n${SIGN_OFF}`, html: wrapHtml(subject, paragraphs), sensitive: false }
    }
  }
}
