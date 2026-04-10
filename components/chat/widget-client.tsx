'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { MessageSquare } from 'lucide-react'

interface WidgetClientProps {
  chatbotId: string
  chatbotName: string
  welcomeMessage: string | null
  avatarUrl?: string | null
}

export function WidgetClient({ chatbotId, chatbotName, welcomeMessage, avatarUrl }: WidgetClientProps) {
  return (
    <div className="flex flex-col h-svh bg-card">
      {/* Widget header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-foreground shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background/10 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={chatbotName} className="w-full h-full object-cover" />
          ) : (
            <MessageSquare className="w-4 h-4 text-background" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-background">{chatbotName}</h3>
          <p className="text-xs text-background/50">Powered by UniBot</p>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          chatbotId={chatbotId}
          welcomeMessage={welcomeMessage ?? undefined}
        />
      </div>
    </div>
  )
}
