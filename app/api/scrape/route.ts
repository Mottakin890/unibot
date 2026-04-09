import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { url, chatbotId } = await req.json()

    if (!url || !chatbotId) {
      console.error('[API /api/scrape POST] Missing url or chatbotId payload')
      return NextResponse.json({ error: 'Missing url or chatbotId' }, { status: 400 })
    }

    console.log(`[API /api/scrape POST] Starting scrape for url: ${url} at chatbot: ${chatbotId}`)

    // Fetch the page content
    const response = await fetch(url, {
      headers: { 'User-Agent': 'UniBot/1.0 (Web Scraper)' },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.error(`[API /api/scrape POST] Failed to fetch URL, status: ${response.status}`)
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }

    const html = await response.text()

    // Basic HTML to text extraction
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100000) // Limit to 100k chars

    if (!text) {
      console.error(`[API /api/scrape POST] No text content found after parsing ${url}`)
      return NextResponse.json({ error: 'No content found on page' }, { status: 400 })
    }

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i)
    const title = titleMatch?.[1]?.trim() || new URL(url).hostname

    const supabase = await createClient()
    const { error } = await supabase.from('data_sources').insert({
      chatbot_id: chatbotId,
      type: 'website',
      name: title,
      content: text,
      char_count: text.length,
      metadata: { url },
    })

    if (error) {
      console.error('[API /api/scrape POST] Supabase insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[API /api/scrape POST] Successfully scraped ${url} and saved ${text.length} chars`)
    return NextResponse.json({ success: true, charCount: text.length, title })
  } catch (err) {
    console.error('[API /api/scrape POST] Unhandled exception:', err)
    return NextResponse.json({ error: 'Failed to scrape website' }, { status: 500 })
  }
}
