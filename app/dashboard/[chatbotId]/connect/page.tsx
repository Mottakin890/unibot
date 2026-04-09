'use client'

import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Check, Copy, Code, ExternalLink } from 'lucide-react'
import { useState } from 'react'

export default function ConnectPage() {
  const { chatbotId } = useParams<{ chatbotId: string }>()
  const [copied, setCopied] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'

  const iframeCode = `<iframe
  src="${origin}/widget/${chatbotId}"
  style="width: 400px; height: 600px; border: none; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1);"
  allow="clipboard-write"
></iframe>`

  const scriptCode = `<script>
  (function() {
    var d = document, s = d.createElement('script');
    s.src = '${origin}/widget-loader.js';
    s.setAttribute('data-chatbot-id', '${chatbotId}');
    s.async = true;
    d.body.appendChild(s);
  })();
</script>`

  const shareLink = `${origin}/widget/${chatbotId}`

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Connect & Embed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add your chatbot to any website using one of the methods below.
          </p>
        </div>

        {/* Share link */}
        <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Share Link</h3>
          </div>
          <p className="text-sm text-muted-foreground">Direct link to your chatbot. Share it with anyone.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-secondary px-4 py-2.5 text-sm text-foreground font-mono truncate">
              {shareLink}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-10 w-10"
              onClick={() => copyToClipboard(shareLink, 'link')}
            >
              {copied === 'link' ? <Check className="w-4 h-4 text-foreground" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Iframe embed */}
        <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Iframe Embed</h3>
          </div>
          <p className="text-sm text-muted-foreground">Embed the chatbot directly on your page as an iframe.</p>
          <div className="relative">
            <pre className="rounded-lg bg-secondary p-4 text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap">
              {iframeCode}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(iframeCode, 'iframe')}
            >
              {copied === 'iframe' ? <Check className="w-3.5 h-3.5 mr-1.5 text-foreground" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied === 'iframe' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* Script embed */}
        <div className="rounded-xl border border-border p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Chat Bubble (Script Tag)</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {"Add a floating chat bubble to your website. Paste this before your closing </body> tag."}
          </p>
          <div className="relative">
            <pre className="rounded-lg bg-secondary p-4 text-xs text-foreground font-mono overflow-x-auto whitespace-pre-wrap">
              {scriptCode}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(scriptCode, 'script')}
            >
              {copied === 'script' ? <Check className="w-3.5 h-3.5 mr-1.5 text-foreground" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied === 'script' ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
