/**
 * Firecrawl-based content scraper for the weekly digest pipeline.
 *
 * Uses the Firecrawl API to extract full article text from web sources.
 * Falls back gracefully if a source fails (bot protection, rate limits, etc).
 *
 * Flow per source:
 *   1. RSS sources: fetch + parse XML (no Firecrawl needed)
 *   2. scrapeDepth=0: scrape page directly, extract article text
 *   3. scrapeDepth=1+: map page for article links, then scrape each
 */

import type { WeeklySource } from './sources'
import { getSourceBatches } from './sources'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScrapedArticle {
  url: string
  title: string
  content: string
  sourceName: string
  publishedAt?: string
  scrapedAt: string
}

interface FirecrawlScrapeResponse {
  success: boolean
  data?: {
    markdown?: string
    title?: string
    url?: string
    metadata?: {
      title?: string
      description?: string
      publishedTime?: string
      ogUrl?: string
      [key: string]: unknown
    }
  }
  error?: string
}

interface FirecrawlMapResponse {
  success: boolean
  links?: string[]
  error?: string
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev'
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
const MAX_CONTENT_LENGTH = 5000
const SCRAPE_TIMEOUT = 30_000
const INTER_REQUEST_DELAY = 500
const INTER_BATCH_DELAY = 3000

// ---------------------------------------------------------------------------
// Firecrawl API helpers
// ---------------------------------------------------------------------------

async function firecrawlFetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT)

  try {
    const res = await fetch(`${FIRECRAWL_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Firecrawl ${endpoint} failed: ${res.status} ${text.slice(0, 200)}`)
    }

    return await res.json() as T
  } finally {
    clearTimeout(timeout)
  }
}

/** Scrape a single URL and return markdown content. */
async function scrapePage(url: string): Promise<FirecrawlScrapeResponse> {
  return firecrawlFetch<FirecrawlScrapeResponse>('/v1/scrape', {
    url,
    formats: ['markdown'],
    onlyMainContent: true,
    timeout: SCRAPE_TIMEOUT,
  })
}

/** Map a URL to discover linked pages. */
async function mapPage(url: string, limit: number): Promise<string[]> {
  const res = await firecrawlFetch<FirecrawlMapResponse>('/v1/map', {
    url,
    limit,
  })
  return res.links ?? []
}

// ---------------------------------------------------------------------------
// Source scraping
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Scrape a single source, returning extracted articles. */
async function scrapeSource(source: WeeklySource): Promise<ScrapedArticle[]> {
  const articles: ScrapedArticle[] = []
  const now = new Date().toISOString()

  try {
    if (source.scrapeDepth === 0) {
      // Direct scrape: get page content as-is
      const result = await scrapePage(source.url)
      if (result.success && result.data?.markdown) {
        articles.push({
          url: result.data.url || source.url,
          title: result.data.metadata?.title || result.data.title || source.name,
          content: result.data.markdown.slice(0, MAX_CONTENT_LENGTH),
          sourceName: source.name,
          publishedAt: result.data.metadata?.publishedTime,
          scrapedAt: now,
        })
      }
    } else {
      // Depth 1+: map page for article links, then scrape each
      const links = await mapPage(source.url, source.maxPages)
      const articleLinks = links
        .filter((link) => link !== source.url && !link.includes('#'))
        .slice(0, source.maxPages)

      console.log(`  [${source.name}] Found ${articleLinks.length} article links`)

      for (const link of articleLinks) {
        try {
          await sleep(INTER_REQUEST_DELAY)
          const result = await scrapePage(link)
          if (result.success && result.data?.markdown) {
            articles.push({
              url: result.data.url || link,
              title: result.data.metadata?.title || result.data.title || '',
              content: result.data.markdown.slice(0, MAX_CONTENT_LENGTH),
              sourceName: source.name,
              publishedAt: result.data.metadata?.publishedTime,
              scrapedAt: now,
            })
          }
        } catch (err) {
          console.warn(`  [${source.name}] Failed to scrape ${link}:`, (err as Error).message)
        }
      }
    }
  } catch (err) {
    console.warn(`  [${source.name}] Source scrape failed:`, (err as Error).message)
  }

  return articles
}

// ---------------------------------------------------------------------------
// Batch orchestration
// ---------------------------------------------------------------------------

/**
 * Scrape all sources in batches by tier priority.
 *
 * Tier 1 sources run first (highest signal), then tier 2, then tier 3.
 * Within each tier, sources are processed sequentially with a delay
 * between requests to respect rate limits.
 */
export async function scrapeAllSources(): Promise<ScrapedArticle[]> {
  if (!FIRECRAWL_API_KEY) {
    console.warn('  FIRECRAWL_API_KEY not set, skipping web scraping')
    return []
  }

  const batches = getSourceBatches()
  const allArticles: ScrapedArticle[] = []

  for (let tier = 0; tier < batches.length; tier++) {
    const batch = batches[tier]
    console.log(`  Scraping tier ${tier + 1}: ${batch.length} sources`)

    for (const source of batch) {
      console.log(`  Scraping: ${source.name} (${source.url})`)
      const articles = await scrapeSource(source)
      allArticles.push(...articles)
      console.log(`  -> ${articles.length} articles from ${source.name}`)

      // Delay between sources within a tier
      await sleep(INTER_REQUEST_DELAY)
    }

    // Delay between tiers
    if (tier < batches.length - 1) {
      await sleep(INTER_BATCH_DELAY)
    }
  }

  console.log(`  Total scraped: ${allArticles.length} articles from ${batches.flat().length} sources`)
  return allArticles
}
