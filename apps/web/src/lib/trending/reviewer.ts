import type { ScoredItem } from './types'
import { callLLMJSON } from './llm'

interface ReviewResult {
  approved: string[] // item IDs
  rejected: string[] // item IDs
  reasons: Record<string, string> // id -> reason
}

const REVIEW_SYSTEM_PROMPT =
  'You are a quality reviewer for an AI trending content pipeline. Review items and flag any that should be removed. Respond ONLY with JSON.'

const REVIEW_PROMPT_TEMPLATE = `Review these curated AI items and flag removals.

Rejection criteria:
1. Not genuinely about AI/ML (false positive from scoring)
2. Marketing/promotional content disguised as news
3. Duplicate topic already covered by another item in this batch
4. Summary is inaccurate or misleading
5. Spam, clickbait, or low-effort content

Respond as JSON: {"approved":["id1","id2"],"rejected":["id3"],"reasons":{"id3":"reason"}}

Items:
{items}`

function formatItemsForReview(items: ScoredItem[]): string {
  return items
    .map(
      (item) =>
        `- id: ${item.id}\n  title: ${item.title}\n  url: ${item.url}\n  score: ${item.score.total}\n  category: ${item.category}\n  summary: ${item.summary || 'N/A'}`
    )
    .join('\n')
}

export async function reviewItems(
  items: ScoredItem[]
): Promise<{
  approved: ScoredItem[]
  rejected: ScoredItem[]
  reasons: Record<string, string>
}> {
  if (items.length === 0) {
    return { approved: [], rejected: [], reasons: {} }
  }

  try {
    const prompt = REVIEW_PROMPT_TEMPLATE.replace(
      '{items}',
      formatItemsForReview(items)
    )
    const result = await callLLMJSON<ReviewResult>(prompt, {
      temperature: 0.1,
      system: REVIEW_SYSTEM_PROMPT,
    })

    const rejectedIds = new Set(result.rejected)
    const approved: ScoredItem[] = []
    const rejected: ScoredItem[] = []

    for (const item of items) {
      if (rejectedIds.has(item.id)) {
        rejected.push({ ...item, reviewStatus: 'rejected' })
      } else {
        approved.push({ ...item, reviewStatus: 'approved' })
      }
    }

    for (const [id, reason] of Object.entries(result.reasons)) {
      console.log(`[reviewer] rejected ${id}: ${reason}`)
    }

    console.log(
      `[reviewer] approved=${approved.length} rejected=${rejected.length}`
    )
    return { approved, rejected, reasons: result.reasons }
  } catch (error) {
    // Fail-open: approve all items if LLM review fails
    console.error(
      '[reviewer] LLM review failed, approving all items:',
      error instanceof Error ? error.message : error
    )
    const approved = items.map((item) => ({
      ...item,
      reviewStatus: 'approved' as const,
    }))
    return { approved, rejected: [], reasons: {} }
  }
}
