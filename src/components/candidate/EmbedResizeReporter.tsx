'use client'

/**
 * EmbedResizeReporter.tsx
 * WAT:    Meldt de documenthoogte aan het bovenliggende venster via postMessage, zodat
 *         public/embed.js de iframe automatisch kan resizen (voorkomt scrollbars-in-scrollbars).
 */

import { useEffect } from 'react'

export function EmbedResizeReporter() {
  useEffect(() => {
    if (window.self === window.top) return // niet in een iframe — niets te doen

    const report = () => {
      window.parent.postMessage({ type: 'pansa-ats-embed-resize', height: document.documentElement.scrollHeight }, '*')
    }

    report()
    const observer = new ResizeObserver(report)
    observer.observe(document.documentElement)
    return () => observer.disconnect()
  }, [])

  return null
}
