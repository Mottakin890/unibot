'use client'

import { ChatInterface } from '@/components/chat/chat-interface'
import { useParams } from 'next/navigation'

export default function PlaygroundPage() {
  const { chatbotId } = useParams<{ chatbotId: string }>()

  return (
    <div className="flex flex-col h-full">
      <ChatInterface chatbotId={chatbotId} isPlayground />
    </div>
  )
}
