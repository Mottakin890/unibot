import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChatbotTabs } from '@/components/dashboard/chatbot-tabs'

export default async function ChatbotLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ chatbotId: string }>
}) {
  const { chatbotId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: chatbot } = await supabase
    .from('chatbots')
    .select('id, name')
    .eq('id', chatbotId)
    .eq('user_id', user.id)
    .single()

  if (!chatbot) notFound()

  return (
    <div className="flex flex-col h-full">
      <ChatbotTabs chatbotId={chatbot.id} chatbotName={chatbot.name} />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
