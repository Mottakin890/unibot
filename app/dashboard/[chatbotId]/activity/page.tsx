'use client'

import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  MessageSquare, Clock, Search, ChevronDown, ChevronUp, User, Bot, X, ArrowUpDown
} from 'lucide-react'
import useSWR from 'swr'

interface Message {
  id: string
  role: string
  content: string
  created_at: string
}

interface Conversation {
  id: string
  created_at: string
  messages: Message[]
}

export default function ActivityPage() {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const { data: conversations, isLoading } = useSWR<Conversation[]>(`activity-${chatbotId}`, async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('conversations')
      .select('id, created_at, messages(id, role, content, created_at)')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false })
      .limit(100)
    return (data ?? []) as Conversation[]
  })

  const filtered = useMemo(() => {
    if (!conversations) return []
    let result = conversations
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.messages?.some(m => m.content.toLowerCase().includes(q))
      )
    }
    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }
    return result
  }, [conversations, search, sortOrder])

  const totalMessages = conversations?.reduce((sum, c) => sum + (c.messages?.length ?? 0), 0) ?? 0

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl p-6 md:p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Conversation Activity</h2>
        <p className="text-sm text-muted-foreground mt-0.5">View and search through all conversations with your chatbot.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Conversations</p>
          <p className="text-2xl font-bold text-foreground mt-1.5 font-mono">{conversations?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Messages</p>
          <p className="text-2xl font-bold text-foreground mt-1.5 font-mono">{totalMessages}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg. per Chat</p>
          <p className="text-2xl font-bold text-foreground mt-1.5 font-mono">
            {conversations && conversations.length > 0 ? (totalMessages / conversations.length).toFixed(1) : '0'}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background border-border"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')} className="shrink-0 gap-2">
          <ArrowUpDown className="w-4 h-4" />
          {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
        </Button>
      </div>

      {/* Conversations list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg border border-border bg-card p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 p-10 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">
            {search ? 'No conversations match your search' : 'No conversations yet'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? 'Try different keywords' : 'Share your chatbot to start getting messages.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((conv) => {
            const isExpanded = expandedId === conv.id
            const firstUserMsg = conv.messages?.find(m => m.role === 'user')
            const msgCount = conv.messages?.length ?? 0

            return (
              <div key={conv.id} className="rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-foreground/20">
                {/* Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : conv.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4 text-background" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {firstUserMsg?.content ?? 'Empty conversation'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {msgCount} message{msgCount !== 1 ? 's' : ''} &middot; {timeAgo(conv.created_at)}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="px-4 py-2 bg-muted/20 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {formatFullDate(conv.created_at)}
                    </div>
                    <div className="flex flex-col divide-y divide-border">
                      {conv.messages
                        ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((msg) => (
                          <div key={msg.id} className="flex gap-3 px-4 py-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              msg.role === 'user' ? 'bg-foreground' : 'bg-muted'
                            }`}>
                              {msg.role === 'user'
                                ? <User className="w-3.5 h-3.5 text-background" />
                                : <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                              }
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-foreground capitalize">{msg.role}</span>
                                <span className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</span>
                              </div>
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
