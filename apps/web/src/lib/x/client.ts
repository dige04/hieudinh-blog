/**
 * X (Twitter) API v2 client.
 * Named exports only, no external dependencies.
 * Follows ../hn/client.ts patterns: fetchWithTimeout, null-safe filtering.
 */
import type { TrendingItem, CollectionResult } from '../trending/types'
import type { XTweet, XUser, XSearchResponse, XListResponse } from './types'

const X_API = 'https://api.x.com/2'
const FETCH_TIMEOUT_MS = 15000

export interface XClientConfig {
  bearerToken: string
  searchQueries?: string[]
  listIds?: string[]
  maxResultsPerQuery?: number // default 50, max 100
}

const DEFAULT_QUERIES = [
  '(AI OR LLM OR "large language model") min_faves:100 -is:retweet lang:en',
  '(GPT OR Claude OR Gemini) min_faves:50 -is:retweet lang:en',
]

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
}

function getBearerToken(): string | null {
  return process.env.X_BEARER_TOKEN || null
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

function buildUserMap(users?: XUser[]): Map<string, XUser> {
  const map = new Map<string, XUser>()
  if (users) {
    for (const u of users) map.set(u.id, u)
  }
  return map
}

function tweetToTrendingItem(tweet: XTweet, userMap: Map<string, XUser>): TrendingItem {
  const user = userMap.get(tweet.author_id)
  const username = user?.username ?? 'unknown'
  const truncatedTitle = tweet.text.length > 100
    ? tweet.text.slice(0, 97) + '...'
    : tweet.text

  return {
    id: `x:${tweet.id}`,
    sourceId: tweet.id,
    title: truncatedTitle,
    url: `https://x.com/${username}/status/${tweet.id}`,
    source: 'x',
    content: tweet.text,
    author: `@${username}`,
    publishedAt: tweet.created_at,
    collectedAt: new Date().toISOString(),
    metrics: {
      likes: tweet.public_metrics.like_count,
      retweets: tweet.public_metrics.retweet_count,
      comments: tweet.public_metrics.reply_count,
    },
    tags: tweet.entities?.hashtags?.map((h) => h.tag) ?? [],
  }
}

function tweetFieldParams(maxResults: number): URLSearchParams {
  return new URLSearchParams({
    max_results: String(Math.min(maxResults, 100)),
    'tweet.fields': 'created_at,public_metrics,entities,author_id',
    'user.fields': 'name,username',
    expansions: 'author_id',
  })
}

/** Search recent tweets. GET /2/tweets/search/recent */
export async function searchRecent(
  query: string,
  maxResults = 50,
  bearerToken?: string,
): Promise<TrendingItem[]> {
  const token = bearerToken ?? getBearerToken()
  if (!token) return []

  const params = tweetFieldParams(maxResults)
  params.set('query', query)

  const url = `${X_API}/tweets/search/recent?${params.toString()}`
  const response = await fetchWithTimeout(url, { headers: authHeaders(token) })

  if (!response.ok) {
    console.warn(`[x/client] searchRecent failed: ${response.status} ${response.statusText}`)
    return []
  }

  const body = (await response.json()) as XSearchResponse
  if (!body.data) return []

  const userMap = buildUserMap(body.includes?.users)
  return body.data.map((tweet) => tweetToTrendingItem(tweet, userMap))
}

/** Fetch tweets from a curated X list. GET /2/lists/{listId}/tweets */
export async function fetchListTimeline(
  listId: string,
  maxResults = 50,
  bearerToken?: string,
): Promise<TrendingItem[]> {
  const token = bearerToken ?? getBearerToken()
  if (!token) return []

  const params = tweetFieldParams(maxResults)
  const url = `${X_API}/lists/${listId}/tweets?${params.toString()}`
  const response = await fetchWithTimeout(url, { headers: authHeaders(token) })

  if (!response.ok) {
    console.warn(`[x/client] fetchListTimeline failed: ${response.status} ${response.statusText}`)
    return []
  }

  const body = (await response.json()) as XListResponse
  if (!body.data) return []

  const userMap = buildUserMap(body.includes?.users)
  return body.data.map((tweet) => tweetToTrendingItem(tweet, userMap))
}

/**
 * Main entry: collect trending items from X.
 * Returns empty result with warning when bearer token is missing (never throws).
 */
export async function collectFromX(
  config?: Partial<XClientConfig>,
): Promise<CollectionResult> {
  const startedAt = new Date().toISOString()
  const token = config?.bearerToken ?? getBearerToken()

  if (!token) {
    console.warn('[x/client] X_BEARER_TOKEN not configured -- skipping X collection')
    return {
      source: 'x',
      items: [],
      collectedAt: startedAt,
      durationMs: 0,
      warnings: ['X_BEARER_TOKEN not configured'],
    }
  }

  const queries = config?.searchQueries ?? DEFAULT_QUERIES
  const maxResults = config?.maxResultsPerQuery ?? 50
  const listIds = config?.listIds ?? []
  const start = Date.now()
  const warnings: string[] = []

  const searchPromises = queries.map((q) =>
    searchRecent(q, maxResults, token).catch((err) => {
      warnings.push(`Search query failed: ${(err as Error).message}`)
      return [] as TrendingItem[]
    }),
  )
  const listPromises = listIds.map((id) =>
    fetchListTimeline(id, maxResults, token).catch((err) => {
      warnings.push(`List ${id} fetch failed: ${(err as Error).message}`)
      return [] as TrendingItem[]
    }),
  )

  const results = await Promise.allSettled([...searchPromises, ...listPromises])

  // Flatten and deduplicate by tweet ID
  const seen = new Set<string>()
  const items: TrendingItem[] = []
  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    for (const item of result.value) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        items.push(item)
      }
    }
  }

  return {
    source: 'x',
    items,
    collectedAt: startedAt,
    durationMs: Date.now() - start,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
