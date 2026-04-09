'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useParams } from 'next/navigation'
import { useState, useCallback, useRef } from 'react'
import {
  FileText, Globe, Type, Upload, Trash2, Plus, File,
  HelpCircle, Loader2, CheckCircle2, AlertCircle, X, GripVertical,
  Search, Link2, RefreshCw, CheckSquare, Square
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

interface DiscoveredLink {
  url: string
  title: string
}

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
    setTimeout(() => setToast(null), 4000)
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

// ─── FILE SOURCE FORM ────────────────────────────────────────────────────────

function FileSourceForm({ chatbotId, onSuccess, showToast }: FormProps) {
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [processingFiles, setProcessingFiles] = useState<{ name: string; status: 'parsing' | 'saving' | 'done' | 'error' }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setLoading(true)
    const supabase = createClient()
    const fileArray = Array.from(files)

    setProcessingFiles(fileArray.map(f => ({ name: f.name, status: 'parsing' })))

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const isPdf = file.name.endsWith('.pdf')
      const isDocx = file.name.endsWith('.docx')

      try {
        setProcessingFiles(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'parsing' } : p))

        let text = ''
        if (isPdf || isDocx) {
          // Server-side parsing for PDF and DOCX
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch('/api/parse/file', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? 'Parse failed')
          text = data.text
        } else {
          // Client-side for plaintext files
          text = await file.text()
        }

        setProcessingFiles(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'saving' } : p))

        const { error } = await supabase.from('data_sources').insert({
          chatbot_id: chatbotId,
          type: 'file',
          name: file.name,
          content: text,
          char_count: text.length,
          metadata: { size: file.size, mimeType: file.type },
        })

        if (error) throw error

        setProcessingFiles(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'done' } : p))
      } catch (err) {
        setProcessingFiles(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'error' } : p))
        showToast('error', `Failed: ${file.name}`)
      }
    }

    const doneCount = fileArray.length
    showToast('success', `${doneCount} file(s) processed`)
    setLoading(false)
    onSuccess()
    setTimeout(() => setProcessingFiles([]), 2000)
    if (fileRef.current) fileRef.current.value = ''
  }, [chatbotId, onSuccess, showToast])

  const statusIcon = (status: string) => {
    if (status === 'parsing' || status === 'saving') return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
    if (status === 'done') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    return <AlertCircle className="w-4 h-4 text-destructive" />
  }

  const statusLabel = (status: string) => {
    if (status === 'parsing') return 'Parsing...'
    if (status === 'saving') return 'Saving...'
    if (status === 'done') return 'Done'
    return 'Error'
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Upload Files</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Upload <span className="font-mono font-medium">.txt .md .csv .json .pdf .docx</span> files for training.
        </p>
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
        <p className="text-sm font-medium text-foreground">{loading ? 'Processing files...' : 'Drop files here or click to browse'}</p>
        <p className="text-xs text-muted-foreground">.txt, .md, .csv, .json, .pdf, .docx supported</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        multiple
        accept=".txt,.md,.csv,.json,.pdf,.docx"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Per-file progress */}
      {processingFiles.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/10 p-3">
          {processingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {statusIcon(f.status)}
              <span className="flex-1 truncate text-foreground">{f.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">{statusLabel(f.status)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── WEBSITE SOURCE FORM ─────────────────────────────────────────────────────

function WebsiteSourceForm({ chatbotId, onSuccess, showToast }: FormProps) {
  const [url, setUrl] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [discoveryStatus, setDiscoveryStatus] = useState('')
  const [discoveredLinks, setDiscoveredLinks] = useState<DiscoveredLink[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [linkFilter, setLinkFilter] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scrapeProgress, setScrapeProgress] = useState({ done: 0, total: 0 })

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    setDiscovering(true)
    setDiscoveredLinks([])
    setSelectedUrls(new Set())
    setDiscoveryStatus('Checking sitemap.xml...')

    // Progressive status updates so the user knows it's working
    const statusTimer = setTimeout(() => setDiscoveryStatus('Crawling pages recursively...'), 4000)

    try {
      const res = await fetch('/api/scrape/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), chatbotId }),
      })
      clearTimeout(statusTimer)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Discovery failed')
      setDiscoveredLinks(data.links ?? [])
      setDiscoveryStatus('')
      // Auto-select the root URL
      if (data.links?.length > 0) {
        setSelectedUrls(new Set([data.links[0].url]))
      }
      showToast('success', `Found ${data.links?.length ?? 0} pages on ${new URL(url.trim()).hostname}`)
    } catch (err) {
      clearTimeout(statusTimer)
      setDiscoveryStatus('')
      showToast('error', err instanceof Error ? err.message : 'Discovery failed')
    }

    setDiscovering(false)
  }

  const toggleSelect = (linkUrl: string) => {
    setSelectedUrls(prev => {
      const next = new Set(prev)
      if (next.has(linkUrl)) next.delete(linkUrl)
      else next.add(linkUrl)
      return next
    })
  }

  const filteredLinks = discoveredLinks.filter(l =>
    l.url.toLowerCase().includes(linkFilter.toLowerCase()) ||
    l.title.toLowerCase().includes(linkFilter.toLowerCase())
  )

  const allSelected = filteredLinks.length > 0 && filteredLinks.every(l => selectedUrls.has(l.url))

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedUrls(prev => {
        const next = new Set(prev)
        filteredLinks.forEach(l => next.delete(l.url))
        return next
      })
    } else {
      setSelectedUrls(prev => {
        const next = new Set(prev)
        filteredLinks.forEach(l => next.add(l.url))
        return next
      })
    }
  }

  const handleScrapeSelected = async () => {
    if (selectedUrls.size === 0) return
    const urlsToScrape = Array.from(selectedUrls)
    setScraping(true)
    setScrapeProgress({ done: 0, total: urlsToScrape.length })

    // Scrape in batches of 3 to avoid overloading the server
    const BATCH_SIZE = 3
    let done = 0

    for (let i = 0; i < urlsToScrape.length; i += BATCH_SIZE) {
      const batch = urlsToScrape.slice(i, i + BATCH_SIZE)
      try {
        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: batch, chatbotId }),
        })
        const data = await res.json()
        done += data.successCount ?? batch.length
        setScrapeProgress({ done, total: urlsToScrape.length })
      } catch {
        done += batch.length
        setScrapeProgress({ done, total: urlsToScrape.length })
      }
    }

    showToast('success', `Trained on ${done} of ${urlsToScrape.length} page(s)`)
    setScraping(false)
    onSuccess()
  }

  const progressPct = scrapeProgress.total > 0 ? Math.round((scrapeProgress.done / scrapeProgress.total) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Crawl Website</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Enter a URL to discover all links on the site. Then choose which pages to train your chatbot on.
        </p>
      </div>

      {/* URL input + Discover button */}
      <form onSubmit={handleDiscover} className="flex gap-3">
        <Input
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-background border-border"
          type="url"
          required
        />
        <Button type="submit" disabled={!url.trim() || discovering} className="bg-foreground text-background hover:bg-foreground/90 shrink-0">
          {discovering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
          {discovering ? 'Discovering...' : 'Discover Links'}
        </Button>
      </form>

      {/* Discovery progress status */}
      {discovering && discoveryStatus && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{discoveryStatus}</span>
          <span className="text-muted-foreground/50">&mdash; This may take up to 30s for large sites</span>
        </div>
      )}

      {/* Link Discovery Results */}
      {discoveredLinks.length > 0 && (
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                {discoveredLinks.length} link{discoveredLinks.length !== 1 ? 's' : ''} found
              </span>
              <span className="text-xs text-muted-foreground">
                &middot; {selectedUrls.size} selected
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setDiscoveredLinks([]); setSelectedUrls(new Set()) }}
              className="h-7 gap-1 text-xs"
            >
              <X className="w-3 h-3" /> Clear
            </Button>
          </div>

          {/* Filter input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter links..."
              value={linkFilter}
              onChange={e => setLinkFilter(e.target.value)}
              className="pl-8 h-8 text-sm bg-background border-border"
            />
          </div>

          {/* Select All toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >  
              {allSelected
                ? <CheckSquare className="w-4 h-4 text-foreground" />
                : <Square className="w-4 h-4" />}
              {allSelected ? 'Deselect All' : 'Select All'} ({filteredLinks.length})
            </button>
          </div>

          {/* Scrollable links list */}
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-background p-2 pr-1">
            {filteredLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 text-center">No links match your filter.</p>
            ) : filteredLinks.map((link) => {
              const isSelected = selectedUrls.has(link.url)
              return (
                <button
                  key={link.url}
                  type="button"
                  onClick={() => toggleSelect(link.url)}
                  className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-left w-full transition-colors group ${
                    isSelected ? 'bg-foreground/5 border border-foreground/10' : 'hover:bg-muted/40 border border-transparent'
                  }`}
                >
                  <div className={`w-4 h-4 shrink-0 rounded border transition-colors flex items-center justify-center ${
                    isSelected ? 'bg-foreground border-foreground' : 'border-border group-hover:border-foreground/40'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-background" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{link.title || link.url}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{link.url}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Scraping progress */}
          {scraping && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Scraping pages...
                </span>
                <span className="font-mono">{scrapeProgress.done}/{scrapeProgress.total}</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          )}

          {/* Train button */}
          <Button
            type="button"
            onClick={handleScrapeSelected}
            disabled={selectedUrls.size === 0 || scraping}
            className="w-full bg-foreground text-background hover:bg-foreground/90"
          >
            {scraping
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Training {scrapeProgress.done}/{scrapeProgress.total}...</>
              : <><RefreshCw className="w-4 h-4 mr-2" />Train on {selectedUrls.size} Selected Page{selectedUrls.size !== 1 ? 's' : ''}</>
            }
          </Button>
        </div>
      )}

      {/* Empty state hint */}
      {discoveredLinks.length === 0 && !discovering && (
        <div className="rounded-lg bg-muted/20 border border-border p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">How it works:</strong> Enter a website URL and click "Discover Links". UniBot will scan the page and find all internal links. You can then select the specific pages you want to train your chatbot on.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Q&A SOURCE FORM ─────────────────────────────────────────────────────────

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

// ─── SOURCE ITEM ─────────────────────────────────────────────────────────────

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
  const metaUrl = source.metadata?.url as string | undefined

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 group hover:border-foreground/20 transition-colors">
      <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-background" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{source.name}</p>
        <p className="text-xs text-muted-foreground font-mono">
          {source.type} &middot; {(source.char_count || 0).toLocaleString()} chars
          {metaUrl && <span className="ml-1 text-muted-foreground/60">&middot; {metaUrl}</span>}
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
