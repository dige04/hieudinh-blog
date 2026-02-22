import type { TrendingItem, CollectionResult } from './types'

const GITHUB_TRENDING_URL = 'https://github.com/trending'
const FETCH_TIMEOUT_MS = 15000

const AI_KEYWORDS = /\b(ai|ml|llm|gpt|transformer|neural|deep-learning|machine-learning|nlp|diffusion|embedding|agents?|rag|fine-?tune|inference|model)\b/i

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
}

function extractNumber(text: string): number {
  const cleaned = text.replace(/,/g, '').trim()
  const match = cleaned.match(/([\d.]+)/)?.[1]
  if (!match) return 0
  // Handle "1.2k" style numbers (unlikely on GitHub but safe)
  return Number(match)
}

function parseRepoCards(html: string): TrendingItem[] {
  const now = new Date().toISOString()
  const articles = html.match(/<article class="Box-row[^"]*">[\s\S]*?<\/article>/g) ?? []

  return articles.map((article) => {
    // Repo link: <h2 ...><a href="/owner/name">
    const repoPath = article.match(/<h2[^>]*>[\s\S]*?<a[^>]*href="\/([^"]+)"/)?.[1] ?? ''
    const [owner = '', name = ''] = repoPath.split('/')

    // Description: <p class="...">
    const description =
      article
        .match(/<p[^>]*>([^<]*)<\/p>/)?.[1]
        ?.replace(/\s+/g, ' ')
        .trim() ?? ''

    // Programming language
    const language =
      article.match(/itemprop="programmingLanguage"[^>]*>(.*?)<\//)?.[1]?.trim() ?? ''

    // Stars count (total) - look for /stargazers link text
    const starsText = article.match(/href="\/[^"]*\/stargazers"[^>]*>[\s\S]*?([\d,]+)/)?.[1] ?? '0'
    const stars = extractNumber(starsText)

    // Forks count
    const forksText = article.match(/href="\/[^"]*\/network\/members[^"]*"[^>]*>[\s\S]*?([\d,]+)/)?.[1] ?? '0'
    const forks = extractNumber(forksText)

    // Today's stars
    const todayStarsText = article.match(/([\d,]+)\s+stars?\s+today/i)?.[1] ?? '0'
    const todayStars = extractNumber(todayStarsText)

    return {
      id: `github:${owner}/${name}`,
      source: 'github' as const,
      sourceId: `${owner}/${name}`,
      url: `https://github.com/${owner}/${name}`,
      title: `${owner}/${name}${description ? `: ${description}` : ''}`,
      content: description,
      author: owner,
      publishedAt: now,
      collectedAt: now,
      metrics: {
        score: stars,
        forks,
        todayStars,
      },
      tags: language ? [language] : [],
    } satisfies TrendingItem
  })
}

/**
 * Fetch GitHub trending repositories filtered to AI/ML topics
 */
export async function fetchGitHubTrending(options?: {
  language?: string
  since?: 'daily' | 'weekly'
  limit?: number
}): Promise<CollectionResult> {
  const { language, since = 'daily', limit = 25 } = options ?? {}

  const params = new URLSearchParams({ since })
  if (language) params.set('language', language)

  const url = `${GITHUB_TRENDING_URL}?${params.toString()}`

  try {
    const response = await fetchWithTimeout(url)
    if (!response.ok) {
      return {
        source: 'github',
        items: [],
        errors: [`GitHub trending fetch failed: ${response.status}`],
        collectedAt: new Date().toISOString(),
      }
    }

    const html = await response.text()
    const allRepos = parseRepoCards(html)

    // Filter to AI/ML-related repos by name or description
    const filtered = allRepos
      .filter((repo) => AI_KEYWORDS.test(repo.sourceId) || AI_KEYWORDS.test(repo.content ?? ''))
      .slice(0, limit)

    return {
      source: 'github',
      items: filtered,
      collectedAt: new Date().toISOString(),
    }
  } catch (err) {
    return {
      source: 'github',
      items: [],
      errors: [err instanceof Error ? err.message : String(err)],
      collectedAt: new Date().toISOString(),
    }
  }
}
