/**
 * 5-Phase Weekly Digest Pipeline
 *
 * Consumes 7 days of DailyTrending data + scraped web content and
 * produces a Vietnamese AI weekly digest in Payload CMS.
 *
 *   Phase 1: AGGREGATE   -- query daily items + scrape web sources
 *   Phase 2: RE-RANK     -- LLM scoring with matrix (batched)
 *   Phase 3: WRITE       -- Vietnamese content generation (style-guided)
 *   Phase 4: REVIEW      -- LLM review loop (max 3 iterations, structured)
 *   Phase 5: PUBLISH     -- illustration + Lexical conversion + Payload CMS upsert
 *
 * Each phase is idempotent: an artifact file signals completion,
 * so interrupted runs resume from the last completed phase.
 */

import type { Payload } from 'payload'
import type { TrendingItem } from '../trending/types'
import type { ScrapedArticle } from './scraper'
import { callLLM, callLLMJSON } from '../trending/llm'
import { deduplicateItems } from '../trending/dedup'
import {
  checkArtifact,
  saveArtifact,
  loadArtifact,
  loadArtifactText,
  markPhaseComplete,
} from './artifacts'
import { getIssueNumber, textToLexical, textToLexicalWithImages, getWeekNumber } from './shared'
import {
  getScoringPrompt,
  getWritingPrompt,
  getReviewPrompt,
  getRevisionPrompt,
  getExcerptPrompt,
} from './prompts'
import { scrapeAllSources } from './scraper'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_ITEMS = 5
const MAX_REVIEW_ITERATIONS = 3
const MAX_AGGREGATE_ITEMS = 300
const TOP_ITEMS_COUNT = 25
const SCORE_THRESHOLD = 70
const SCORING_BATCH_SIZE = 25

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeeklyPipelineResult {
  weekId: string
  title: string
  slug: string
  action: 'created' | 'updated'
  itemCount: number
  phases: Record<string, { duration: number; skipped: boolean }>
}

interface ScoredItemFromLLM {
  id: string
  title: string
  url: string
  score: number
  relevance: number
  impact: number
  utility: number
  category: string
  reason: string
}

// ---------------------------------------------------------------------------
// Pipeline Orchestrator
// ---------------------------------------------------------------------------

