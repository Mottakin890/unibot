import { createPublicClient } from '@/lib/supabase/public'
import { notFound } from 'next/navigation'
import { WidgetClient } from '@/components/chat/widget-client'

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>
}) {
  const { chatbotId } = await params

  // The widget is a PUBLIC page — use an anon client without requiring a session.
  // If Supabase RLS blocks anonymous reads, the data will be null even if the
  // chatbot exists. In that case you'll need to enable "anon" SELECT on the
  // chatbots table in the Supabase dashboard.
  const supabase = createPublicClient()

  const { data: chatbot, error } = await supabase
    .from('chatbots')
    .select('id, name, welcome_message, avatar_url')
    .eq('id', chatbotId)
    .single()

  if (error || !chatbot) {
    console.error('[WidgetPage] chatbot not found or RLS blocked:', {
      chatbotId,
      error: error?.message,
      code: error?.code,
    })
    notFound()
  }

  return (
    <WidgetClient
      chatbotId={chatbot.id}
      chatbotName={chatbot.name}
      welcomeMessage={chatbot.welcome_message}
      avatarUrl={chatbot.avatar_url}
    />
  )
}
