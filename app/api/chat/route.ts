import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
})
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages, chatbotId, conversationId }: {
    messages: UIMessage[]
    chatbotId: string
    conversationId?: string
  } = await req.json()

  if (!chatbotId) {
    console.error('[API /api/chat] Missing chatbotId in request payload')
    return new Response('Missing chatbotId', { status: 400 })
  }

  console.log(`[API /api/chat] Processing chat for chatbotId: ${chatbotId}`)
  const supabase = await createClient()

  // Fetch chatbot config (public -- widget users may not be authenticated)
  const { data: chatbot } = await supabase
    .from('chatbots')
    .select('id, model, system_prompt, temperature, user_id, name')
    .eq('id', chatbotId)
    .single()

  if (!chatbot) {
    console.error(`[API /api/chat] Chatbot not found for id: ${chatbotId}`)
    return new Response('Chatbot not found', { status: 404 })
  }

  // Fetch all data sources for context
  const { data: sources } = await supabase
    .from('data_sources')
    .select('name, content, type')
    .eq('chatbot_id', chatbotId)

  // Build context from sources
  const contextParts = (sources ?? [])
    .filter((s) => s.content)
    .map((s) => `--- Source: ${s.name} (${s.type}) ---\n${s.content}`)

  const contextBlock = contextParts.length > 0
    ? `\n\nYou have been trained on the following knowledge base. Use it to answer questions accurately:\n\n${contextParts.join('\n\n')}`
    : ''

  const systemPrompt = (chatbot.system_prompt ?? 'You are a helpful assistant.') + contextBlock

  const modelId = chatbot.model || 'gemini-2.5-flash'

  const result = streamText({
    model: google(modelId),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    temperature: chatbot.temperature ?? 0.7,
    maxOutputTokens: 4096,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages, isAborted }) => {
      if (isAborted) return

      try {
        // Save conversation to database
        let convId = conversationId

        if (!convId) {
          const { data: conv } = await supabase
            .from('conversations')
            .insert({ chatbot_id: chatbotId })
            .select('id')
            .single()
          convId = conv?.id
        }

        if (convId && allMessages.length > 0) {
          const lastMessage = allMessages[allMessages.length - 1]
          const textContent = typeof lastMessage.content === 'string'
            ? lastMessage.content
            : lastMessage.parts
                ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map((p) => p.text)
                .join('') || ''

          // Save the assistant message
          await supabase.from('messages').insert({
            conversation_id: convId,
            role: lastMessage.role,
            content: textContent,
          })

          // Also save the user message if it was the first pair
          if (allMessages.length >= 2) {
            const userMsg = allMessages[allMessages.length - 2]
            if (userMsg.role === 'user') {
              const userText = typeof userMsg.content === 'string'
                ? userMsg.content
                : userMsg.parts
                    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                    .map((p) => p.text)
                    .join('') || ''

              // Check if already saved (upsert pattern)
              const { data: existing } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', convId)
                .eq('content', userText)
                .eq('role', 'user')
                .limit(1)

              if (!existing?.length) {
                await supabase.from('messages').insert({
                  conversation_id: convId,
                  role: 'user',
                  content: userText,
                })
              }
            }
          }
        }
      } catch (err) {
        console.error('[API /api/chat] Failed to save conversation details in background:', err)
      }
    },
    consumeSseStream: consumeStream,
  })
}
