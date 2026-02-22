/**
 * Daily Trending Pipeline
 *
 * Runs the 5-phase aigc-weekly collection pattern:
 * 1. Collect from all sources
 * 2. Score items via LLM (threshold >= 70)
 * 3. Summarize items via LLM (2-3 sentences each)
 * 4. Review items via LLM (approve/reject)
 * 5. Store to DailyTrending Payload CMS collection
 *
 * Usage: npx tsx scripts/run-daily-pipeline.ts
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getPayload } from 'payload'
import config from '../src/payload.config'
import { collectFromAllSources } from '../src/lib/trending/sources'
import { scoreItems } from '../src/lib/trending/scorer'
import { reviewItems } from '../src/lib/trending/reviewer'
import { deduplicateItems } from '../src/lib/trending/dedup'
import { callLLMJSON } from '../src/lib/trending/llm'
import type { ScoredItem, PipelineLog } from '../src/lib/trending/types'

const SUMMARY_BATCH_SIZE = 10

/** Generate batchId from current timestamp: "2026-02-16T08" */
function generateBatchId(): string {
  return new Date().toISOString().slice(0, 13)
}

/** Summarize items using LLM in batches. Fails gracefully per batch. */
async function summarizeItems(items: ScoredItem[]): Promise<ScoredItem[]> {
  const results: ScoredItem[] = []

  for (let i = 0; i < items.length; i += SUMMARY_BATCH_SIZE) {
    const batch = items.slice(i, i + SUMMARY_BATCH_SIZE)
    const itemList = batch
      .map((item) => `- id: ${item.id}\n  title: ${item.title}\n  url: ${item.url}`)
      .join('\n')

    try {
      const summaries = await callLLMJSON<Array<{ id: string; summary: string }>>(
        `Summarize each AI/tech item in 2-3 sentences. Focus on what it is, why it matters, and who benefits.\n\nRespond as JSON array: [{"id":"...","summary":"2-3 sentence summary"}]\n\nItems:\n${itemList}`,
        { temperature: 0.3, system: 'You are a concise tech content summarizer. Respond ONLY with JSON.' },
      )

      const summaryMap = new Map(summaries.map((s) => [s.id, s.summary]))

      for (const item of batch) {
        results.push({ ...item, summary: summaryMap.get(item.id) ?? item.summary })
      }
    } catch (error) {
      console.warn(
        `[summarize] batch failed (${batch.length} items), keeping without summaries:`,
        error instanceof Error ? error.message : error,
      )
      results.push(...batch)
    }
  }

  return results
}

export async function runDailyPipeline(batchId?: string): Promise<{
  batchId: string
  itemCount: number
  log: PipelineLog
}> {
  const id = batchId || generateBatchId()
  const log: PipelineLog = { phases: {}, errors: [], startedAt: new Date().toISOString() }

  // Initialize Payload
  const payload = await getPayload({ config })

  // Idempotency: check if batchId already exists
  const existing = await payload.find({
    collection: 'daily-trending' as any,
    where: { batchId: { equals: id } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    console.log(`Batch ${id} already exists, skipping`)
    return { batchId: id, itemCount: (existing.docs[0] as any).itemCount ?? 0, log }
  }

  // Phase 1: COLLECT
  console.log(`[Phase 1/5] Collecting from all sources...`)
  const startCollect = Date.now()
  const results = await collectFromAllSources()
  const allItems = results.flatMap((r) => r.items)
  const deduped = deduplicateItems(allItems)
  log.phases.collect = { duration: Date.now() - startCollect, count: deduped.length }
  console.log(`  Collected ${allItems.length} items, ${deduped.length} after dedup`)

  // Phase 1.5: Historical dedup against last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const history = await payload.find({
    collection: 'daily-trending' as any,
    where: { date: { greater_than: sevenDaysAgo.toISOString() } },
    limit: 21,
  })
  const historicalUrls = new Set<string>()
  for (const doc of history.docs) {
    const items = ((doc as any).items || []) as Array<{ url: string }>
    items.forEach((item) => historicalUrls.add(item.url))
  }
  const fresh = deduped.filter((item) => !historicalUrls.has(item.url))
  console.log(`  ${fresh.length} items after historical dedup (removed ${deduped.length - fresh.length})`)

  if (fresh.length === 0) {
    console.log('No new items to process')
    log.completedAt = new Date().toISOString()
    return { batchId: id, itemCount: 0, log }
  }

  // Phase 2: SCORE (LLM)
  console.log(`[Phase 2/5] Scoring ${fresh.length} items...`)
  const startScore = Date.now()
  const { scored, rejected } = await scoreItems(fresh)
  log.phases.score = { duration: Date.now() - startScore, count: scored.length }
  console.log(`  ${scored.length} passed scoring (${rejected.length} rejected)`)

  if (scored.length === 0) {
    console.log('No items passed scoring threshold')
    log.completedAt = new Date().toISOString()
    return { batchId: id, itemCount: 0, log }
  }

  // Phase 3: SUMMARIZE (LLM)
  console.log(`[Phase 3/5] Summarizing ${scored.length} items...`)
  const startSummarize = Date.now()
  const summarized = await summarizeItems(scored)
  log.phases.summarize = { duration: Date.now() - startSummarize, count: summarized.length }

  // Phase 4: REVIEW (LLM)
  console.log(`[Phase 4/5] Reviewing ${summarized.length} items...`)
  const startReview = Date.now()
  const { approved, rejected: reviewRejected, reasons } = await reviewItems(summarized)
  log.phases.review = { duration: Date.now() - startReview, count: approved.length }
  console.log(`  ${approved.length} approved, ${reviewRejected.length} rejected`)
  if (Object.keys(reasons).length > 0) {
    console.log(`  Rejection reasons:`, reasons)
  }

  // Phase 5: STORE to Payload CMS
  console.log(`[Phase 5/5] Storing ${approved.length} items...`)
  const startStore = Date.now()

  const sourceStats: Record<string, number> = {}
  for (const item of approved) {
    sourceStats[item.source] = (sourceStats[item.source] || 0) + 1
  }

  await payload.create({
    collection: 'daily-trending' as any,
    data: {
      batchId: id,
      date: new Date().toISOString(),
      status: 'processed',
      itemCount: approved.length,
      items: approved,
      sourceStats,
      pipelineLog: log,
    } as any,
  })

  log.phases.store = { duration: Date.now() - startStore, count: approved.length }
  log.completedAt = new Date().toISOString()

  const totalDuration = Object.values(log.phases).reduce((sum, p) => sum + p.duration, 0)
  console.log(`\nPipeline complete: ${approved.length} items stored as batch ${id} (${totalDuration}ms)`)
  return { batchId: id, itemCount: approved.length, log }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyPipeline()
    .then((result) => {
      console.log(`\nResult:`, JSON.stringify(result, null, 2))
      process.exit(0)
    })
    .catch((err) => {
      console.error('Pipeline failed:', err)
      process.exit(1)
    })
}
