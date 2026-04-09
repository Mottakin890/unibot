import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Allow up to 30s for fetching and parsing large websites
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { url, chatbotId } = await req.json()

    if (!url || !chatbotId) {
      console.error('[API /api/scrape/discover POST] Missing url or chatbotId')
      return NextResponse.json({ error: 'Missing url or chatbotId' }, { status: 400 })
    }

    console.log(`[API /api/scrape/discover POST] Discovering links for: ${url}`)

    let targetUrl: URL
    try {
      targetUrl = new URL(url)
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const domain = targetUrl.hostname

    const response = await fetch(url, {
      headers: { 'User-Agent': 'UniBot/1.0 (Link Discovery)' },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      console.error(`[API /api/scrape/discover POST] Failed to fetch root URL, status: ${response.status}`)
      return NextResponse.json({ error: 'Failed to fetch root URL' }, { status: 400 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)
    
    const urlSet = new Set<string>()
    const discovered: { url: string; title: string }[] = []

    // Add root URL itself as first option
    const cleanRoot = url.replace(/\/$/, '')
    urlSet.add(cleanRoot)
    discovered.push({ url: cleanRoot, title: 'Home Page' })

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (!href) return

      try {
        const absoluteUrl = new URL(href, url)
        // Only same domain, remove query/hash to avoid dupes
        absoluteUrl.search = ''
        absoluteUrl.hash = ''
        
        const fullUrl = absoluteUrl.toString().replace(/\/$/, '')
        
        // Basic filtering: same hostname, not a file (likely), not already found
        if (absoluteUrl.hostname === domain && !urlSet.has(fullUrl)) {
          // Ignore clear assets
          if (/\.(png|jpg|jpeg|gif|pdf|zip|exe|css|js)$/i.test(fullUrl)) return

          urlSet.add(fullUrl)
          const linkText = $(el).text().trim()
          discovered.push({ url: fullUrl, title: linkText || fullUrl })
        }
      } catch (e) {
        // Invalid URL construction
      }
    })

    console.log(`[API /api/scrape/discover POST] Found ${discovered.length} links for ${url}`)
    return NextResponse.json({ links: discovered.slice(0, 100) }) // Return up to 100 links
  } catch (err) {
    console.error('[API /api/scrape/discover POST] Unhandled exception:', err)
    return NextResponse.json({ error: 'Failed to discover links' }, { status: 500 })
  }
}
