import {
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'

// ─── Ollama client ────────────────────────────────────────────────────────────
// Reads OLLAMA_BASE_URL from env; falls back to localhost if not set.
// On the VPS, Next.js and Ollama are co-located so 127.0.0.1 is correct.
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/v1'

const OLLAMA_DEFAULT_MODEL =
  process.env.OLLAMA_DEFAULT_MODEL || 'llama3.2'

const localOllama = createOpenAI({
  baseURL: OLLAMA_BASE_URL,
  apiKey: 'ollama', // Not needed for Ollama, but required by the SDK shape
})

export const maxDuration = 60

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Safely extract plain text from a UIMessage (AI SDK v5 / v6) */
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

/**
 * Score a data source by keyword overlap with the user's query.
 * Returns a number between 0 and 1 (higher = more relevant).
 */
function scoreRelevance(query: string, sourceContent: string): number {
  if (!query || !sourceContent) return 0
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3) // ignore short/stop words

  if (words.length === 0) return 1 // no query words → treat all equally

  const contentLower = sourceContent.toLowerCase()
  let hits = 0
  for (const word of words) {
    if (contentLower.includes(word)) hits++
  }
  return hits / words.length
}

/**
 * Check whether Ollama is reachable. Returns true if healthy.
 * Uses /api/tags (lightweight endpoint).
 */
async function checkOllamaHealth(): Promise<{ ok: boolean; error?: string }> {
  // Strip the /v1 suffix to get the root Ollama API URL
  const rootUrl = OLLAMA_BASE_URL.replace(/\/v1\/?$/, '')
  try {
    const res = await fetch(`${rootUrl}/api/tags`, {
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) return { ok: true }
    return { ok: false, error: `Ollama responded with HTTP ${res.status}` }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message ?? 'Connection refused — is Ollama running?',
    }
  }
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const {
    messages,
    chatbotId,
    conversationId,
  }: {
    messages: UIMessage[]
    chatbotId: string
    conversationId?: string
  } = await req.json()

  if (!chatbotId) {
    console.error('[/api/chat] Missing chatbotId in request payload')
    return new Response('Missing chatbotId', { status: 400 })
  }

  if (!messages || messages.length === 0) {
    return new Response('No messages provided', { status: 400 })
  }

  // ── 1. Ollama health check ────────────────────────────────────────────────
  const health = await checkOllamaHealth()
  if (!health.ok) {
    console.error(`[/api/chat] Ollama is unreachable at ${OLLAMA_BASE_URL}: ${health.error}`)
    return new Response(
      JSON.stringify({
        error: 'AI engine is temporarily unavailable. Please try again in a moment.',
        detail: health.error,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  console.log(
    `[/api/chat] Processing for chatbotId=${chatbotId}, messages=${messages.length}, ollama=${OLLAMA_BASE_URL}`,
  )

  // ── 2. Fetch chatbot config from Supabase ─────────────────────────────────
  const supabase = await createClient()

  const { data: chatbot } = await supabase
    .from('chatbots')
    .select('id, model, system_prompt, temperature, user_id, name')
    .eq('id', chatbotId)
    .single()

  if (!chatbot) {
    console.error(`[/api/chat] Chatbot not found: ${chatbotId}`)
    return new Response('Chatbot not found', { status: 404 })
  }

  // ── 3. Resolve model ──────────────────────────────────────────────────────
  // Use the model stored in the DB if it looks like an Ollama model name,
  // otherwise fall back to the env default (llama3.2).
  const modelId =
    chatbot.model && chatbot.model !== 'gemini-2.5-flash'
      ? chatbot.model
      : OLLAMA_DEFAULT_MODEL

  // ── 4. Fetch data sources & build relevance-filtered context ──────────────
  const { data: sources } = await supabase
    .from('data_sources')
    .select('name, content, type')
    .eq('chatbot_id', chatbotId)

  // Get the last user message text for relevance scoring
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
  const userQuery = lastUserMsg ? extractText(lastUserMsg) : ''

  // Score each source against the user's query
  const scoredSources = (sources ?? [])
    .filter((s) => s.content && s.content.length > 0)
    .map((s) => ({
      ...s,
      score: scoreRelevance(userQuery, s.content!),
    }))
    .sort((a, b) => b.score - a.score) // highest relevance first

  // Fill context up to 200k chars, most relevant sources first
  const MAX_CONTEXT_CHARS = 200_000
  let contextBlock = ''

  if (scoredSources.length > 0) {
    let combined = ''
    for (const src of scoredSources) {
      const chunk = `--- Source: ${src.name} (${src.type}) ---\n${src.content}`
      if (combined.length + chunk.length > MAX_CONTEXT_CHARS) {
        // Partially include if there's room
        const remaining = MAX_CONTEXT_CHARS - combined.length
        if (remaining > 500) {
          combined += chunk.slice(0, remaining) + '\n\n[Truncated]'
        }
        break
      }
      combined += chunk + '\n\n'
    }

    if (combined.trim()) {
      contextBlock = `\n\nYou have access to the following knowledge base. Answer questions using ONLY this information. If the answer is not in the knowledge base, clearly state that you don't have that information — do not guess or hallucinate.\n\n${combined.trim()}`
    }
  }

  const basePrompt = chatbot.system_prompt || 'You are a helpful assistant.'
  const refinementPrompt =
    '\n\nCRITICAL INSTRUCTION: Your answers MUST be short, concise, and perfectly refined. Do not use filler words. Get straight to the point. Output the response directly to the user.'
  const systemPrompt = basePrompt + refinementPrompt + contextBlock

  console.log(
    `[/api/chat] model=${modelId}, sources=${scoredSources.length}, contextChars=${contextBlock.length}`,
  )

  // ── 5. Convert messages & stream ──────────────────────────────────────────
  let modelMessages
  try {
    modelMessages = await convertToModelMessages(messages)
  } catch (err) {
    console.error('[/api/chat] Failed to convert messages:', err)
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

  // ── 6. Persist conversation to Supabase after stream finishes ─────────────
  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({
      messages: allMessages,
      isAborted,
    }: {
      messages: UIMessage[]
      isAborted: boolean
    }) => {
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

          // Save the user message (guard against duplicates)
          if (allMessages.length >= 2) {
            const userMsg = allMessages[allMessages.length - 2]
            if (userMsg.role === 'user') {
              const userText = extractText(userMsg)
              if (userText) {
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
        console.error('[/api/chat] Failed to save conversation:', err)
      }
    },
  })
}