export async function runWeeklyPipeline(
  payload: Payload
): Promise<WeeklyPipelineResult> {
  const weekId = getIssueNumber() // e.g., "Y26W07"
  const slug = getWeekNumber() // e.g., "2026-w07" for backward compat
  const phases: Record<string, { duration: number; skipped: boolean }> = {}

  console.log(`\n=== Weekly Pipeline: ${weekId} ===\n`)

  // =========================================================================
  // Phase 1: AGGREGATE (DailyTrending + web scraping)
  // =========================================================================
  console.log('[Phase 1/5] Aggregating daily trending data + web scraping...')
  let aggregatedItems: TrendingItem[]

  if (checkArtifact(weekId, 'daily-aggregate')) {
    aggregatedItems = loadArtifact<TrendingItem[]>(weekId, 'daily-aggregate') ?? []
    phases.aggregate = { duration: 0, skipped: true }
    console.log(`  Skipped (artifact exists): ${aggregatedItems.length} items`)
  } else {
    const start = Date.now()

    // Run both data sources in parallel
    const [dailyItems, scrapedArticles] = await Promise.all([
      queryDailyTrending(payload),
      scrapeAllSources().catch((err) => {
        console.warn('  Web scraping failed, continuing with daily data only:', (err as Error).message)
        return [] as ScrapedArticle[]
      }),
    ])

    // Convert scraped articles to TrendingItem format
    const scrapedItems = scrapedArticles.map(convertScrapedToTrending)
    console.log(`  Daily: ${dailyItems.length} items, Scraped: ${scrapedItems.length} items`)

    // Merge both sets, dedup, and cap
    const merged = [...dailyItems, ...scrapedItems]
    aggregatedItems = deduplicateItems(merged).slice(0, MAX_AGGREGATE_ITEMS)
    saveArtifact(weekId, 'daily-aggregate', aggregatedItems)
    phases.aggregate = { duration: Date.now() - start, skipped: false }
    console.log(`  Aggregated ${merged.length} -> ${aggregatedItems.length} unique items`)
  }

  if (aggregatedItems.length < MIN_ITEMS) {
    console.log(
      `  Insufficient items (${aggregatedItems.length} < ${MIN_ITEMS}), falling back to RSS`
    )
    throw new Error('FALLBACK_TO_RSS')
  }

  // =========================================================================
  // Phase 2: RE-RANK (LLM, batched scoring)
  // =========================================================================
  console.log('[Phase 2/5] Re-ranking with LLM scoring matrix...')
  let scoredItems: ScoredItemFromLLM[]

  if (checkArtifact(weekId, 'scored-items')) {
    scoredItems = loadArtifact<ScoredItemFromLLM[]>(weekId, 'scored-items') ?? []
    phases.rerank = { duration: 0, skipped: true }
    console.log(`  Skipped (artifact exists): ${scoredItems.length} scored items`)
  } else {
    const start = Date.now()

    // Fetch previous weekly URLs for dedup
    const previousUrls = await getPreviousWeeklyUrls(payload, 4)
    console.log(`  Found ${previousUrls.length} URLs from previous 4 weekly issues`)

    // Build scorable items
    const scorableItems = aggregatedItems.map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      content: item.content,
      summary: item.summary,
    }))

    // Batch scoring if > SCORING_BATCH_SIZE items
    const allScored: ScoredItemFromLLM[] = []

    if (scorableItems.length > SCORING_BATCH_SIZE) {
      console.log(`  Batch scoring: ${scorableItems.length} items in batches of ${SCORING_BATCH_SIZE}`)
      for (let i = 0; i < scorableItems.length; i += SCORING_BATCH_SIZE) {
        const batch = scorableItems.slice(i, i + SCORING_BATCH_SIZE)
        console.log(`  Scoring batch ${Math.floor(i / SCORING_BATCH_SIZE) + 1}/${Math.ceil(scorableItems.length / SCORING_BATCH_SIZE)}...`)
        const prompt = getScoringPrompt(batch, previousUrls)
        const batchScored = await callLLMJSON<ScoredItemFromLLM[]>(prompt, { maxTokens: 4096 })
        allScored.push(...batchScored)
        if (i + SCORING_BATCH_SIZE < scorableItems.length) {
          await sleep(2000)
        }
      }
    } else {
      const prompt = getScoringPrompt(scorableItems, previousUrls)
      const rawScored = await callLLMJSON<ScoredItemFromLLM[]>(prompt, { maxTokens: 4096 })
      allScored.push(...rawScored)
    }

    // Filter by threshold and select top items
    scoredItems = allScored
      .filter((item) => typeof item.score === 'number' && item.score >= SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_ITEMS_COUNT)

    if (scoredItems.length === 0) {
      console.log('  No items scored >= 70. Falling back to RSS.')
      throw new Error('FALLBACK_TO_RSS')
    }

    saveArtifact(weekId, 'scored-items', scoredItems)
    phases.rerank = { duration: Date.now() - start, skipped: false }
    console.log(
      `  Scored ${allScored.length} items -> ${scoredItems.length} passed threshold (>= ${SCORE_THRESHOLD})`
    )
  }

  // =========================================================================
  // Phase 3: WRITE (LLM, style-guided)
  // =========================================================================
  console.log('[Phase 3/5] Generating Vietnamese digest...')
  let draft: string

  if (checkArtifact(weekId, 'weekly-draft.md')) {
    draft = loadArtifactText(weekId, 'weekly-draft.md') ?? ''
    phases.write = { duration: 0, skipped: true }
    console.log(`  Skipped (artifact exists): ${draft.length} chars`)
  } else {
    const start = Date.now()

    const writableItems = buildWritableItems(scoredItems, aggregatedItems)
    const writePrompt = getWritingPrompt(writableItems, weekId)
    draft = await callLLM(writePrompt, { maxTokens: 8192 })

    saveArtifact(weekId, 'weekly-draft.md', draft)
    phases.write = { duration: Date.now() - start, skipped: false }
    console.log(`  Generated draft: ${draft.length} chars`)
  }

  // =========================================================================
  // Phase 4: REVIEW (LLM, max 3 iterations, structured critique)
  // =========================================================================
  console.log('[Phase 4/5] Reviewing draft...')

  if (checkArtifact(weekId, 'review-pass')) {
    phases.review = { duration: 0, skipped: true }
    console.log('  Skipped (artifact exists): review already passed')
  } else {
    const start = Date.now()

    // Calculate date range for review prompt
    const endDate = new Date().toISOString().split('T')[0]
    const startDateObj = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const startDate = startDateObj.toISOString().split('T')[0]

    let currentDraft = draft
    let passed = false

    for (let iteration = 1; iteration <= MAX_REVIEW_ITERATIONS; iteration++) {
      console.log(`  Review iteration ${iteration}/${MAX_REVIEW_ITERATIONS}...`)
      const reviewPrompt = getReviewPrompt(currentDraft, startDate, endDate)
      const reviewResult = await callLLM(reviewPrompt, { maxTokens: 2048 })

      if (reviewResult.trim().toUpperCase() === 'PASS') {
        console.log(`  PASS on iteration ${iteration}`)
        passed = true
        break
      }

      console.log(`  Critique received on iteration ${iteration}:`)
      console.log(`  ${reviewResult.slice(0, 200)}...`)

      // If not the last iteration, revise the draft
      if (iteration < MAX_REVIEW_ITERATIONS) {
        const writableItems = buildWritableItems(scoredItems, aggregatedItems)
        const revisionPrompt = getRevisionPrompt(writableItems, weekId, currentDraft, reviewResult)
        currentDraft = await callLLM(revisionPrompt, { maxTokens: 8192 })

        // Save revised draft
        saveArtifact(weekId, 'weekly-draft.md', currentDraft)
        draft = currentDraft
        console.log(`  Revised draft: ${currentDraft.length} chars`)
      }
    }

    if (!passed) {
      console.log(
        `  Review did not pass after ${MAX_REVIEW_ITERATIONS} iterations. Accepting draft with warning.`
      )
    }

    markPhaseComplete(weekId, 'review-pass')
    phases.review = { duration: Date.now() - start, skipped: false }
  }

  // =========================================================================
  // Phase 5: PUBLISH
  // =========================================================================
  console.log('[Phase 5/5] Publishing to Payload CMS...')

  if (checkArtifact(weekId, 'published')) {
    phases.publish = { duration: 0, skipped: true }
    console.log('  Skipped (artifact exists): already published')

    // Still need to return result -- load from artifact
    const publishedData = loadArtifact<{ title: string; action: 'created' | 'updated' }>(
      weekId,
      'published'
    )
    return {
      weekId,
      title: publishedData?.title ?? `AI Weekly ${weekId}`,
      slug,
      action: publishedData?.action ?? 'updated',
      itemCount: scoredItems.length,
      phases,
    }
  }

  const start = Date.now()

  // Parse draft to extract sections
  const { title, mainContent, personalInsight } = parseDraftSections(draft, weekId)

  // Generate excerpt
  const excerptPrompt = getExcerptPrompt(draft)
  const excerpt = (await callLLM(excerptPrompt, { maxTokens: 256 })).trim().slice(0, 300)

  // Convert to Lexical JSON
  const insightLexical = textToLexical(personalInsight)

  // Estimate read time
  const wordCount = (mainContent + personalInsight).split(/\s+/).length
  const readTime = `${Math.max(5, Math.ceil(wordCount / 200))} min read`

  // Generate section illustrations
  let thumbnailId: string | null = null
  let sectionImages = new Map<number, string>()

  const cachedThumb = loadArtifact<{ mediaId: string }>(weekId, 'thumbnail-media')
  const cachedSections = loadArtifact<{ images: Record<string, string> }>(weekId, 'section-images')

  if (cachedSections?.images) {
    sectionImages = new Map(Object.entries(cachedSections.images).map(([k, v]) => [Number(k), v]))
    thumbnailId = sectionImages.get(0) ?? cachedThumb?.mediaId ?? null
    console.log(`  Using cached section images: ${sectionImages.size}`)
  } else if (cachedThumb?.mediaId) {
    thumbnailId = cachedThumb.mediaId
    console.log(`  Using cached thumbnail: ${thumbnailId}`)
  } else {
    const headingMatches = draft.match(/^##\s+.+$/gm) ?? []
    const sectionHeadings = headingMatches.map((h) => h.replace(/^##\s+/, '').trim())

    if (sectionHeadings.length > 0) {
      const { generateSectionIllustrations } = await import('./illustrator')
      sectionImages = await generateSectionIllustrations(
        payload, weekId, title, sectionHeadings
      )
      thumbnailId = sectionImages.get(0) ?? null

      if (sectionImages.size > 0) {
        const imagesObj: Record<string, string> = {}
        for (const [k, v] of sectionImages) imagesObj[String(k)] = v
        saveArtifact(weekId, 'section-images', { images: imagesObj })
      }
      if (thumbnailId) {
        saveArtifact(weekId, 'thumbnail-media', { mediaId: thumbnailId })
      }
    }
  }

  // Convert main content to Lexical, with section images if available
  const contentLexical = sectionImages.size > 0
    ? textToLexicalWithImages(mainContent, sectionImages)
    : textToLexical(mainContent)

  // Upsert to Payload CMS
  const existing = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  let action: 'created' | 'updated'

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'weekly',
      id: existing.docs[0].id,
      data: {
        title,
        excerpt,
        content: contentLexical,
        personalInsight: insightLexical,
        readTime,
        status: 'draft',
        ...(thumbnailId ? { thumbnail: thumbnailId } : {}),
      },
    })
    action = 'updated'
    console.log(`  Updated existing post: ${slug}`)
  } else {
    await payload.create({
      collection: 'weekly',
      data: {
        title,
        slug,
        excerpt,
        content: contentLexical,
        personalInsight: insightLexical,
        tag: 'ai-weekly',
        tagColor: 'blue',
        publishedAt: new Date().toISOString().split('T')[0],
        readTime,
        status: 'draft',
        ...(thumbnailId ? { thumbnail: thumbnailId } : {}),
      },
    })
    action = 'created'
    console.log(`  Created new post: ${slug}`)
  }

  // Mark consumed DailyTrending docs as merged
  await markDailyTrendingAsMerged(payload)

  // Save publish artifact
  saveArtifact(weekId, 'published', {
    title,
    slug,
    action,
    itemCount: scoredItems.length,
    publishedAt: new Date().toISOString(),
  })

  phases.publish = { duration: Date.now() - start, skipped: false }
  console.log(`  Published: ${action} "${title}"`)

  return { weekId, title, slug, action, itemCount: scoredItems.length, phases }
}

