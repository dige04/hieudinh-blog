const HN_API = 'https://hacker-news.firebaseio.com/v0'
const FETCH_TIMEOUT_MS = 10000 // 10 second timeout

export interface HNStory {
  id: number
  title: string
  url?: string
  score: number
  descendants: number // comment count
  by: string
  time: number
  type: string
  kids?: number[] // top-level comment IDs
}

export interface HNComment {
  id: number
  text?: string
  by?: string
  time: number
  kids?: number[]
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
}

/**
 * Fetch top stories from Hacker News
 * @param limit Number of stories to fetch (default 30)
 * @returns Array of story objects
 */
export async function fetchTopStories(limit = 30): Promise<HNStory[]> {
  const response = await fetchWithTimeout(`${HN_API}/topstories.json`)
  if (!response.ok) {
    throw new Error(`Failed to fetch top stories: ${response.status}`)
  }

  const ids: number[] = await response.json()
  const topIds = ids.slice(0, limit)

  // Parallel fetch with error handling
  const stories = await Promise.all(
    topIds.map(async (id) => {
      try {
        const res = await fetchWithTimeout(`${HN_API}/item/${id}.json`)
        if (!res.ok) return null
        return res.json() as Promise<HNStory>
      } catch {
        return null
      }
    })
  )

  return stories.filter((s): s is HNStory => s !== null && s.type === 'story')
}

/**
 * Fetch comments for a story
 * @param ids Comment IDs to fetch
 * @param limit Max number of comments
 * @returns Array of comment text strings
 */
export async function fetchComments(ids: number[], limit = 3): Promise<string[]> {
  const commentIds = ids.slice(0, limit)

  const comments = await Promise.all(
    commentIds.map(async (id) => {
      try {
        const res = await fetchWithTimeout(`${HN_API}/item/${id}.json`)
        if (!res.ok) return null
        return res.json() as Promise<HNComment>
      } catch {
        return null
      }
    })
  )

  return comments
    .filter((c): c is HNComment => c !== null && typeof c.text === 'string')
    .map((c) => stripHtml(c.text || ''))
}

/**
 * Strip HTML tags from comment text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}
