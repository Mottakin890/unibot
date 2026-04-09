'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { MessageSquare, FileText, Settings, Code, Activity, ArrowLeft, BarChart3 } from 'lucide-react'

interface ChatbotTabsProps {
  chatbotId: string
  chatbotName: string
}

const tabs = [
  { segment: 'playground', label: 'Playground', icon: MessageSquare },
  { segment: 'sources', label: 'Sources', icon: FileText },
  { segment: 'connect', label: 'Connect', icon: Code },
  { segment: 'activity', label: 'Activity', icon: Activity },
  { segment: 'analytics', label: 'Analytics', icon: BarChart3 },
  { segment: 'settings', label: 'Settings', icon: Settings },
]

export function ChatbotTabs({ chatbotId, chatbotName }: ChatbotTabsProps) {
  const pathname = usePathname()
  const currentSegment = pathname.split('/').pop()

  return (
    <div className="border-b border-border bg-background px-6 shrink-0">
      {/* Chatbot name + back */}
      <div className="flex items-center gap-3 pt-4 pb-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-bold text-foreground truncate tracking-tight">{chatbotName}</h2>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-0.5 -mb-px overflow-x-auto">
        {tabs.map((tab) => {
          const href = `/dashboard/${chatbotId}/${tab.segment}`
          const isActive = currentSegment === tab.segment
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
