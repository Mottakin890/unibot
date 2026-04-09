'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, FileText, MoreHorizontal, Trash2, Settings, ArrowUpRight } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Chatbot {
  id: string
  name: string
  description: string | null
  model: string
  createdAt: string
  sourceCount: number
  conversationCount: number
}

export function ChatbotGrid({ chatbots }: { chatbots: Chatbot[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chatbot? This action cannot be undone.')) return
    setDeleting(id)
    try {
      await fetch(`/api/chatbots/${id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      // silently fail
    }
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Chatbots</h1>
          <p className="text-sm text-muted-foreground">
            {chatbots.length === 0
              ? 'Create your first AI chatbot to get started'
              : `${chatbots.length} chatbot${chatbots.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button asChild className="rounded-lg shadow-sm font-semibold">
          <Link href="/dashboard/new" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Chatbot
          </Link>
        </Button>
      </div>

      {/* Grid */}
      {chatbots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 gap-6 rounded-2xl border-2 border-dashed border-border bg-muted/10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-foreground">
            <MessageSquare className="w-8 h-8 text-background" />
          </div>
          <div className="text-center flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-foreground">No chatbots yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Create your first chatbot, train it with your data, and embed it on your website.
            </p>
          </div>
          <Button asChild className="rounded-lg shadow-sm font-semibold">
            <Link href="/dashboard/new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Chatbot
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chatbots.map((bot) => (
            <div
              key={bot.id}
              className="group relative flex flex-col rounded-xl border border-border bg-card hover:border-foreground/20 hover:shadow-lg hover:shadow-foreground/[0.03] transition-all duration-300"
            >
              {/* Card header */}
              <div className="flex items-start justify-between p-5 pb-3">
                <Link href={`/dashboard/${bot.id}/playground`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-foreground shrink-0">
                    <MessageSquare className="w-5 h-5 text-background" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{bot.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">{bot.model}</p>
                  </div>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded-lg"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      <span className="sr-only">Options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/${bot.id}/playground`} className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Open Playground
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/${bot.id}/settings`} className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(bot.id)}
                      disabled={deleting === bot.id}
                      className="text-destructive focus:text-destructive flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting === bot.id ? 'Deleting...' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Description */}
              {bot.description && (
                <p className="px-5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {bot.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-5 px-5 py-4 mt-auto border-t border-border/60">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{bot.sourceCount} source{bot.sourceCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{bot.conversationCount} chat{bot.conversationCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
