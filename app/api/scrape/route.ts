import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Allow up to 60s for batch scraping multiple pages
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { url, urls, chatbotId } = await req.json()
    const chatbotIdStr = chatbotId as string

    // Support both single "url" and array "urls" for backward compatibility
    const targetUrls: string[] = urls || (url ? [url] : [])

    if (targetUrls.length === 0 || !chatbotIdStr) {
      console.error('[API /api/scrape POST] Missing target URLs or chatbotId')
      return NextResponse.json({ error: 'Missing target URLs or chatbotId' }, { status: 400 })
    }

    console.log(`[API /api/scrape POST] Starting batch scrape for ${targetUrls.length} links at chatbot: ${chatbotIdStr}`)

    const results = []
    const supabase = await createClient()

    for (const link of targetUrls) {
      try {
        console.log(`[API /api/scrape POST] Scraping: ${link}`)
        const response = await fetch(link, {
          headers: { 'User-Agent': 'UniBot/1.0 (Web Scraper)' },
          signal: AbortSignal.timeout(10000),
        })

        if (!response.ok) {
          console.error(`[API /api/scrape POST] Failed to fetch ${link}, status: ${response.status}`)
          results.push({ url: link, success: false, error: `Status ${response.status}` })
          continue
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Remove script, style, nav, footer, ads
        $('script, style, nav, footer, iframe, noscript, .ads, .sidebar, #comments').remove()

        // Extract body text or main content if possible
        const mainContent = $('main, article, #content, .content').first()
        let text = ''
        
        if (mainContent.length > 0) {
          text = mainContent.text()
        } else {
          text = $('body').text()
        }

        text = text
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 150000) // Limit to 150k chars per page

        if (!text || text.length < 20) {
          results.push({ url: link, success: false, error: 'Empty content' })
          continue
        }

        const title = $('title').text().trim() || new URL(link).hostname

        const { error } = await supabase.from('data_sources').insert({
          chatbot_id: chatbotIdStr,
          type: 'website',
          name: title,
          content: text,
          char_count: text.length,
          metadata: { url: link },
        })

        if (error) throw error

        console.log(`[API /api/scrape POST] Saved ${link} (${text.length} chars)`)
        results.push({ url: link, success: true, charCount: text.length, title })
      } catch (err) {
        console.error(`[API /api/scrape POST] Error scraping ${link}:`, err)
        results.push({ url: link, success: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    const successCount = results.filter(r => r.success).length
    return NextResponse.json({ 
      success: successCount > 0, 
      count: targetUrls.length,
      successCount,
      results 
    })
  } catch (err) {
    console.error('[API /api/scrape POST] Unhandled exception:', err)
    return NextResponse.json({ error: 'Failed to process batch scrape' }, { status: 500 })
  }
}
