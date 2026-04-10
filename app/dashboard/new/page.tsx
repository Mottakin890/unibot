'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Powerful)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'gpt-4o', label: 'GPT-4o (Powerful)' },
]

export default function NewChatbotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful AI assistant. Answer questions based on the provided context. If you don\'t know the answer, say so honestly.'
  )
  const [temperature, setTemperature] = useState(0.7)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please enter a name for your chatbot')
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setIsLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('chatbots')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description.trim() || null,
        model,
        system_prompt: systemPrompt,
        temperature,
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    router.push(`/dashboard/${data.id}/playground`)
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-2xl">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to chatbots
      </Link>

      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-foreground">
            <MessageSquare className="w-6 h-6 text-background" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create a Chatbot</h1>
            <p className="text-sm text-muted-foreground">Set up your AI assistant in a few simple steps</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Customer Support Bot"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-lg"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
            <Input
              id="description"
              placeholder="A short description of what this bot does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="model" className="text-sm font-medium text-foreground">AI Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-12 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="systemPrompt" className="text-sm font-medium text-foreground">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              rows={4}
              placeholder="Instructions for how your chatbot should behave..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="resize-none rounded-lg"
            />
            <p className="text-xs text-muted-foreground">
              This tells the AI how to respond. You can customize tone, rules, and behavior.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="temperature" className="text-sm font-medium text-foreground">
              Temperature: <span className="font-mono text-muted-foreground">{temperature}</span>
            </Label>
            <input
              id="temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-foreground"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button type="submit" className="h-12 font-semibold rounded-lg shadow-sm" disabled={isLoading}>
            {isLoading ? 'Creating...' : (
              <span className="flex items-center gap-2">
                Create Chatbot
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
