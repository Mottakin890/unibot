'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { cn } from '@/lib/utils'
import { MessageSquare, Send, RotateCcw, User, AlertCircle, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMarkdown } from '@/components/chat/chat-markdown'

interface ChatInterfaceProps {
  chatbotId: string
  isPlayground?: boolean
  welcomeMessage?: string
}

/** Safely extract text from any UIMessage structure (AI SDK v5 or v6) */
function getMessageText(message: any): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text as string)
      .join('')
  }
  if (typeof message.content === 'string') return message.content
  return ''
}

export function ChatInterface({ chatbotId, isPlayground = false, welcomeMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // AI SDK v6: useChat requires a transport object; `api` and `body` are no
  // longer top-level options. Extra body fields go inside DefaultChatTransport.
  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { chatbotId },
    }),
    onError: (err) => {
      console.error('[ChatInterface] useChat error:', err)
    },
    onFinish: ({ messages: allMsgs }) => {
      console.log('[ChatInterface] stream finished, total messages:', allMsgs.length)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    // AI SDK v6: sendMessage({ text }) — do NOT use append()
    sendMessage({ text: input.trim() })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleReset = () => {
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className={cn('flex flex-col h-full', isPlayground ? 'bg-background' : 'bg-card')}>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className={cn('mx-auto flex flex-col gap-5 py-8', isPlayground ? 'max-w-3xl px-6' : 'px-4')}>

          {/* Empty state */}
          {messages.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
                <Cpu className="w-7 h-7 text-primary" />
              </div>
              <div className="flex flex-col gap-2 items-center">
                <h3 className="text-lg font-semibold text-foreground">
                  {isPlayground ? 'Test your Private Bot' : 'How can I help?'}
                </h3>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-600 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Powered by Gemini &amp; GPT-4o
                </div>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mt-2">
                  {welcomeMessage || (isPlayground
                    ? 'Send a message to see how your chatbot responds directly from the edge node.'
                    : 'Ask me anything. Your data never leaves this server.')}
                </p>
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Something went wrong: {error.message}. Please try again.</span>
              <button onClick={handleReset} className="ml-auto text-xs underline underline-offset-2 shrink-0">
                Reset
              </button>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => {
            const text = getMessageText(message)
            if (!text) return null
            const isUser = message.role === 'user'

            return (
              <div key={message.id} className={cn('flex gap-3 animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
                {!isUser && (
                  <div className="flex items-start shrink-0 mt-0.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground">
                      <MessageSquare className="w-4 h-4 text-background" />
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%]',
                    isUser
                      ? 'bg-foreground text-background rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{text}</p>
                  ) : (
                    <ChatMarkdown content={text} />
                  )}
                </div>

                {isUser && (
                  <div className="flex items-start shrink-0 mt-0.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Typing indicator — shown when loading but no assistant text yet */}
          {isLoading && (
            (() => {
              const lastMsg = messages[messages.length - 1]
              const hasAssistantText = lastMsg && lastMsg.role === 'assistant' && getMessageText(lastMsg)
              if (hasAssistantText) return null
              return (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="flex items-start shrink-0 mt-0.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground">
                      <MessageSquare className="w-4 h-4 text-background" />
                    </div>
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-5 py-4">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )
            })()
          )}

        </div>
      </div>

      {/* Input */}
      <div className={cn('border-t border-border shrink-0', isPlayground ? 'bg-background' : 'bg-card')}>
        <div className={cn('mx-auto py-4', isPlayground ? 'max-w-3xl px-6' : 'px-4')}>
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isLoading ? 'Waiting for response...' : 'Type a message...'}
                rows={1}
                className={cn(
                  'w-full resize-none rounded-xl border border-input bg-background px-4 py-3.5 pr-12 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30',
                  'max-h-32 min-h-[48px] transition-all'
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-xl border-border hover:bg-muted"
                  onClick={handleReset}
                  title="Reset chat"
                  aria-label="Reset chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                className="h-12 w-12 shrink-0 rounded-xl shadow-sm"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
