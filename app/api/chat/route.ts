import {
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'

// Forward local compatible API to the VPS Ollama server
const localOllama = createOpenAI({
  baseURL: 'http://107.172.127.198:11434/v1',
  apiKey: 'ollama', // Not needed for local Ollama, but required by SDK
})

export const maxDuration = 60

/** Safely extract plain text from a UIMessage (works for AI SDK v5 and v6) */
function extractText(message: UIMessage): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text as string)
      .join('')
  }
  if (typeof (message as any).content === 'string') return (message as any).content
  return ''
}

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

  if (!messages || messages.length === 0) {
    return new Response('No messages provided', { status: 400 })
  }

  console.log(`[API /api/chat] Processing chat for chatbotId: ${chatbotId}, messages: ${messages.length}`)
  const supabase = await createClient()

  // Fetch chatbot config
  const { data: chatbot } = await supabase
    .from('chatbots')
    .select('id, model, system_prompt, temperature, user_id, name')
    .eq('id', chatbotId)
    .single()

  if (!chatbot) {
    console.error(`[API /api/chat] Chatbot not found for id: ${chatbotId}`)
    return new Response('Chatbot not found', { status: 404 })
  }

  // Fetch all data sources for context, up to 200k chars total
  const { data: sources } = await supabase
    .from('data_sources')
    .select('name, content, type')
    .eq('chatbot_id', chatbotId)

  const contextParts = (sources ?? [])
    .filter((s) => s.content)
    .map((s) => `--- Source: ${s.name} (${s.type}) ---\n${s.content}`)

  // Keep total context under 200k chars to avoid token overflows
  let contextBlock = ''
  if (contextParts.length > 0) {
    let combined = contextParts.join('\n\n')
    if (combined.length > 200000) combined = combined.slice(0, 200000) + '\n\n[Context truncated]'
    contextBlock = `\n\nYou have been trained on the following knowledge base. Answer questions using this knowledge. If the answer is not in the knowledge base, say you don't have that information:\n\n${combined}`
  }

  const systemPrompt = (chatbot.system_prompt ?? 'You are a helpful assistant.') + contextBlock
  // Force local Ollama model
  const modelId = 'llama3.2'

  console.log(`[API /api/chat] Using model: ${modelId}, context size: ${contextBlock.length} chars`)

  let modelMessages
  try {
    modelMessages = await convertToModelMessages(messages)
  } catch (err) {
    console.error('[API /api/chat] Failed to convert messages:', err)
    return new Response('Invalid message format', { status: 400 })
  }

  const result = streamText({
    model: localOllama(modelId),
    system: systemPrompt,
    messages: modelMessages,
    temperature: chatbot.temperature ?? 0.7,
    maxOutputTokens: 4096,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: allMessages, isAborted }: { messages: UIMessage[], isAborted: boolean }) => {
      if (isAborted) return

      try {
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
          const assistantText = extractText(lastMessage)

          if (assistantText) {
            await supabase.from('messages').insert({
              conversation_id: convId,
              role: 'assistant',
              content: assistantText,
            })
          }

          // Also save the user message
          if (allMessages.length >= 2) {
            const userMsg = allMessages[allMessages.length - 2]
            if (userMsg.role === 'user') {
              const userText = extractText(userMsg)
              if (userText) {
                // Avoid saving duplicate user messages
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
        }
      } catch (err) {
        console.error('[API /api/chat] Failed to save conversation:', err)
      }
    },
  })
}
