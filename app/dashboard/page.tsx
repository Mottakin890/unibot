import { createClient } from '@/lib/supabase/server'
import { ChatbotGrid } from '@/components/dashboard/chatbot-grid'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: chatbots } = await supabase
    .from('chatbots')
    .select('*, data_sources(count), conversations(count)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const formattedBots = (chatbots ?? []).map((bot) => ({
    id: bot.id,
    name: bot.name,
    description: bot.description,
    model: bot.model,
    createdAt: bot.created_at,
    sourceCount: (bot.data_sources as unknown as { count: number }[])?.[0]?.count ?? 0,
    conversationCount: (bot.conversations as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <ChatbotGrid chatbots={formattedBots} />
    </div>
  )
}
