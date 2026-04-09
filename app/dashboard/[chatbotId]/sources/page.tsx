'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useParams } from 'next/navigation'
import { useState, useCallback, useRef } from 'react'
import {
  FileText, Globe, Type, Upload, Trash2, Plus, File,
  HelpCircle, Loader2, CheckCircle2, AlertCircle, X, GripVertical
} from 'lucide-react'
import useSWR from 'swr'

interface DataSource {
  id: string
  type: string
  name: string
  content: string | null
  char_count: number
  created_at: string
  metadata: Record<string, unknown> | null
}

type QAPair = { question: string; answer: string }

const TABS = [
  { id: 'text', label: 'Text', icon: Type },
  { id: 'file', label: 'Files', icon: FileText },
  { id: 'website', label: 'Website', icon: Globe },
  { id: 'qa', label: 'Q&A', icon: HelpCircle },
] as const

export default function SourcesPage() {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const [tab, setTab] = useState<string>('text')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const { data: sources, mutate } = useSWR<DataSource[]>(`sources-${chatbotId}`, async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('data_sources')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false })
    return data ?? []
  })

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const totalChars = sources?.reduce((s, src) => s + (src.char_count || 0), 0) ?? 0

  return (
    <div className="flex flex-col gap-6 max-w-4xl p-6 md:p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg animate-fade-in ${
          toast.type === 'success' ? 'border-border bg-card text-foreground' : 'border-destructive/30 bg-destructive/10 text-destructive'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-foreground tracking-tight">Data Sources</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {sources?.length ?? 0} source{(sources?.length ?? 0) !== 1 ? 's' : ''} &middot; {totalChars.toLocaleString()} characters
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {tab === 'text' && <TextSourceForm chatbotId={chatbotId} onSuccess={mutate} showToast={showToast} />}
        {tab === 'file' && <FileSourceForm chatbotId={chatbotId} onSuccess={mutate} showToast={showToast} />}
        {tab === 'website' && <WebsiteSourceForm chatbotId={chatbotId} onSuccess={mutate} showToast={showToast} />}
        {tab === 'qa' && <QASourceForm chatbotId={chatbotId} onSuccess={mutate} showToast={showToast} />}
      </div>

      {/* Sources list */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          Added Sources ({sources?.length ?? 0})
        </h3>
        {!sources ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : sources.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 p-10 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No sources yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add text, files, websites, or Q&A pairs above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sources.map((source) => (
              <SourceItem key={source.id} source={source} onDelete={mutate} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type FormProps = { chatbotId: string; onSuccess: () => void; showToast: (t: 'success' | 'error', m: string) => void }

function TextSourceForm({ chatbotId, onSuccess, showToast }: FormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('data_sources').insert({
      chatbot_id: chatbotId,
      type: 'text',
      name: `Text (${new Date().toLocaleDateString()})`,
      content: content.trim(),
      char_count: content.trim().length,
    })
    if (error) showToast('error', error.message)
    else { showToast('success', 'Text source added'); setContent(''); onSuccess() }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Add Text Data</h3>
        <p className="text-xs text-muted-foreground mt-1">Paste product info, FAQs, documentation, or any text your chatbot should know.</p>
      </div>
      <Textarea
        placeholder="Paste your text content here..."
        className="min-h-[200px] resize-y bg-background border-border font-mono text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">{content.length.toLocaleString()} chars</span>
        <Button type="submit" disabled={loading || !content.trim()} className="bg-foreground text-background hover:bg-foreground/90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          Add Source
        </Button>
      </div>
    </form>
  )
}

function FileSourceForm({ chatbotId, onSuccess, showToast }: FormProps) {
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setLoading(true)
    const supabase = createClient()
    for (const file of Array.from(files)) {
      try {
        const text = await file.text()
        await supabase.from('data_sources').insert({
          chatbot_id: chatbotId, type: 'file', name: file.name,
          content: text, char_count: text.length,
          metadata: { size: file.size, type: file.type },
        })
      } catch { showToast('error', `Failed: ${file.name}`) }
    }
    showToast('success', `${files.length} file(s) uploaded`)
    setLoading(false)
    onSuccess()
    if (fileRef.current) fileRef.current.value = ''
  }, [chatbotId, onSuccess, showToast])

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Upload Files</h3>
        <p className="text-xs text-muted-foreground mt-1">Upload .txt, .md, .csv, or .json files.</p>
      </div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-all ${
          dragOver ? 'border-foreground bg-muted/30' : 'border-border hover:border-foreground/30 hover:bg-muted/10'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
          {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
        </div>
        <p className="text-sm font-medium text-foreground">{loading ? 'Processing...' : 'Drop files here or click to browse'}</p>
        <p className="text-xs text-muted-foreground">.txt, .md, .csv, .json supported</p>
      </div>
      <input ref={fileRef} type="file" className="hidden" multiple accept=".txt,.md,.csv,.json" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}

function WebsiteSourceForm({ chatbotId, onSuccess, showToast }: FormProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), chatbotId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      showToast('success', `Crawled "${data.title}" (${data.charCount} chars)`)
      setUrl('')
      onSuccess()
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Crawl failed')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Crawl Website</h3>
        <p className="text-xs text-muted-foreground mt-1">Enter a URL to extract text content from a webpage.</p>
      </div>
      <div className="flex gap-3">
        <Input placeholder="https://example.com/about" value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 bg-background border-border" type="url" required />
        <Button type="submit" disabled={!url.trim() || loading} className="bg-foreground text-background hover:bg-foreground/90 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
          {loading ? 'Crawling...' : 'Fetch Page'}
        </Button>
      </div>
      <div className="rounded-lg bg-muted/20 border border-border p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          The crawler extracts text from the provided URL. For best results, link directly to content pages. JS-rendered content may not be captured.
        </p>
      </div>
    </form>
  )
}

function QASourceForm({ chatbotId, onSuccess, showToast }: FormProps) {
  const [pairs, setPairs] = useState<QAPair[]>([{ question: '', answer: '' }])
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const valid = pairs.filter(p => p.question.trim() && p.answer.trim())
    if (valid.length === 0) return
    setLoading(true)
    const content = valid.map(p => `Q: ${p.question}\nA: ${p.answer}`).join('\n\n')
    const supabase = createClient()
    const { error } = await supabase.from('data_sources').insert({
      chatbot_id: chatbotId,
      type: 'qa',
      name: `Q&A (${valid.length} pairs)`,
      content,
      char_count: content.length,
      metadata: { pairs: valid },
    })
    if (error) showToast('error', error.message)
    else { showToast('success', `${valid.length} Q&A pair(s) saved`); setPairs([{ question: '', answer: '' }]); onSuccess() }
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Q&A Pairs</h3>
        <p className="text-xs text-muted-foreground mt-1">Add question and answer pairs to train your chatbot with specific responses.</p>
      </div>
      <div className="flex flex-col gap-3">
        {pairs.map((pair, i) => (
          <div key={i} className="flex gap-3 items-start group">
            <div className="pt-3 text-muted-foreground/40"><GripVertical className="w-4 h-4" /></div>
            <div className="flex-1 flex flex-col gap-2 rounded-lg border border-border bg-background p-4">
              <Input
                placeholder={`Question ${i + 1}`}
                value={pair.question}
                onChange={(e) => { const n = [...pairs]; n[i].question = e.target.value; setPairs(n) }}
                className="border-border bg-muted/10 text-sm"
              />
              <Textarea
                placeholder="Answer"
                value={pair.answer}
                onChange={(e) => { const n = [...pairs]; n[i].answer = e.target.value; setPairs(n) }}
                className="min-h-[80px] resize-y border-border bg-muted/10 text-sm"
              />
            </div>
            {pairs.length > 1 && (
              <button onClick={() => setPairs(pairs.filter((_, j) => j !== i))}
                className="pt-3 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setPairs([...pairs, { question: '', answer: '' }])} className="border-dashed">
          <Plus className="w-4 h-4 mr-1" /> Add Pair
        </Button>
        <Button onClick={handleSave} disabled={loading || !pairs.some(p => p.question.trim() && p.answer.trim())} className="bg-foreground text-background hover:bg-foreground/90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Save Q&A Pairs
        </Button>
      </div>
    </div>
  )
}

function SourceItem({ source, onDelete }: { source: DataSource; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false)
  const handleDelete = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('data_sources').delete().eq('id', source.id)
    onDelete()
  }
  const iconMap: Record<string, React.ElementType> = { text: Type, file: FileText, website: Globe, qa: HelpCircle }
  const Icon = iconMap[source.type] ?? FileText

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 group hover:border-foreground/20 transition-colors">
      <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-background" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
        <p className="text-xs text-muted-foreground font-mono">
          {source.type} &middot; {(source.char_count || 0).toLocaleString()} chars
        </p>
      </div>
      <Button
        variant="ghost" size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={handleDelete} disabled={deleting}
      >
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        <span className="sr-only">Delete source</span>
      </Button>
    </div>
  )
}
