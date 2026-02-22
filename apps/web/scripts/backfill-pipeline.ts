/**
 * Backfill: Run the new pipeline for past 6 AIGC Weekly issues.
 *
 * For each issue (Y26W01-Y26W06):
 *   1. Fetch AIGC Weekly content (Chinese)
 *   2. Split into individual items
 *   3. Run scoring → writing → review pipeline
 *   4. Save to CMS with slug `2026-wXX-v2` for comparison
 *
 * Usage: npx tsx scripts/backfill-pipeline.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { callLLM, callLLMJSON } from '../src/lib/trending/llm'
import { textToLexical } from '../src/lib/weekly/shared'
import {
  getScoringPrompt,
  getWritingPrompt,
  getReviewPrompt,
  getRevisionPrompt,
  getExcerptPrompt,
} from '../src/lib/weekly/prompts'
import {
  checkArtifact,
  saveArtifact,
  loadArtifact,
  loadArtifactText,
  markPhaseComplete,
} from '../src/lib/weekly/artifacts'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AIGC_BASE = 'https://aigc-weekly.agi.li'
const ISSUES = ['Y26W01', 'Y26W02', 'Y26W03', 'Y26W04', 'Y26W05', 'Y26W06']
const SCORE_THRESHOLD = 70
const MAX_REVIEW_ITERATIONS = 3

// Map AIGC issue ID to a pipeline slug
function issueToSlug(aigcId: string): string {
  const weekNum = aigcId.replace(/^Y\d+W/, '')
  return `2026-w${weekNum.padStart(2, '0')}-v2`
}

function issueToWeekNum(aigcId: string): string {
  const weekNum = aigcId.replace(/^Y\d+W/, '')
  return weekNum
}

// Artifact prefix to separate from live pipeline
function backfillId(aigcId: string): string {
  return `backfill-${aigcId}`
}

// ---------------------------------------------------------------------------
// AIGC content fetching
// ---------------------------------------------------------------------------

function extractContent(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')

  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  text = text.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**')
  text = text.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*')
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<[^>]+>/g, '')
  text = text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

async function fetchAigcContent(aigcId: string): Promise<string> {
  const url = `${AIGC_BASE}/weekly/${aigcId}`
  console.log(`  Fetching: ${url}`)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return extractContent(await res.text())
}

// ---------------------------------------------------------------------------
// Split AIGC content into individual items for scoring
// ---------------------------------------------------------------------------

interface AigcItem {
  id: string
  title: string
  url: string
  content: string
  summary: string
}

function splitAigcIntoItems(content: string, aigcId: string): AigcItem[] {
  const items: AigcItem[] = []

  // Match each ### heading and its content until the next ### or ## or end
  const sectionRegex = /###\s+(.+?)(?:\n)([\s\S]*?)(?=\n###?\s|\n$|$)/g
  let match: RegExpExecArray | null

  let idx = 0
  while ((match = sectionRegex.exec(content)) !== null) {
    const heading = match[1].trim()
    const body = match[2].trim()
    if (!heading || body.length < 20) continue

    // Extract URL from body — look for [阅读原文](url) or any [text](url) pattern
    const urlMatch = body.match(/\[(?:[^\]]+)\]\((https?:\/\/[^)]+)\)/)
    const url = urlMatch ? urlMatch[1] : ''

    // Also try link in heading itself
    const headingLinkMatch = heading.match(/\[([^\]]+)\]\(([^)]+)\)/)
    const title = headingLinkMatch ? headingLinkMatch[1] : heading.slice(0, 100)
    const headingUrl = headingLinkMatch ? headingLinkMatch[2] : ''

    const finalUrl = url || headingUrl
    if (!finalUrl) continue

    idx++
    items.push({
      id: `aigc-${aigcId}-${idx}`,
      title,
      url: finalUrl,
      content: (heading + '\n' + body).slice(0, 800),
      summary: body.slice(0, 300),
    })
  }

  return items
}

// ---------------------------------------------------------------------------
// Run pipeline for a single AIGC issue
// ---------------------------------------------------------------------------

async function runBackfillForIssue(
  payload: any,
  aigcId: string,
  aigcContent: string,
): Promise<{ slug: string; action: string; itemCount: number }> {
  const bfId = backfillId(aigcId)
  const slug = issueToSlug(aigcId)
  const weekNum = issueToWeekNum(aigcId)

  console.log(`\n=== Backfill Pipeline: ${aigcId} → ${slug} ===\n`)

  // Phase 1: Split AIGC content into items
  console.log('[Phase 1] Splitting AIGC content into items...')
  let items: AigcItem[]

  if (checkArtifact(bfId, 'daily-aggregate')) {
    items = loadArtifact<AigcItem[]>(bfId, 'daily-aggregate') ?? []
    console.log(`  Skipped (cached): ${items.length} items`)
  } else {
    items = splitAigcIntoItems(aigcContent, aigcId)
    saveArtifact(bfId, 'daily-aggregate', items)
    console.log(`  Extracted ${items.length} items from AIGC content`)
  }

  if (items.length < 3) {
    console.log(`  Too few items (${items.length}), skipping ${aigcId}`)
    return { slug, action: 'skipped', itemCount: items.length }
  }

  // Phase 2: Score items
  console.log('[Phase 2] Scoring items...')
  let scoredItems: any[]

  if (checkArtifact(bfId, 'scored-items')) {
    scoredItems = loadArtifact<any[]>(bfId, 'scored-items') ?? []
    console.log(`  Skipped (cached): ${scoredItems.length} scored items`)
  } else {
    const prompt = getScoringPrompt(items, [])
    scoredItems = await callLLMJSON<any[]>(prompt, { maxTokens: 4096 })
    scoredItems = scoredItems
      .filter((i: any) => typeof i.score === 'number' && i.score >= SCORE_THRESHOLD)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 20)

    saveArtifact(bfId, 'scored-items', scoredItems)
    console.log(`  Scored → ${scoredItems.length} passed threshold`)
  }

  if (scoredItems.length === 0) {
    // If scoring filtered everything, use all items directly
    console.log('  No items passed scoring, using all items for writing')
    scoredItems = items.map((i, idx) => ({
      ...i,
      score: 75,
      category: 'tin-tuc',
      reason: i.summary,
    }))
  }

  // Phase 3: Write Vietnamese digest
  console.log('[Phase 3] Writing Vietnamese digest...')
  let draft: string

  if (checkArtifact(bfId, 'weekly-draft.md')) {
    draft = loadArtifactText(bfId, 'weekly-draft.md') ?? ''
    console.log(`  Skipped (cached): ${draft.length} chars`)
  } else {
    const contentMap = new Map(items.map(i => [i.url, i.content]))
    const writableItems = scoredItems.map((item: any) => ({
      title: item.title,
      url: item.url,
      score: item.score,
      category: item.category || 'tin-tuc',
      summary: item.reason || item.summary,
      reason: item.reason,
      content: contentMap.get(item.url),
    }))

    const writePrompt = getWritingPrompt(writableItems, aigcId)
    draft = await callLLM(writePrompt, { maxTokens: 8192 })
    saveArtifact(bfId, 'weekly-draft.md', draft)
    console.log(`  Generated draft: ${draft.length} chars`)
  }

  // Phase 4: Review loop
  console.log('[Phase 4] Reviewing draft...')

  if (!checkArtifact(bfId, 'review-pass')) {
    const endDate = new Date().toISOString().split('T')[0]
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    let currentDraft = draft

    for (let iter = 1; iter <= MAX_REVIEW_ITERATIONS; iter++) {
      console.log(`  Review iteration ${iter}/${MAX_REVIEW_ITERATIONS}...`)
      const reviewResult = await callLLM(getReviewPrompt(currentDraft, startDate, endDate), { maxTokens: 2048 })

      if (reviewResult.trim().toUpperCase() === 'PASS') {
        console.log(`  PASS on iteration ${iter}`)
        break
      }

      console.log(`  Critique received, revising...`)

      if (iter < MAX_REVIEW_ITERATIONS) {
        const contentMap = new Map(items.map(i => [i.url, i.content]))
        const writableItems = scoredItems.map((item: any) => ({
          title: item.title,
          url: item.url,
          score: item.score,
          category: item.category || 'tin-tuc',
          summary: item.reason || item.summary,
          reason: item.reason,
          content: contentMap.get(item.url),
        }))

        currentDraft = await callLLM(
          getRevisionPrompt(writableItems, aigcId, currentDraft, reviewResult),
          { maxTokens: 8192 },
        )
        saveArtifact(bfId, 'weekly-draft.md', currentDraft)
        draft = currentDraft
        console.log(`  Revised: ${currentDraft.length} chars`)
      }
    }

    markPhaseComplete(bfId, 'review-pass')
  } else {
    console.log('  Skipped (cached)')
  }

  // Phase 5: Publish to CMS
  console.log('[Phase 5] Publishing...')

  if (checkArtifact(bfId, 'published')) {
    console.log('  Skipped (already published)')
    return { slug, action: 'skipped', itemCount: scoredItems.length }
  }

  // Parse draft sections
  const titleMatch = draft.match(/^#\s+(.+)$/m)
  const title = titleMatch?.[1]?.trim() || `Tuan bao Tech & AI - Tuan ${weekNum}/2026 (Pipeline v2)`

  const insightPattern = /## Goc nhin cua minh\s*\n([\s\S]*?)(?=\n## |\n# |$)/i
  const insightMatch = draft.match(insightPattern)
  const personalInsight = insightMatch ? insightMatch[1].trim() : ''

  let mainContent = draft
  if (insightMatch) mainContent = draft.replace(insightPattern, '').trim()
  if (titleMatch) mainContent = mainContent.replace(/^#\s+.+\n*/, '').trim()

  // Generate excerpt
  const excerpt = (await callLLM(getExcerptPrompt(draft), { maxTokens: 256 }))
    .trim()
    .slice(0, 300)

  // Convert to Lexical
  const contentLexical = textToLexical(mainContent)
  const insightLexical = textToLexical(personalInsight)

  const wordCount = (mainContent + personalInsight).split(/\s+/).length
  const readTime = `${Math.max(5, Math.ceil(wordCount / 200))} min read`

  // Check if v2 slug already exists
  const existing = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  let action: string

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'weekly',
      id: existing.docs[0].id,
      data: { title, excerpt, content: contentLexical, personalInsight: insightLexical, readTime, status: 'draft' },
    })
    action = 'updated'
  } else {
    // Determine publishedAt from AIGC issue date
    const weekNumInt = parseInt(weekNum, 10)
    const year = 2026
    const jan1 = new Date(year, 0, 1)
    const pubDate = new Date(jan1.getTime() + (weekNumInt - 1) * 7 * 24 * 60 * 60 * 1000)
    const publishedAt = pubDate.toISOString().split('T')[0]

    await payload.create({
      collection: 'weekly',
      data: {
        title,
        slug,
        excerpt,
        content: contentLexical,
        personalInsight: insightLexical,
        tag: 'ai-weekly',
        tagColor: 'green', // green to distinguish from blue (AIGC)
        publishedAt,
        readTime,
        status: 'draft',
      },
    })
    action = 'created'
  }

  saveArtifact(bfId, 'published', { title, slug, action })
  console.log(`  ${action}: ${slug} — "${title}"`)

  return { slug, action, itemCount: scoredItems.length }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Weekly Pipeline Backfill ===')
  console.log(`Issues: ${ISSUES.join(', ')}\n`)

  const { getPayload } = await import('payload')
  const { default: config } = await import('../src/payload.config')
  const payload = await getPayload({ config })

  // Fetch all AIGC content first
  console.log('Fetching AIGC Weekly content...')
  const aigcContents = new Map<string, string>()
  for (const issue of ISSUES) {
    try {
      const content = await fetchAigcContent(issue)
      aigcContents.set(issue, content)
      console.log(`  ${issue}: ${content.length} chars`)
    } catch (err) {
      console.warn(`  ${issue}: FAILED — ${(err as Error).message}`)
    }
    // Small delay between fetches
    await new Promise(r => setTimeout(r, 500))
  }

  // Process each issue
  const results: Array<{ issue: string; slug: string; action: string; items: number }> = []

  for (const issue of ISSUES) {
    const content = aigcContents.get(issue)
    if (!content) {
      console.log(`\nSkipping ${issue} (no content)`)
      continue
    }

    try {
      const result = await runBackfillForIssue(payload, issue, content)
      results.push({ issue, slug: result.slug, action: result.action, items: result.itemCount })
    } catch (err) {
      console.error(`\n${issue} FAILED:`, (err as Error).message)
      results.push({ issue, slug: issueToSlug(issue), action: 'failed', items: 0 })
    }

    // Delay between issues to avoid rate limits
    await new Promise(r => setTimeout(r, 3000))
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('BACKFILL SUMMARY')
  console.log('='.repeat(60))
  for (const r of results) {
    console.log(`  ${r.issue} → ${r.slug}: ${r.action} (${r.items} items)`)
  }
  console.log(`\nComparison: Look at -v2 slugs vs original slugs in Payload admin.`)

  process.exit(0)
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
