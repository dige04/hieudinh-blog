import type { TrendingItem } from './types'

const TRACKING_PARAMS: string[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'twclid',
  'ref',
  'ref_src',
  'ref_url',
]

/**
 * Normalize a URL by stripping tracking params, trailing slashes,
 * lowercasing the hostname, and removing www. prefix.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // Lowercase hostname and remove www. prefix
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')

    // Remove tracking params
    const keysToDelete: string[] = []
    parsed.searchParams.forEach((_value, key) => {
      if (TRACKING_PARAMS.includes(key.toLowerCase())) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => parsed.searchParams.delete(key))

    // Sort remaining params for consistent comparison
    parsed.searchParams.sort()

    // Build normalized URL, strip trailing slash from pathname
    const pathname = parsed.pathname.replace(/\/+$/, '') || '/'
    const search = parsed.searchParams.toString()
    const searchStr = search ? `?${search}` : ''

    return `${parsed.protocol}//${parsed.hostname}${pathname}${searchStr}`
  } catch {
    // If URL parsing fails, return as-is lowercased
    return url.toLowerCase().replace(/\/+$/, '')
  }
}

/**
 * Normalize a title for comparison: lowercase, strip punctuation, split into word array.
 */
function titleToWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

/**
 * Check if two titles are similar using Jaccard similarity.
 * @param threshold Minimum similarity to consider as duplicate (default 0.85)
 */
export function isSimilarTitle(
  a: string,
  b: string,
  threshold = 0.85
): boolean {
  const wordsA = titleToWords(a)
  const wordsB = titleToWords(b)

  if (wordsA.length === 0 || wordsB.length === 0) {
    return false
  }

  const setB = new Set(wordsB)
  let intersection = 0
  const uniqueA = new Set(wordsA)
  uniqueA.forEach((word) => {
    if (setB.has(word)) {
      intersection++
    }
  })

  const union = uniqueA.size + setB.size - intersection
  const similarity = intersection / union

  return similarity >= threshold
}

/**
 * Sum all numeric engagement metrics for comparison.
 */
function engagementScore(item: TrendingItem): number {
  const m = item.metrics
  return (m.likes ?? 0) + (m.retweets ?? 0) + (m.comments ?? 0) + (m.score ?? 0) + (m.forks ?? 0)
}

/**
 * Deduplicate items by normalized URL and title similarity.
 * Keeps the item with higher engagement metrics when duplicates are found.
 */
export function deduplicateItems(items: TrendingItem[]): TrendingItem[] {
  const seen = new Map<string, TrendingItem>()

  // Pass 1: deduplicate by normalized URL
  for (const item of items) {
    const key = normalizeUrl(item.url)
    const existing = seen.get(key)

    if (!existing || engagementScore(item) > engagementScore(existing)) {
      seen.set(key, item)
    }
  }

  // Pass 2: deduplicate by title similarity
  const urlDeduped: TrendingItem[] = []
  seen.forEach((item) => urlDeduped.push(item))
  const result: TrendingItem[] = []

  for (const item of urlDeduped) {
    const duplicate = result.find((r) => isSimilarTitle(r.title, item.title))

    if (!duplicate) {
      result.push(item)
    } else if (engagementScore(item) > engagementScore(duplicate)) {
      const idx = result.indexOf(duplicate)
      result[idx] = item
    }
  }

  return result
}
