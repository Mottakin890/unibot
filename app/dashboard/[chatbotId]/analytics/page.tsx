'use client'

import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { MessageSquare, TrendingUp, Users, Clock, Loader2 } from 'lucide-react'
import useSWR from 'swr'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'

interface Conversation {
  id: string
  created_at: string
  messages: { id: string; role: string; created_at: string }[]
}

export default function AnalyticsPage() {
  const { chatbotId } = useParams<{ chatbotId: string }>()

  const { data: conversations, isLoading } = useSWR<Conversation[]>(`analytics-${chatbotId}`, async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('conversations')
      .select('id, created_at, messages(id, role, created_at)')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false })
    return (data ?? []) as Conversation[]
  })

  const stats = useMemo(() => {
    if (!conversations) return null
    const totalConvos = conversations.length
    const totalMsgs = conversations.reduce((s, c) => s + (c.messages?.length ?? 0), 0)
    const userMsgs = conversations.reduce((s, c) => s + (c.messages?.filter(m => m.role === 'user').length ?? 0), 0)
    const avgPerConvo = totalConvos > 0 ? (totalMsgs / totalConvos).toFixed(1) : '0'

    // Daily data for last 14 days
    const dailyMap = new Map<string, { convos: number; messages: number }>()
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      dailyMap.set(key, { convos: 0, messages: 0 })
    }
    for (const c of conversations) {
      const key = new Date(c.created_at).toISOString().split('T')[0]
      const entry = dailyMap.get(key)
      if (entry) {
        entry.convos++
        entry.messages += c.messages?.length ?? 0
      }
    }
    const dailyData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      conversations: data.convos,
      messages: data.messages,
    }))

    // Hourly distribution
    const hourlyMap = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, count: 0 }))
    for (const c of conversations) {
      const h = new Date(c.created_at).getHours()
      hourlyMap[h].count++
    }

    // Message role distribution
    const roleDist = [
      { name: 'User', value: userMsgs, fill: 'hsl(var(--foreground))' },
      { name: 'Assistant', value: totalMsgs - userMsgs, fill: 'hsl(var(--muted-foreground))' },
    ]

    return { totalConvos, totalMsgs, userMsgs, avgPerConvo, dailyData, hourlyMap, roleDist }
  }, [conversations])

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl p-6 md:p-8">
      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Insights on how your chatbot is performing.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversations', value: stats.totalConvos, icon: MessageSquare },
          { label: 'Total Messages', value: stats.totalMsgs, icon: TrendingUp },
          { label: 'User Messages', value: stats.userMsgs, icon: Users },
          { label: 'Avg / Chat', value: stats.avgPerConvo, icon: Clock },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-background" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground font-mono">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Conversations over time */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Conversations (Last 14 Days)</h3>
        <p className="text-xs text-muted-foreground mb-6">Daily conversation count over the past two weeks.</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.dailyData}>
              <defs>
                <linearGradient id="fillConvos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Area type="monotone" dataKey="conversations" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#fillConvos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Messages over time + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Messages (Last 14 Days)</h3>
          <p className="text-xs text-muted-foreground mb-6">Total messages per day.</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="messages" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Message Distribution</h3>
          <p className="text-xs text-muted-foreground mb-6">User vs assistant messages.</p>
          <div className="h-[220px] flex items-center justify-center">
            {stats.totalMsgs > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.roleDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats.roleDist.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </div>
          {stats.totalMsgs > 0 && (
            <div className="flex items-center justify-center gap-6 mt-2">
              {stats.roleDist.map(r => (
                <div key={r.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: r.fill }} />
                  <span className="text-muted-foreground">{r.name}: <span className="font-mono font-medium text-foreground">{r.value}</span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Peak hours */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Peak Hours</h3>
        <p className="text-xs text-muted-foreground mb-6">When your chatbot is most active (24-hour format).</p>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.hourlyMap}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