// ---------------------------------------------------------------------------
// Helper: Query DailyTrending from Payload CMS
// ---------------------------------------------------------------------------

async function queryDailyTrending(payload: Payload): Promise<TrendingItem[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const dailyDocs = await payload.find({
    collection: 'daily-trending' as any,
    where: {
      date: { greater_than_equal: sevenDaysAgo.toISOString() },
      status: { not_equals: 'merged' },
    },
    limit: 100,
  })

  const allItems: TrendingItem[] = []
  for (const doc of dailyDocs.docs) {
    const items = ((doc as any).items || []) as TrendingItem[]
    allItems.push(...items)
  }

  console.log(`  Daily trending: ${allItems.length} items from ${dailyDocs.docs.length} batches`)
  return allItems
}

// ---------------------------------------------------------------------------
// Helper: Convert ScrapedArticle to TrendingItem
// ---------------------------------------------------------------------------

function convertScrapedToTrending(article: ScrapedArticle): TrendingItem {
  return {
    id: `scraped:${hashUrl(article.url)}`,
    title: article.title,
    url: article.url,
    source: 'rss' as const,
    sourceId: article.url,
    publishedAt: article.publishedAt || article.scrapedAt,
    collectedAt: article.scrapedAt,
    content: article.content,
    metrics: {},
    summary: article.content.slice(0, 300),
  }
}

