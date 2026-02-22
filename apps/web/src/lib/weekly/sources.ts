/**
 * Curated source registry for the Vietnamese AI weekly digest.
 *
 * Sources are grouped into 3 tiers by priority:
 *   Tier 1: High-signal aggregators (processed first)
 *   Tier 2: Company/research blogs
 *   Tier 3: KOL newsletters + niche sources
 *
 * Each source specifies scrape depth:
 *   0 = Parse page as-is (RSS feed, listing page)
 *   1 = Follow article links from index page
 *   2 = Deep crawl (follow links within articles)
 */

export interface WeeklySource {
  url: string
  name: string
  tier: 1 | 2 | 3
  type: 'rss' | 'web' | 'api'
  scrapeDepth: 0 | 1 | 2
  maxPages: number
  aiRelevanceFilter: boolean
}

export const WEEKLY_SOURCES: WeeklySource[] = [
  // ---------------------------------------------------------------------------
  // Tier 1: Critical aggregators (run first, highest signal)
  // ---------------------------------------------------------------------------
  { url: 'https://news.ycombinator.com/front', name: 'Hacker News Front', tier: 1, type: 'web', scrapeDepth: 1, maxPages: 10, aiRelevanceFilter: true },
  { url: 'https://news.ycombinator.com/show', name: 'Show HN', tier: 1, type: 'web', scrapeDepth: 1, maxPages: 10, aiRelevanceFilter: true },
  { url: 'https://tldr.tech/ai/rss', name: 'TLDR AI', tier: 1, type: 'rss', scrapeDepth: 1, maxPages: 10, aiRelevanceFilter: false },
  { url: 'https://daily.dev/', name: 'daily.dev AI', tier: 1, type: 'web', scrapeDepth: 1, maxPages: 10, aiRelevanceFilter: true },
  { url: 'https://github.com/trending', name: 'GitHub Trending', tier: 1, type: 'web', scrapeDepth: 0, maxPages: 5, aiRelevanceFilter: true },

  // ---------------------------------------------------------------------------
  // Tier 2: Company blogs + research
  // ---------------------------------------------------------------------------
  { url: 'https://www.anthropic.com/research', name: 'Anthropic Research', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://www.anthropic.com/engineering', name: 'Anthropic Engineering', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://openai.com/blog', name: 'OpenAI Blog', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://deepmind.google/discover/blog/', name: 'DeepMind Blog', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://blog.google/technology/ai/', name: 'Google AI Blog', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://ai.meta.com/blog/', name: 'Meta AI Blog', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://huggingface.co/blog', name: 'Hugging Face Blog', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://arxiv.org/list/cs.AI/recent', name: 'ArXiv cs.AI', tier: 2, type: 'web', scrapeDepth: 0, maxPages: 10, aiRelevanceFilter: false },
  { url: 'https://arxiv.org/list/cs.CL/recent', name: 'ArXiv cs.CL', tier: 2, type: 'web', scrapeDepth: 0, maxPages: 10, aiRelevanceFilter: false },
  { url: 'https://hackernoon.com/tagged/ai', name: 'HackerNoon AI', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },
  { url: 'https://github.blog/ai-and-ml/', name: 'GitHub AI Blog', tier: 2, type: 'web', scrapeDepth: 1, maxPages: 5, aiRelevanceFilter: false },

  // ---------------------------------------------------------------------------
  // Tier 3: KOL newsletters + Vietnamese sources
  // ---------------------------------------------------------------------------
  { url: 'https://www.latent.space/', name: 'Latent Space', tier: 3, type: 'web', scrapeDepth: 1, maxPages: 3, aiRelevanceFilter: false },
  { url: 'https://bensbites.beehiiv.com/', name: "Ben's Bites", tier: 3, type: 'web', scrapeDepth: 1, maxPages: 3, aiRelevanceFilter: false },
  { url: 'https://www.oneusefulthing.org/', name: 'One Useful Thing', tier: 3, type: 'web', scrapeDepth: 1, maxPages: 3, aiRelevanceFilter: false },
  { url: 'https://www.interconnects.ai/', name: 'Interconnects', tier: 3, type: 'web', scrapeDepth: 1, maxPages: 3, aiRelevanceFilter: false },
  { url: 'https://aigc-weekly.agi.li/rss.xml', name: 'AIGC Weekly', tier: 3, type: 'rss', scrapeDepth: 0, maxPages: 3, aiRelevanceFilter: false },
]

/** Get sources for a specific tier. */
export function getSourcesByTier(tier: 1 | 2 | 3): WeeklySource[] {
  return WEEKLY_SOURCES.filter((s) => s.tier === tier)
}

/** Get all tiers in order (1, 2, 3) for batch processing. */
export function getSourceBatches(): WeeklySource[][] {
  return [
    getSourcesByTier(1),
    getSourcesByTier(2),
    getSourcesByTier(3),
  ]
}
