import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

// Allow up to 60s for deep crawling
export const maxDuration = 60

// Bypass SSL verification for web scraping targets
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/** Parse a sitemap XML and return all <loc> URLs */
async function parseSitemap(sitemapUrl: string, domain: string): Promise<string[]> {
  try {
    const res = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'UniBot/1.0 (Sitemap Parser)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()

    // Handle sitemap index — contains links to other sitemaps
    const sitemapIndexMatches = [...xml.matchAll(/<sitemap[^>]*>[\s\S]*?<loc[^>]*>(.*?)<\/loc>/gi)]
    if (sitemapIndexMatches.length > 0) {
      const childUrls: string[] = []
      for (const match of sitemapIndexMatches.slice(0, 10)) { // Limit child sitemaps
        const childSitemapUrl = match[1].trim()
        const childUrls2 = await parseSitemap(childSitemapUrl, domain)
        childUrls.push(...childUrls2)
      }
      return childUrls
    }

    // Standard sitemap — extract all <loc> entries
    const locMatches = [...xml.matchAll(/<loc[^>]*>(.*?)<\/loc>/gi)]
    return locMatches
      .map(m => m[1].trim())
      .filter(u => {
        try {
          const parsed = new URL(u)
          return parsed.hostname === domain
        } catch {
          return false
        }
      })
  } catch {
    return []
  }
}

/** Get sitemap URLs from robots.txt */
async function getSitemapUrlsFromRobots(baseUrl: string): Promise<string[]> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString()
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'UniBot/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const text = await res.text()
    const lines = text.split('\n')
    const sitemaps: string[] = []
    for (const line of lines) {
      if (line.toLowerCase().startsWith('sitemap:')) {
        const url = line.slice('sitemap:'.length).trim()
        if (url) sitemaps.push(url)
      }
    }
    return sitemaps
  } catch {
    return []
  }
}

/** BFS crawler — discovers links by recursively visiting pages */
async function bfsCrawl(
  rootUrl: string,
  domain: string,
  maxPages: number,
  maxDepth: number
): Promise<{ url: string; title: string }[]> {
  const visited = new Set<string>()
  const results: { url: string; title: string }[] = []
  // Queue: [url, depth]
  const queue: [string, number][] = [[rootUrl, 0]]

  const ASSET_EXT = /\.(png|jpg|jpeg|gif|svg|webp|ico|pdf|zip|exe|tar|gz|css|js|woff|woff2|ttf|eot|mp4|mp3|avi|mkv|xml)$/i

  while (queue.length > 0 && results.length < maxPages) {
    const [currentUrl, depth] = queue.shift()!
    const normalised = currentUrl.replace(/\/$/, '').split('?')[0].split('#')[0]

    if (visited.has(normalised)) continue
    if (depth > maxDepth) continue
    if (ASSET_EXT.test(normalised)) continue
    visited.add(normalised)

    try {
      const res = await fetch(currentUrl, {
        headers: { 'User-Agent': 'UniBot/1.0 (Web Crawler)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue

      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('text/html')) continue

      const html = await res.text()
      const $ = cheerio.load(html)

      const title = $('title').text().trim() || normalised
      results.push({ url: normalised, title })

      // Only follow links if we haven't hit depth limit
      if (depth < maxDepth) {
        $('a[href]').each((_, el) => {
          const href = $(el).attr('href')
          if (!href) return
          try {
            const abs = new URL(href, currentUrl)
            abs.hash = ''
            const clean = abs.toString().replace(/\/$/, '').split('?')[0]

            if (
              abs.hostname === domain &&
              !visited.has(clean) &&
              !ASSET_EXT.test(clean) &&
              (abs.protocol === 'http:' || abs.protocol === 'https:')
            ) {
              queue.push([clean, depth + 1])
            }
          } catch {
            // Invalid URL, skip
          }
        })
      }

      // Small delay to be polite
      await new Promise(r => setTimeout(r, 50))
    } catch {
      // Unreachable or timed out, skip
    }
  }

  return results
}

export async function POST(req: Request) {
  try {
    const { url, chatbotId } = await req.json()

    if (!url || !chatbotId) {
      return NextResponse.json({ error: 'Missing url or chatbotId' }, { status: 400 })
    }

    let rootUrl: URL
    try {
      rootUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const domain = rootUrl.hostname
    const baseOrigin = rootUrl.origin
    console.log(`[Discover] Starting for ${url}, domain=${domain}`)

    const discovered = new Map<string, string>() // url -> title

    // ── STRATEGY 1: Check robots.txt for Sitemap declarations ──────────────
    const robotsSitemaps = await getSitemapUrlsFromRobots(baseOrigin)
    console.log(`[Discover] robots.txt sitemaps: ${robotsSitemaps.length}`)

    // ── STRATEGY 2: Try common sitemap locations ───────────────────────────
    const commonSitemaps = [
      `${baseOrigin}/sitemap.xml`,
      `${baseOrigin}/sitemap_index.xml`,
      `${baseOrigin}/sitemap/sitemap.xml`,
      `${baseOrigin}/sitemap1.xml`,
    ]

    const allSitemapUrls = [...new Set([...robotsSitemaps, ...commonSitemaps])]
    let sitemapHits = 0

    for (const sitemapUrl of allSitemapUrls) {
      const urls = await parseSitemap(sitemapUrl, domain)
      if (urls.length > 0) {
        sitemapHits += urls.length
        for (const u of urls) {
          const clean = u.replace(/\/$/, '').split('#')[0]
          if (!discovered.has(clean)) {
            discovered.set(clean, clean) // title filled later if needed
          }
        }
      }
    }

    console.log(`[Discover] Sitemap found ${sitemapHits} URLs`)

    // ── STRATEGY 3: BFS crawl (always run to find extra pages + titles) ─────
    // If sitemap already gave us many results, limit BFS depth; otherwise go deeper
    const bfsMaxPages = discovered.size > 100 ? 50 : 200
    const bfsDepth = discovered.size > 50 ? 1 : 3

    const bfsResults = await bfsCrawl(url, domain, bfsMaxPages, bfsDepth)
    console.log(`[Discover] BFS found ${bfsResults.length} URLs`)

    for (const { url: u, title } of bfsResults) {
      if (!discovered.has(u)) {
        discovered.set(u, title)
      } else if (discovered.get(u) === u) {
        // Replace URL-as-title with real title from BFS
        discovered.set(u, title)
      }
    }

    // ── BUILD FINAL RESPONSE ───────────────────────────────────────────────
    const rootClean = url.replace(/\/$/, '').split('?')[0].split('#')[0]

    // Make sure root is always first
    const links: { url: string; title: string }[] = []
    if (discovered.has(rootClean)) {
      links.push({ url: rootClean, title: discovered.get(rootClean) ?? 'Home Page' })
    } else {
      links.push({ url: rootClean, title: 'Home Page' })
    }

    for (const [u, title] of discovered.entries()) {
      if (u === rootClean) continue
      links.push({ url: u, title: title === u ? new URL(u).pathname || u : title })
    }

    console.log(`[Discover] Total unique links: ${links.length}`)
    return NextResponse.json({ links: links.slice(0, 500) })

  } catch (err) {
    console.error('[Discover] Unhandled error:', err)
    return NextResponse.json({ error: 'Failed to discover links' }, { status: 500 })
  }
}
