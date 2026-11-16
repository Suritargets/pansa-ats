'use client'

/**
 * EmbedResizeReporter.tsx
 * WAT:    Meldt de hoogte van de embed-inhoud aan het bovenliggende venster via postMessage, zodat
 *         public/embed.js de iframe automatisch kan resizen (voorkomt scrollbars-in-scrollbars).
 * WAAROM: Gemeten wordt het <main>-element, niet documentElement.scrollHeight. Binnen een iframe is
 *         scrollHeight nooit kleiner dan de iframe zelf, dus een kortere stap liet blanco ruimte
 *         onderaan staan en de iframe kromp nooit.
 */

import { useEffect } from 'react'

export function EmbedResizeReporter() {
  useEffect(() => {
    if (window.self === window.top) return // niet in een iframe — niets te doen

    const target = document.querySelector('main') ?? document.body
    const report = () => {
      const height = Math.ceil(target.getBoundingClientRect().height)
      window.parent.postMessage({ type: 'pansa-ats-embed-resize', height }, '*')
    }

    report()
    const observer = new ResizeObserver(report)
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return null
}
