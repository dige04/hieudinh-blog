import { getPayload } from 'payload'
import config from '@payload-config'
import { fetchTopStories, fetchComments, type HNStory } from '../hn/client'
import { summarizeArticle } from './summarizer'
import { compileScript, type ArticleSummary } from './compiler'
import { createTTSProvider } from '../tts'

/** Concurrency-limited parallel processing */
async function summarizeWithConcurrency(
  stories: HNStory[],
  concurrency: number
): Promise<ArticleSummary[]> {
  const results: ArticleSummary[] = []
  const executing: Promise<void>[] = []

  for (const story of stories) {
    const task = (async () => {
      console.log(`[Generator] Summarizing: ${story.title}`)
      const comments = story.kids ? await fetchComments(story.kids, 3) : []
      const summary = await summarizeArticle(story.title, story.url || '', comments)
      results.push({
        title: story.title,
        summary,
        hnId: String(story.id),
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      })
    })()

    executing.push(task)

    if (executing.length >= concurrency) {
      await Promise.race(executing)
      // Remove completed tasks
      const completed = executing.filter((p) => {
        let resolved = false
        p.then(() => (resolved = true)).catch(() => (resolved = true))
        return resolved
      })
      executing.length = 0
      executing.push(...completed.filter((p) => !p))
    }
  }

  await Promise.all(executing)
  return results
}

export interface GenerateEpisodeOptions {
  /** Minimum story score to include (default: 100) */
  minScore?: number
  /** Minimum comment count (default: 20) */
  minComments?: number
  /** Max articles per episode (default: 5) */
  maxArticles?: number
  /** Publish immediately or save as draft (default: true) */
  publish?: boolean
}

export interface GeneratedEpisode {
  id: string
  title: string
  slug: string
  articleCount: number
  duration: number
}

/**
 * Generate a new podcast episode from top HN stories
 * Full pipeline: Fetch → Filter → Summarize → Compile → TTS → Save
 */
export async function generateEpisode(
  options: GenerateEpisodeOptions = {}
): Promise<GeneratedEpisode> {
  const {
    minScore = 100,
    minComments = 20,
    maxArticles = 5,
    publish = true,
  } = options

  const payload = await getPayload({ config })

  // 0. Check if episode already exists for today (dedupe)
  const today = new Date().toISOString().split('T')[0]
  const todaySlug = `tech-digest-${today}`
  const existingToday = await payload.find({
    collection: 'podcast',
    where: { slug: { equals: todaySlug } },
    limit: 1,
  })

  if (existingToday.docs.length > 0) {
    throw new Error(`Episode already exists for ${today}: ${todaySlug}`)
  }

  // 1. Fetch and filter stories
  console.log('[Generator] Fetching top stories...')
  const stories = await fetchTopStories(30)
  const filtered = stories.filter(
    (s) => s.score >= minScore && s.descendants >= minComments
  )
  console.log(`[Generator] Found ${filtered.length} stories meeting criteria`)

  // 2. Dedupe against existing episodes
  const existing = await payload.find({
    collection: 'podcast',
    limit: 100,
    depth: 0,
  })

  const existingIds = new Set(
    existing.docs.flatMap((ep) =>
      (ep.sources as Array<{ hnId?: string }> | undefined)?.map((s) => s.hnId) || []
    )
  )

  const newStories = filtered
    .filter((s) => !existingIds.has(String(s.id)))
    .slice(0, maxArticles)

  if (newStories.length === 0) {
    throw new Error('No new stories to process. All top stories already covered.')
  }

  console.log(`[Generator] Processing ${newStories.length} new stories`)

  // 3. Summarize articles in parallel with concurrency limit
  console.log('[Generator] Summarizing articles...')
  const summaries = await summarizeWithConcurrency(newStories, 2) // Max 2 concurrent OpenAI calls

  // 4. Compile script
  const now = new Date()
  const script = compileScript(summaries, now)
  console.log(`[Generator] Script compiled (${script.length} chars)`)

  // 5. Generate audio
  console.log('[Generator] Generating audio...')
  const tts = createTTSProvider()
  const { buffer: audioBuffer, duration } = await tts.synthesize(script)
  console.log(`[Generator] Audio generated (${audioBuffer.length} bytes, ~${duration}s)`)

  // 6. Upload audio to Media collection
  const dateStr = now.toISOString().split('T')[0]
  const audioFile = await payload.create({
    collection: 'media',
    data: {
      alt: `Tech Digest ${dateStr}`,
    },
    file: {
      data: audioBuffer,
      mimetype: 'audio/mpeg',
      name: `tech-digest-${dateStr}.mp3`,
      size: audioBuffer.length,
    },
  })

  console.log(`[Generator] Audio uploaded: ${audioFile.id}`)

  // 7. Create podcast entry
  const slug = `tech-digest-${dateStr}`
  const title = `Tech Digest - ${now.toLocaleDateString('vi-VN')}`

  const episode = await payload.create({
    collection: 'podcast',
    data: {
      title,
      slug,
      description: summaries.map((s) => s.title).join(' | '),
      audio: audioFile.id,
      duration,
      sources: summaries.map((s) => ({
        hnId: s.hnId,
        title: s.title,
        url: s.url,
      })),
      publishedAt: now.toISOString(),
      status: publish ? 'published' : 'draft',
    },
  })

  console.log(`[Generator] Episode created: ${episode.id}`)

  return {
    id: String(episode.id),
    title,
    slug,
    articleCount: summaries.length,
    duration,
  }
}
