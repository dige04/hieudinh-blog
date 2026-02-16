import type { TrendingItem, ScoredItem } from './types'
import { callLLMJSON } from './llm'

const SCORE_THRESHOLD = 70
const BATCH_SIZE = 10
const INTER_BATCH_DELAY_MS = 2_000
interface ScoreResult {
  id: string
  relevance: number
  impact: number
  utility: number
  reason: string
  category: 'news' | 'model' | 'tool' | 'paper' | 'tutorial' | 'release'
}

const SCORING_SYSTEM_PROMPT =
  'You are an AI content curator. Score each item on three dimensions. Respond ONLY with a JSON array.'

const SCORING_PROMPT_TEMPLATE = `Score each item:

RELEVANCE (0-40): How directly related to AI/ML/LLM?
- 40: Core AI (new model, framework, research breakthrough)
- 25: AI-adjacent (developer tooling with AI features, AI startup news)
- 10: Tangentially related (general tech with AI mention)
- 0: Not AI-related

IMPACT (0-30): How significant is this development?
- 30: Major release/breakthrough (new frontier model, paradigm shift)
- 20: Notable update (significant version release, acquisition)
- 10: Routine update (minor feature, incremental improvement)
- 0: No meaningful impact

UTILITY (0-30): How actionable/useful for AI practitioners?
- 30: Code/demo/tutorial you can use today
- 20: Paper with reproducible results or open weights
- 10: News/analysis only, no direct utility
- 0: Fluff/opinion without substance

Respond as JSON array: [{"id":"...","relevance":N,"impact":N,"utility":N,"reason":"...","category":"news|model|tool|paper|tutorial|release"}]

Items:
{items}`

function formatItemsForPrompt(items: TrendingItem[]): string {
  return items
    .map((item) => {
      const content = item.content ? item.content.slice(0, 200) : ''
      return `- id: ${item.id}\n  title: ${item.title}\n  url: ${item.url}\n  content: ${content}`
    })
    .join('\n')
}

function toBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size))
  }
  return batches
}

export async function scoreItems(
  items: TrendingItem[]
): Promise<{ scored: ScoredItem[]; rejected: TrendingItem[] }> {
  const scored: ScoredItem[] = []
  const rejected: TrendingItem[] = []
  const batches = toBatches(items, BATCH_SIZE)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, INTER_BATCH_DELAY_MS))
    }
    try {
      const prompt = SCORING_PROMPT_TEMPLATE.replace(
        '{items}',
        formatItemsForPrompt(batch)
      )
      const results = await callLLMJSON<ScoreResult[]>(prompt, {
        temperature: 0.1,
        system: SCORING_SYSTEM_PROMPT,
      })

      const resultMap = new Map(results.map((r) => [r.id, r]))

      for (const item of batch) {
        const result = resultMap.get(item.id)
        if (!result) {
          rejected.push(item)
          continue
        }

        const total = result.relevance + result.impact + result.utility
        const scoredItem: ScoredItem = {
          ...item,
          score: {
            relevance: result.relevance,
            impact: result.impact,
            utility: result.utility,
            total,
            reason: result.reason,
          },
          category: result.category,
          reviewStatus: 'pending',
        }

        if (total >= SCORE_THRESHOLD) {
          scored.push(scoredItem)
        } else {
          rejected.push(item)
        }
      }
    } catch (error) {
      console.error(
        `[scorer] batch failed (${batch.length} items), skipping:`,
        error instanceof Error ? error.message : error
      )
      rejected.push(...batch)
    }
  }

  console.log(
    `[scorer] scored=${scored.length} rejected=${rejected.length} total=${items.length}`
  )
  return { scored, rejected }
}
