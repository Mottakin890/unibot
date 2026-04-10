'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Zap, Users, BarChart3, Calendar, FileText, Kanban, Globe, Lock, Bell, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const upcomingFeatures = [
  {
    icon: Users,
    label: 'CRM & Contacts',
    description: 'Full-featured contact management with pipelines, deal tracking, and customer lifecycle management.',
    badge: 'Core',
    color: 'from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-500',
    borderColor: 'border-violet-500/20',
  },
  {
    icon: Kanban,
    label: 'Project Workspaces',
    description: 'Kanban boards, task management, team collaboration, and real-time project tracking for every office.',
    badge: 'Core',
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: BarChart3,
    label: 'Analytics Dashboard',
    description: 'Rich analytics and business intelligence — revenue charts, team performance, and conversion funnels.',
    badge: 'Analytics',
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-500',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: Calendar,
    label: 'Smart Scheduling',
    description: 'Integrated calendar, appointment booking, meeting reminders, and timezone-aware scheduling.',
    badge: 'Productivity',
    color: 'from-orange-500/20 to-amber-500/10',
    iconColor: 'text-orange-500',
    borderColor: 'border-orange-500/20',
  },
  {
    icon: FileText,
    label: 'Document Center',
    description: 'Collaborative docs, proposals, contracts, and e-signature workflows — all in one place.',
    badge: 'Documents',
    color: 'from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-500',
    borderColor: 'border-pink-500/20',
  },
  {
    icon: Bell,
    label: 'Smart Notifications',
    description: 'Context-aware alerts, team mentions, deal stage updates, and multi-channel notification routing.',
    badge: 'Alerts',
    color: 'from-yellow-500/20 to-amber-500/10',
    iconColor: 'text-yellow-500',
    borderColor: 'border-yellow-500/20',
  },
  {
    icon: Globe,
    label: 'Multi-Language Support',
    description: 'Built for global teams — full i18n with RTL support, regional time zones, and localized currencies.',
    badge: 'Global',
    color: 'from-sky-500/20 to-blue-500/10',
    iconColor: 'text-sky-500',
    borderColor: 'border-sky-500/20',
  },
  {
    icon: Lock,
    label: 'Enterprise Security',
    description: 'Role-based access control, SSO, audit logs, two-factor authentication, and data encryption at rest.',
    badge: 'Security',
    color: 'from-red-500/20 to-rose-500/10',
    iconColor: 'text-red-500',
    borderColor: 'border-red-500/20',
  },
]

interface ComingSoonModalProps {
  open: boolean
  onClose: () => void
}

export function ComingSoonModal({ open, onClose }: ComingSoonModalProps) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const t = setTimeout(() => setVisible(true), 10)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 350)
      return () => clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!mounted) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full max-w-5xl mx-auto my-8 rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/10 transition-all duration-350',
          visible ? 'translate-y-0 scale-100' : 'translate-y-6 scale-[0.98]'
        )}
        style={{ minHeight: 'min(92vh, 860px)' }}
      >
        {/* Header */}
        <div className="relative flex flex-col items-center gap-4 px-8 pt-10 pb-8 text-center border-b border-border overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex flex-col items-center gap-3">
            {/* Badge */}
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/15 to-blue-500/15 border border-violet-500/25 text-xs font-semibold text-violet-400 tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Coming Soon — v2.0
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              UniBot{' '}
              <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Workspace &amp; CRM
              </span>
            </h2>

            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              We're building a complete office operating system — combining AI chatbots with a full-featured CRM,
              project management suite, and team collaboration tools. Everything your business needs, unified.
            </p>

            {/* Countdown / ETA */}
            <div className="flex items-center gap-6 mt-2">
              {[
                { value: 'Q3', label: '2026' },
                { value: '8+', label: 'Features' },
                { value: '100%', label: 'Free Beta' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-0.5">
                  <span className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</span>
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Grid */}
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Upcoming Features</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {upcomingFeatures.map((feature, i) => (
              <div
                key={feature.label}
                className={cn(
                  'group relative flex flex-col gap-3 rounded-xl border p-4 bg-gradient-to-br transition-all duration-300',
                  'hover:shadow-lg hover:shadow-foreground/[0.04] hover:-translate-y-0.5',
                  feature.color,
                  feature.borderColor
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Icon */}
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg bg-background/60 shrink-0', feature.iconColor)}>
                  <feature.icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{feature.label}</h4>
                    <span className={cn('shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-background/50', feature.iconColor)}>
                      {feature.badge}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 border-t border-border bg-muted/20 rounded-b-2xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>
              Be the first to access UniBot Workspace — early beta is <span className="text-foreground font-medium">completely free</span>.
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              Maybe later
            </button>
            <a
              href="mailto:support@unibot.app?subject=Early%20Access%20Request&body=Hi%2C%20I%27d%20like%20early%20access%20to%20UniBot%20Workspace!"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-blue-500 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Get Early Access
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