function hashUrl(url: string): string {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit int
  }
  return Math.abs(hash).toString(36)
}

// ---------------------------------------------------------------------------
// Helper: Build writable items with content snippets
// ---------------------------------------------------------------------------

function buildWritableItems(
  scoredItems: ScoredItemFromLLM[],
  aggregatedItems: TrendingItem[]
) {
  const contentMap = new Map(aggregatedItems.map((item) => [item.url, item.content]))

  return scoredItems.map((item) => ({
    title: item.title,
    url: item.url,
    score: item.score,
    category: item.category,
    summary: item.reason,
    reason: item.reason,
    content: contentMap.get(item.url),
  }))
}

// ---------------------------------------------------------------------------
// Helper: Extract URLs from previous weekly issues for dedup
// ---------------------------------------------------------------------------

async function getPreviousWeeklyUrls(
  payload: Payload,
  count: number
): Promise<string[]> {
  try {
    const previousWeeklies = await payload.find({
      collection: 'weekly',
      sort: '-publishedAt',
      limit: count,
    })

    const urls: string[] = []
    for (const doc of previousWeeklies.docs) {
      // Extract URLs from Lexical content JSON
      const contentStr =
        typeof doc.content === 'string'
          ? doc.content
          : JSON.stringify(doc.content ?? {})

      // Simple URL extraction from stringified content
      const urlMatches = contentStr.match(/https?:\/\/[^\s"')<>]+/g) ?? []
      urls.push(...urlMatches)
    }

    // Deduplicate
    return [...new Set(urls)]
  } catch (error) {
    console.warn('  Warning: Could not fetch previous weekly URLs:', error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Helper: Parse draft markdown into sections
// ---------------------------------------------------------------------------

interface ParsedDraft {
  title: string
  mainContent: string
  personalInsight: string
}

function parseDraftSections(draft: string, weekId: string): ParsedDraft {
  const weekNum = weekId.replace(/^Y\d+W/, '')

  // Try to extract title from first heading
  const titleMatch = draft.match(/^#\s+(.+)$/m)
  const title = titleMatch
    ? titleMatch[1].trim()
    : `Tuan bao Tech & AI - Tuan ${weekNum}/2026`

  // Split out "Goc nhin cua minh" section
  const insightPattern = /## Goc nhin cua minh\s*\n([\s\S]*?)(?=\n## |\n# |$)/i
  const insightMatch = draft.match(insightPattern)
  const personalInsight = insightMatch
    ? insightMatch[1].trim()
    : ''

  // Main content is everything except the personal insight section
  let mainContent = draft
  if (insightMatch) {
    mainContent = draft.replace(insightPattern, '').trim()
  }

  // Remove top-level title from main content (already stored in title field)
  if (titleMatch) {
    mainContent = mainContent.replace(/^#\s+.+\n*/, '').trim()
  }

  return { title, mainContent, personalInsight }
}

// ---------------------------------------------------------------------------
// Helper: Mark DailyTrending docs as merged
// ---------------------------------------------------------------------------

async function markDailyTrendingAsMerged(payload: Payload): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const dailyDocs = await payload.find({
      collection: 'daily-trending' as any,
      where: {
        date: { greater_than_equal: sevenDaysAgo.toISOString() },
        status: { not_equals: 'merged' },
      },
      limit: 100,
    })

    for (const doc of dailyDocs.docs) {
      await payload.update({
        collection: 'daily-trending' as any,
        id: doc.id,
        data: { status: 'merged' } as any,
      })
    }

    console.log(`  Marked ${dailyDocs.docs.length} DailyTrending docs as merged`)
  } catch (error) {
    console.warn('  Warning: Could not mark DailyTrending docs as merged:', error)
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
