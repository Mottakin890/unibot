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
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Save, Trash2 } from 'lucide-react'
import useSWR from 'swr'

const MODELS = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Powerful)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast)' },
  { value: 'gpt-4o', label: 'GPT-4o (Powerful)' },
]

export default function SettingsPage() {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { data: chatbot, mutate } = useSWR(`chatbot-${chatbotId}`, async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('chatbots')
      .select('*')
      .eq('id', chatbotId)
      .single()
    return data
  })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('gemini-2.5-flash')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [welcomeMessage, setWelcomeMessage] = useState('')

  useEffect(() => {
    if (chatbot) {
      setName(chatbot.name ?? '')
      setDescription(chatbot.description ?? '')
      setModel(chatbot.model ?? 'gemini-2.5-flash')
      setSystemPrompt(chatbot.system_prompt ?? '')
      setTemperature(chatbot.temperature ?? 0.7)
      setWelcomeMessage(chatbot.welcome_message ?? '')
    }
  }, [chatbot])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('chatbots')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        model,
        system_prompt: systemPrompt,
        temperature,
        welcome_message: welcomeMessage.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', chatbotId)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      mutate()
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this chatbot? All data, sources, and conversations will be permanently lost.')) return
    try {
      await fetch(`/api/chatbots/${chatbotId}`, { method: 'DELETE' })
      router.push('/dashboard')
    } catch {
      setError('Failed to delete chatbot')
    }
  }

  if (!chatbot) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse flex flex-col gap-4 max-w-2xl">
          <div className="h-8 bg-secondary rounded w-48" />
          <div className="h-11 bg-secondary rounded" />
          <div className="h-11 bg-secondary rounded" />
          <div className="h-24 bg-secondary rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <h2 className="text-xl font-semibold text-foreground">General Settings</h2>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-11" required />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="h-11" />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">AI Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="h-11">
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
          <Textarea id="systemPrompt" rows={5} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="resize-none" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="welcomeMessage" className="text-sm font-medium text-foreground">Welcome Message</Label>
          <Input
            id="welcomeMessage"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            className="h-11"
            placeholder="Hi! How can I help you today?"
          />
          <p className="text-xs text-muted-foreground">Shown when the chat widget loads. Leave empty for no welcome message.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="temperature" className="text-sm font-medium text-foreground">Temperature: {temperature}</Label>
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

        {success && (
          <div className="rounded-lg bg-muted/30 border border-border px-4 py-3">
            <p className="text-sm text-foreground font-medium">Settings saved successfully!</p>
          </div>
        )}

        <Button type="submit" disabled={saving} className="h-11 font-medium w-fit">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </form>

      {/* Danger zone */}
      <div className="mt-12 pt-8 border-t border-border">
        <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete this chatbot and all its data, sources, and conversation history.
        </p>
        <Button variant="destructive" onClick={handleDelete} className="h-10">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Chatbot
        </Button>
      </div>
    </div>
  )
}
