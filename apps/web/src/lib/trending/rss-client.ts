import type { TrendingItem, CollectionResult } from './types'

const FETCH_TIMEOUT_MS = 15000

export interface RSSFeedConfig {
  url: string
  name: string
  source: 'rss' | 'arxiv'
}

export const AI_FEEDS: RSSFeedConfig[] = [
  { url: 'https://aigc-weekly.agi.li/rss.xml', name: 'AIGC Weekly', source: 'rss' },
  { url: 'https://tldr.tech/ai/rss', name: 'TLDR AI', source: 'rss' },
  { url: 'https://arxiv.org/rss/cs.AI', name: 'ArXiv cs.AI', source: 'arxiv' },
  { url: 'https://arxiv.org/rss/cs.CL', name: 'ArXiv cs.CL', source: 'arxiv' },
  { url: 'https://arxiv.org/rss/cs.LG', name: 'ArXiv cs.LG', source: 'arxiv' },
]

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
}

/** Simple string hash for generating deterministic IDs without crypto */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function parseItems(xml: string, config: RSSFeedConfig, limit: number): TrendingItem[] {
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  const now = new Date().toISOString()

  return itemMatches.slice(0, limit).map((itemXml) => {
    const title =
      itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] ??
      itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[2] ??
      'Untitled'
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const pubDate =
      itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ??
      itemXml.match(/<dc:date>(.*?)<\/dc:date>/)?.[1]
    const description =
      itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ??
      itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1] ??
      ''
    const author =
      itemXml.match(/<dc:creator>(.*?)<\/dc:creator>/)?.[1] ??
      itemXml.match(/<author>(.*?)<\/author>/)?.[1]

    const cleanDescription = stripHtml(description)
    const sourceId = link ? link.replace(/^https?:\/\//, '').slice(0, 120) : simpleHash(title)

    return {
      id: `${config.source}:${simpleHash(link || title)}`,
      source: config.source,
      sourceId,
      url: link,
      title: stripHtml(title),
      content: cleanDescription,
      author: author ? stripHtml(author) : undefined,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : now,
      collectedAt: now,
      metrics: {},
    } satisfies TrendingItem
  })
}

/**
 * Fetch and parse a single RSS/Atom feed into TrendingItems
 */
export async function fetchFeed(config: RSSFeedConfig, limit = 20): Promise<TrendingItem[]> {
  const response = await fetchWithTimeout(config.url)
  if (!response.ok) {
    throw new Error(`Feed fetch failed for ${config.name}: ${response.status}`)
  }

  const xml = await response.text()
  return parseItems(xml, config, limit)
}

/**
 * Fetch all configured feeds in parallel with error isolation
 */
export async function fetchAllFeeds(
  feeds: RSSFeedConfig[] = AI_FEEDS,
  limit = 20,
): Promise<CollectionResult> {
  const results = await Promise.allSettled(feeds.map((feed) => fetchFeed(feed, limit)))
  const items: TrendingItem[] = []
  const errors: string[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value)
    } else {
      errors.push(`${feeds[i].name}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`)
    }
  })

  return {
    source: 'rss',
    items,
    errors: errors.length > 0 ? errors : undefined,
    collectedAt: new Date().toISOString(),
  }
}
