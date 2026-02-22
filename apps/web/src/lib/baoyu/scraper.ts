/**
 * Baoyu.io content scraper.
 *
 * Fetches RSS feed for post discovery, then scrapes full page content.
 * Images are hosted on s.baoyu.io/imgs/...
 */

const RSS_URL = 'https://s.baoyu.io/feed.xml'
const BASE_URL = 'https://baoyu.io'

export interface BaoyuPost {
  title: string
  url: string
  slug: string
  pubDate: string
  author: string
  content: string // full markdown content
  imageUrls: string[] // image URLs found in content
}

/** Fetch and parse the RSS feed, return recent post entries. */
export async function fetchRssFeed(
  limit = 10
): Promise<Array<{ title: string; url: string; pubDate: string }>> {
  const response = await fetch(RSS_URL)
  if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`)
  const xml = await response.text()

  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  return items.slice(0, limit).map((item) => {
    const title = item.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? ''
    return { title, url: link, pubDate }
  })
}

/** Scrape full content from a baoyu.io blog post page. */
export async function scrapePost(url: string): Promise<BaoyuPost> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)
  const html = await response.text()

  // Extract markdown content from the page
  // baoyu.io serves markdown with YAML frontmatter
  const content = extractMarkdown(html)

  // Extract YAML frontmatter
  const frontmatter = extractFrontmatter(html)

  // Find image URLs
  const imageUrls = extractImageUrls(content)

  // Extract slug from URL
  const slug = url
    .replace(BASE_URL, '')
    .replace(/^\/blog\//, '')
    .replace(/\//g, '-')
    .replace(/^-|-$/g, '')

  return {
    title: frontmatter.title || '',
    url,
    slug,
    pubDate: frontmatter.published_at || new Date().toISOString(),
    author: frontmatter.authors || '\u5b9d\u7389',
    content,
    imageUrls,
  }
}

function extractMarkdown(html: string): string {
  // Remove script/style/nav/header/footer
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')

  // Convert HTML to markdown-like text
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

function extractFrontmatter(html: string): Record<string, string> {
  // Try to find YAML frontmatter in the page source
  const fmMatch = html.match(/---\s*\n([\s\S]*?)\n---/)
  if (!fmMatch) return {}

  const result: Record<string, string> = {}
  const lines = fmMatch[1].split('\n')
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      result[key.trim()] = valueParts
        .join(':')
        .trim()
        .replace(/^["']|["']$/g, '')
    }
  }
  return result
}

function extractImageUrls(content: string): string[] {
  const matches = content.matchAll(/!\[.*?\]\((https?:\/\/[^)]+)\)/g)
  return [...matches].map((m) => m[1])
}

/** Download an image from a URL, returns Buffer or null. */
export async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}
