import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { WidgetClient } from '@/components/chat/widget-client'

export default async function WidgetPage({
  params,
}: {
  params: Promise<{ chatbotId: string }>
}) {
  const { chatbotId } = await params
  const supabase = await createClient()

  const { data: chatbot } = await supabase
    .from('chatbots')
    .select('id, name, welcome_message')
    .eq('id', chatbotId)
    .single()

  if (!chatbot) notFound()

  return (
    <WidgetClient
      chatbotId={chatbot.id}
      chatbotName={chatbot.name}
      welcomeMessage={chatbot.welcome_message}
    />
  )
}
