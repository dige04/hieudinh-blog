/**
 * Multi-source parallel fetch orchestrator.
 * Tiered-priority batch pattern: sources within the same tier run in parallel
 * via Promise.allSettled; tiers execute sequentially with a 2s inter-tier delay.
 */
import type { TrendingItem, TrendingSource, SourceConfig, CollectionResult } from './types'
import type { HNStory } from '../hn/client'
import { fetchTopStories } from '../hn/client'
import { collectFromX } from '../x/client'

const AI_KEYWORDS = [
  'ai', 'ml', 'llm', 'gpt', 'claude', 'gemini',
  'transformer', 'neural', 'deep learning', 'machine learning',
  'nlp', 'diffusion', 'rag', 'fine-tune', 'model', 'agent',
]

const AI_KEYWORD_RE = new RegExp(
  AI_KEYWORDS.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i',
)

const TIER_DELAY_MS = 2000

const DEFAULT_CONFIGS: Record<TrendingSource, SourceConfig> = {
  hackernews: { name: 'hackernews', enabled: true, rateLimit: { maxRequests: 5, windowMs: 60000 }, timeout: 15000, priority: 1 },
  rss:        { name: 'rss',        enabled: true, rateLimit: { maxRequests: 10, windowMs: 60000 }, timeout: 15000, priority: 1 },
  arxiv:      { name: 'arxiv',      enabled: true, rateLimit: { maxRequests: 3, windowMs: 60000 }, timeout: 15000, priority: 2 },
  github:     { name: 'github',     enabled: true, rateLimit: { maxRequests: 2, windowMs: 60000 }, timeout: 15000, priority: 2 },
  x:          { name: 'x',          enabled: true, rateLimit: { maxRequests: 5, windowMs: 60000 }, timeout: 15000, priority: 3 },
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Convert HN stories to TrendingItems, filtering for AI-related content. */
function hnStoriesToTrendingItems(stories: HNStory[]): TrendingItem[] {
  return stories
    .filter((s) => AI_KEYWORD_RE.test(s.title))
    .map((s): TrendingItem => ({
      id: `hackernews:${s.id}`,
      sourceId: String(s.id),
      title: s.title,
      url: s.url ?? `https://news.ycombinator.com/item?id=${s.id}`,
      source: 'hackernews',
      author: s.by,
      publishedAt: new Date(s.time * 1000).toISOString(),
      collectedAt: new Date().toISOString(),
      metrics: { score: s.score, comments: s.descendants },
    }))
}

/** Execute collector for a single source. Returns CollectionResult regardless of outcome. */
async function runSource(source: TrendingSource): Promise<CollectionResult> {
  const startedAt = new Date().toISOString()
  const start = Date.now()

  switch (source) {
    case 'hackernews': {
      const stories = await fetchTopStories(30)
      const items = hnStoriesToTrendingItems(stories)
      return { source, items, collectedAt: startedAt, durationMs: Date.now() - start }
    }
    case 'rss':
    case 'arxiv': {
      try {
        const { fetchAllFeeds } = await import('./rss-client')
        const result = await fetchAllFeeds()
        return { source, items: result.items, errors: result.errors, collectedAt: startedAt, durationMs: Date.now() - start }
      } catch {
        return { source, items: [], collectedAt: startedAt, durationMs: Date.now() - start, warnings: [`${source} module not available`] }
      }
    }
    case 'github': {
      try {
        const { fetchGitHubTrending } = await import('./github-client')
        const result = await fetchGitHubTrending()
        return { source, items: result.items, errors: result.errors, collectedAt: startedAt, durationMs: Date.now() - start }
      } catch {
        return { source, items: [], collectedAt: startedAt, durationMs: Date.now() - start, warnings: ['github module not available'] }
      }
    }
    case 'x':
      return collectFromX()
    default: {
      const _exhaustive: never = source
      return { source: _exhaustive, items: [], collectedAt: startedAt, durationMs: 0, warnings: [`Unknown source: ${source}`] }
    }
  }
}

/**
 * Collect trending items from all enabled sources using tiered execution.
 * 1. Merge caller overrides with defaults
 * 2. Group enabled sources by priority tier
 * 3. Execute each tier with Promise.allSettled, 2s delay between tiers
 */
export async function collectFromAllSources(
  configs?: Partial<Record<TrendingSource, Partial<SourceConfig>>>,
): Promise<CollectionResult[]> {
  const merged: Record<TrendingSource, SourceConfig> = { ...DEFAULT_CONFIGS }
  if (configs) {
    for (const [key, overrides] of Object.entries(configs)) {
      const source = key as TrendingSource
      if (source in merged && overrides) {
        merged[source] = { ...merged[source], ...overrides }
      }
    }
  }

  // Group enabled sources by priority tier
  const tiers = new Map<number, TrendingSource[]>()
  for (const [source, cfg] of Object.entries(merged)) {
    if (!cfg.enabled) continue
    const existing = tiers.get(cfg.priority) ?? []
    existing.push(source as TrendingSource)
    tiers.set(cfg.priority, existing)
  }

  const sortedTiers = Array.from(tiers.keys()).sort((a, b) => a - b)
  const allResults: CollectionResult[] = []

  for (let i = 0; i < sortedTiers.length; i++) {
    const tierSources = tiers.get(sortedTiers[i])!
    const settled = await Promise.allSettled(
      tierSources.map((source) =>
        runSource(source).catch((err): CollectionResult => ({
          source,
          items: [],
          collectedAt: new Date().toISOString(),
          durationMs: 0,
          errors: [(err as Error).message],
        })),
      ),
    )

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        allResults.push(result.value)
      } else {
        console.warn(`[sources] Tier source rejected: ${result.reason}`)
      }
    }

    if (i < sortedTiers.length - 1) {
      await delay(TIER_DELAY_MS)
    }
  }

  return allResults
}
