/**
 * embed/chat/page.tsx
 * WAT:    Kale pagina voor de chat-widget-embed — transparante achtergrond zodat alleen de
 *         ronde bubbel/het paneel zichtbaar is in de host-website, niet een wit vlak.
 */

import { ChatWidget } from '@/components/candidate/ChatWidget'

export default function EmbedChatPage() {
  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <div className="flex items-end justify-end p-0">
        <ChatWidget />
      </div>
    </>
  )
}
