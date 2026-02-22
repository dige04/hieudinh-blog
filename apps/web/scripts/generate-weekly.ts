/**
 * VN AI Weekly Content Generator
 *
 * Uses AI to fetch RSS items, summarize in Vietnamese, and generate personal insights.
 * Source feed: AIGC Weekly RSS.
 *
 * Usage: ANTHROPIC_AUTH_TOKEN=sk-dummy ANTHROPIC_BASE_URL=http://127.0.0.1:8317 npx tsx scripts/generate-weekly.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const RSS_FEED_URL = 'https://aigc-weekly.agi.li/rss.xml'

interface NewsItem {
  title: string
  url: string
  source: string
  summary?: string
}

interface GeneratedContent {
  title: string
  slug: string
  excerpt: string
  content: LexicalRoot
  personalInsight: LexicalRoot
  readTime: string
}

interface LexicalRoot {
  root: {
    type: 'root'
    version: 1
    children: LexicalNode[]
    direction: 'ltr'
    format: ''
    indent: 0
  }
  [key: string]: unknown
}

interface LexicalNode {
  type: string
  version: number
  children?: LexicalNode[]
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  url?: string
  direction?: string
  indent?: number
  value?: number
  start?: number
  textFormat?: number
  [key: string]: unknown
}

// Get current week number
function getWeekNumber(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  const week = Math.ceil(diff / oneWeek)
  return `${now.getFullYear()}-w${week.toString().padStart(2, '0')}`
}

function sanitizeUrl(rawUrl: string | undefined): string {
  const fallbackUrl = 'https://aigc-weekly.agi.li'
  if (!rawUrl) return fallbackUrl

  try {
    const parsed = new URL(rawUrl.trim())
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString()
    }
    return fallbackUrl
  } catch {
    return fallbackUrl
  }
}

// Fetch items from AIGC Weekly RSS feed
async function fetchAigcRss(limit = 5): Promise<NewsItem[]> {
  const response = await fetch(RSS_FEED_URL)

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${response.status}`)
  }

  const xml = await response.text()
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  if (itemMatches.length === 0) {
    throw new Error(`RSS parse failed: zero items found from ${RSS_FEED_URL}`)
  }

  return itemMatches.slice(0, limit).map(itemXml => {
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[2] || 'Untitled'
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1]

    return {
      title: title.trim(),
      url: sanitizeUrl(link),
      source: 'AIGC Weekly RSS',
    }
  })
}

// Call AI API to generate content
async function callAI(prompt: string): Promise<string> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'http://103.90.226.240:8317'
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN || 'sk-dummy'
  const model = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'gpt-5.3-codex'

  console.log(`Calling AI at ${baseUrl} with model ${model}...`)

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': authToken,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.content[0].text
}

// Convert markdown-like text to Lexical JSON (simplified - paragraphs only)
function textToLexical(text: string): LexicalRoot {
  const lines = text.split('\n')
  const children: LexicalNode[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Remove markdown formatting for now, just create paragraphs
    const cleanText = trimmed
      .replace(/^#{1,6}\s+/, '') // Remove heading markers
      .replace(/^\*\s+/, '')     // Remove list markers
      .replace(/^-\s+/, '')      // Remove list markers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text

    if (cleanText) {
      children.push({
        type: 'paragraph',
        version: 1,
        children: [{ type: 'text', version: 1, text: cleanText }],
      })
    }
  }

  return {
    root: {
      type: 'root',
      version: 1,
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
    },
  }
}

// Generate weekly content
async function generateWeeklyContent(news: NewsItem[]): Promise<GeneratedContent> {
  const weekNumber = getWeekNumber()
  const weekNum = weekNumber.split('-w')[1]

  const newsListForPrompt = news.map((n, i) =>
    `${i + 1}. "${n.title}" - ${n.url}`
  ).join('\n')

  // Generate main content
  const contentPrompt = `Bạn là một tech blogger Việt Nam chuyên về AI và công nghệ. Viết bản tin tuần cho tuần ${weekNum}/2026.

Tin tức trong tuần:
${newsListForPrompt}

Yêu cầu:
1. Viết bằng tiếng Việt tự nhiên, dễ hiểu
2. Mỗi tin tóm tắt 2-3 câu, giải thích ý nghĩa
3. Sử dụng markdown: ## cho heading chính, ### cho sub-heading, - cho bullet points, **bold** cho từ quan trọng, [text](url) cho link
4. Bắt đầu với tổng quan ngắn về xu hướng tuần này
5. Kết thúc với phần "Điểm nhấn tuần này"

Format:
## Tổng quan
[1-2 đoạn tóm tắt xu hướng]

## Tin tức nổi bật

### [Tên tin 1]
[Tóm tắt và phân tích]
[Link nguồn](url)

### [Tên tin 2]
...

## Điểm nhấn tuần này
[Bullet points về key takeaways]`

  console.log('Generating main content...')
  const contentText = await callAI(contentPrompt)

  // Generate personal insight
  const insightPrompt = `Bạn là Hiếu, một developer Việt Nam đam mê AI. Viết "Góc nhìn của mình" về tin tức AI tuần này.

Tin tức:
${newsListForPrompt}

Yêu cầu:
- 2-3 đoạn văn ngắn
- Chia sẻ suy nghĩ cá nhân, không chỉ tóm tắt tin
- Đề cập đến cách những xu hướng này ảnh hưởng đến developer Việt Nam
- Có thể thêm dự đoán hoặc lời khuyên
- Giọng văn thân thiện, như đang nói chuyện với bạn bè

Chỉ viết nội dung, không cần heading.`

  console.log('Generating personal insight...')
  const insightText = await callAI(insightPrompt)

  // Generate excerpt
  const excerptPrompt = `Tóm tắt trong 2 câu (max 200 ký tự) nội dung chính của bản tin AI tuần này:
${contentText.slice(0, 1000)}

Chỉ trả về câu tóm tắt, không giải thích.`

  console.log('Generating excerpt...')
  const excerpt = await callAI(excerptPrompt)

  // Estimate read time (average 200 words/min in Vietnamese)
  const wordCount = (contentText + insightText).split(/\s+/).length
  const readTime = `${Math.max(5, Math.ceil(wordCount / 200))} min read`

  return {
    title: `Tuần báo Tech & AI - Tuần ${weekNum}/2026`,
    slug: weekNumber,
    excerpt: excerpt.trim().slice(0, 300),
    content: textToLexical(contentText),
    personalInsight: textToLexical(insightText),
    readTime,
  }
}

export interface WeeklyGenerationResult {
  title: string
  slug: string
  action: 'created' | 'updated'
}

// Main function
export async function runWeeklyGeneration(): Promise<WeeklyGenerationResult> {
  console.log('🚀 VN AI Weekly Generator\n')

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  // Try new 5-phase pipeline first (consumes DailyTrending data)
  try {
    const { runWeeklyPipeline } = await import('../src/lib/weekly/pipeline')
    const result = await runWeeklyPipeline(payload)
    console.log('\n🎉 Weekly pipeline complete!')
    console.log(`  Title: ${result.title}`)
    console.log(`  Slug: ${result.slug}`)
    console.log(`  Action: ${result.action}`)
    console.log(`  Items: ${result.itemCount}`)
    for (const [phase, info] of Object.entries(result.phases)) {
      const status = info.skipped ? 'skipped' : `${info.duration}ms`
      console.log(`  Phase ${phase}: ${status}`)
    }
    return { title: result.title, slug: result.slug, action: result.action }
  } catch (error) {
    if (error instanceof Error && error.message === 'FALLBACK_TO_RSS') {
      console.log('\n📰 Falling back to RSS pipeline...')
    } else {
      console.warn('\n⚠️ Pipeline failed, falling back to RSS:', error)
    }
  }

  // Existing RSS path (unchanged)
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'http://103.90.226.240:8317'
  console.log(`Using AI proxy at: ${baseUrl}`)

  // Fetch news
  console.log(`\n📰 Fetching AI/tech news from RSS: ${RSS_FEED_URL}`)
  const news = await fetchAigcRss(8)

  console.log(`Found ${news.length} relevant stories:`)
  news.forEach((n, i) => console.log(`  ${i + 1}. ${n.title}`))

  // Generate content
  console.log('\n✍️ Generating Vietnamese content with AI...')
  const content = await generateWeeklyContent(news)

  console.log('\n✅ Content generated successfully!')
  console.log(`Title: ${content.title}`)
  console.log(`Slug: ${content.slug}`)
  console.log(`Excerpt: ${content.excerpt}`)
  console.log(`Read time: ${content.readTime}`)

  // Save to Payload CMS
  console.log('\n💾 Saving to Payload CMS...')

  // Check if exists
  const existing = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: content.slug } },
    limit: 1,
  })

  let action: 'created' | 'updated'

  if (existing.docs.length > 0) {
    // Update existing
    await payload.update({
      collection: 'weekly',
      id: existing.docs[0].id,
      data: {
        title: content.title,
        excerpt: content.excerpt,
        content: content.content,
        personalInsight: content.personalInsight,
        readTime: content.readTime,
        status: 'draft',
      },
    })
    action = 'updated'
    console.log(`Updated existing post: ${content.slug}`)
  } else {
    // Create new
    await payload.create({
      collection: 'weekly',
      data: {
        title: content.title,
        slug: content.slug,
        excerpt: content.excerpt,
        content: content.content,
        personalInsight: content.personalInsight,
        tag: 'ai-weekly',
        tagColor: 'blue',
        publishedAt: new Date().toISOString().split('T')[0],
        readTime: content.readTime,
        status: 'draft',
      },
    })
    action = 'created'
    console.log(`Created new post: ${content.slug}`)
  }

  console.log('\n🎉 Done! Check your Payload admin panel to review and publish.')

  return {
    title: content.title,
    slug: content.slug,
    action,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWeeklyGeneration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error)
      process.exit(1)
    })
}
