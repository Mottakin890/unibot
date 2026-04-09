'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { cn } from '@/lib/utils'
import { MessageSquare, Send, RotateCcw, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMarkdown } from '@/components/chat/chat-markdown'

interface ChatInterfaceProps {
  chatbotId: string
  isPlayground?: boolean
  welcomeMessage?: string
}

function getMessageText(message: any): string {
  if (typeof message.content === 'string' && message.content) return message.content
  if (!message.parts || !Array.isArray(message.parts)) return ''
  return message.parts
    .filter((p: any) => p.type === 'text')
    .map((p: any) => p.text)
    .join('')
}

export function ChatInterface({ chatbotId, isPlayground = false, welcomeMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { messages, append, status, setMessages } = useChat({
    api: '/api/chat',
    body: { chatbotId },
    onError: (err) => {
      console.error('[ChatInterface] useChat onError:', err)
    },
    onFinish: (message) => {
      console.log('[ChatInterface] useChat onFinish completed for message:', message.id)
    },
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    append({ role: 'user', content: input })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleReset = () => {
    setMessages([])
    inputRef.current?.focus()
  }

  return (
    <div className={cn('flex flex-col h-full', isPlayground ? 'bg-background' : 'bg-card')}>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className={cn('mx-auto flex flex-col gap-5 py-8', isPlayground ? 'max-w-3xl px-6' : 'px-4')}>
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-foreground">
                <MessageSquare className="w-7 h-7 text-background" />
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-semibold text-foreground">
                  {isPlayground ? 'Test your chatbot' : 'How can I help?'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  {welcomeMessage || (isPlayground
                    ? 'Send a message to see how your chatbot responds based on its training data.'
                    : 'Ask me anything and I\'ll do my best to help you.')}
                </p>
              </div>
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

          {/* Typing indicator */}
          {isLoading && messages.length > 0 && !getMessageText(messages[messages.length - 1]) && (
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
                placeholder="Type a message..."
                rows={1}
                className={cn(
                  'w-full resize-none rounded-xl border border-input bg-background px-4 py-3.5 pr-12 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30',
                  'max-h-32 min-h-[48px] transition-all'
                )}
                disabled={isLoading}
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
