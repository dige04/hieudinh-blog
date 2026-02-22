export type TrendingSource = 'x' | 'hackernews' | 'rss' | 'arxiv' | 'github'

export interface TrendingItem {
  id: string // `${source}:${sourceId}`
  title: string
  url: string
  source: TrendingSource
  sourceId: string // original ID from source
  author?: string
  publishedAt: string // ISO date
  collectedAt: string // ISO date
  content?: string // raw text/abstract for LLM scoring
  metrics: {
    likes?: number
    retweets?: number
    comments?: number
    score?: number // HN score, GitHub stars
    forks?: number // GitHub
    todayStars?: number // GitHub trending
  }
  tags?: string[]
  summary?: string // populated by LLM in Phase 02
}

export interface ScoredItem extends TrendingItem {
  score: {
    relevance: number // 0-40
    impact: number // 0-30
    utility: number // 0-30
    total: number // 0-100, must be >=70
    reason: string // LLM explanation
  }
  category: 'news' | 'model' | 'tool' | 'paper' | 'tutorial' | 'release'
  reviewStatus: 'approved' | 'rejected' | 'pending'
}

export interface SourceConfig {
  name: TrendingSource
  enabled: boolean
  rateLimit: { maxRequests: number; windowMs: number }
  timeout: number
  priority: 1 | 2 | 3 // aigc-weekly tiered batching
}

export interface CollectionResult {
  source: TrendingSource
  items: TrendingItem[]
  errors?: string[]
  warnings?: string[]
  collectedAt: string
  durationMs?: number
}

export interface PipelineCheckpoint {
  batchId: string
  phase: 'collected' | 'scored' | 'summarized' | 'reviewed' | 'stored'
  data: unknown
  timestamp: string
}

export interface PipelineLog {
  phases: Record<string, { duration: number; count: number }>
  errors: string[]
  startedAt: string
  completedAt?: string
}
