'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageSquare,
  Home,
  Plus,
  LogOut,
  User,
  PanelLeft,
  ChevronDown,
  Settings,
} from 'lucide-react'
import { useState } from 'react'

interface DashboardShellProps {
  user: {
    id: string
    email: string
    fullName: string
    avatarUrl: string | null
  }
  children: React.ReactNode
}

const navItems = [
  { href: '/dashboard', label: 'My Chatbots', icon: Home },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = user.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <div className="flex h-svh bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-muted/20 transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground shrink-0">
              <MessageSquare className="w-4 h-4 text-background" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-lg font-bold text-foreground tracking-tight truncate">UniBot</span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          <Link
            href="/dashboard/new"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 mt-3',
              'border border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Plus className="w-[18px] h-[18px] shrink-0" />
            {!sidebarCollapsed && <span>New Chatbot</span>}
          </Link>
        </nav>

        {/* Collapse */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all w-full"
          >
            <PanelLeft className={cn('w-[18px] h-[18px] shrink-0 transition-transform duration-300', sidebarCollapsed && 'rotate-180')} />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground">
                <MessageSquare className="w-4 h-4 text-background" />
              </div>
              <span className="text-lg font-bold text-foreground tracking-tight">UniBot</span>
            </Link>
          </div>

          {/* User dropdown */}
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2.5 h-10 px-3 rounded-lg hover:bg-muted">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-foreground text-background font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-foreground max-w-36 truncate">
                    {user.fullName || user.email}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground truncate">{user.fullName || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2.5">
                    <User className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2.5 text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
