import { appendFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import path from 'path'

const COST_LOG_PATH = path.resolve(process.cwd(), 'pipeline-artifacts', 'cost-log.jsonl')

interface CostEntry {
  timestamp: string
  pipeline: 'daily' | 'weekly'
  phase: string
  model: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

// GPT 5.3 Codex estimated pricing
const INPUT_COST_PER_1K = 0.005 // $0.005 per 1K input tokens
const OUTPUT_COST_PER_1K = 0.015 // $0.015 per 1K output tokens

export function estimateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * INPUT_COST_PER_1K + (outputTokens / 1000) * OUTPUT_COST_PER_1K
}

export function trackCost(entry: Omit<CostEntry, 'timestamp' | 'estimatedCostUsd'>): void {
  const dir = path.dirname(COST_LOG_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const fullEntry: CostEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    estimatedCostUsd: estimateCost(entry.inputTokens, entry.outputTokens),
  }

  appendFileSync(COST_LOG_PATH, JSON.stringify(fullEntry) + '\n', 'utf-8')
}

export interface CostSummary {
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  callCount: number
  byPipeline: Record<string, { cost: number; calls: number }>
  period: { from: string; to: string }
}

export function getCostSummary(days: number = 30): CostSummary {
  if (!existsSync(COST_LOG_PATH)) {
    return {
      totalCostUsd: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      callCount: 0,
      byPipeline: {},
      period: { from: '', to: '' },
    }
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const lines = readFileSync(COST_LOG_PATH, 'utf-8').trim().split('\n').filter(Boolean)

  const entries: CostEntry[] = []
  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as CostEntry
      if (entry.timestamp >= cutoff) entries.push(entry)
    } catch {
      /* skip malformed lines */
    }
  }

  const byPipeline: Record<string, { cost: number; calls: number }> = {}
  let totalCost = 0,
    totalInput = 0,
    totalOutput = 0

  for (const e of entries) {
    totalCost += e.estimatedCostUsd
    totalInput += e.inputTokens
    totalOutput += e.outputTokens
    if (!byPipeline[e.pipeline]) byPipeline[e.pipeline] = { cost: 0, calls: 0 }
    byPipeline[e.pipeline].cost += e.estimatedCostUsd
    byPipeline[e.pipeline].calls += 1
  }

  return {
    totalCostUsd: Math.round(totalCost * 1000) / 1000,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    callCount: entries.length,
    byPipeline,
    period: { from: cutoff, to: new Date().toISOString() },
  }
}

export type { CostEntry }
