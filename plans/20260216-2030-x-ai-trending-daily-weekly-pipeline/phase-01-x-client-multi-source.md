# Phase 01: Multi-Source Client Layer

## Context
- [plan.md](./plan.md) | [aigc-weekly architecture](./research/researcher-01-aigc-weekly-architecture.md) | [X API research](./research/researcher-02-x-twitter-ai-data-sources.md) | [Codebase patterns](./scout/scout-01-codebase-patterns.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-16 |
| Description | Build typed API clients for 5 sources (X, HN, RSS, ArXiv, GitHub trending) with parallel fetch orchestrator following aigc-weekly batch-research pattern |
| Priority | High -- foundation for daily and weekly pipelines |
| Depends On | None |

## Key Insights
1. Existing `hn/client.ts` pattern: typed interfaces, `fetchWithTimeout`, parallel fetch, null-safe filtering
2. aigc-weekly uses 3-tier batched parallel fetch (max 5 concurrent, 3s between batches, 2 req/domain rate limit)
3. X API PPU model means cost-awareness is critical -- use list timelines over search, apply `min_faves` filters
4. All sources normalize to shared `TrendingItem` interface for downstream LLM scoring
5. Pipeline must work without X API key -- HN + RSS + ArXiv + GitHub are free sources
6. Firecrawl available in `.env.example` for deep content extraction if needed later

## Requirements
- **R1**: X API v2 client -- list timeline + recent search endpoints, bearer token auth
- **R2**: HN client -- reuse existing `src/lib/hn/client.ts`, add AI-topic filtering
- **R3**: RSS client -- generic parser for AI newsletters (TLDR AI, The Batch, Import AI, AIGC Weekly)
- **R4**: ArXiv client -- RSS feed for cs.AI, cs.CL, cs.LG categories
- **R5**: GitHub trending client -- scrape github.com/trending or use unofficial API
- **R6**: Shared `TrendingItem` type across all sources
- **R7**: Parallel fetch orchestrator with per-source rate limiting and error isolation
- **R8**: Graceful degradation -- if any source fails, others continue

## Architecture

### Directory Structure
```
apps/web/src/lib/
  trending/
    types.ts           # Shared TrendingItem, SourceConfig, CollectionResult
    sources.ts         # Multi-source parallel fetch orchestrator
    rss-client.ts      # RSS feed parser (newsletters + ArXiv)
    github-client.ts   # GitHub trending scraper
    llm.ts             # GPT 5.3 Codex wrapper (used by Phase 02+)
  x/
    client.ts          # X API v2 client
    types.ts           # X API response shapes
  hn/
    client.ts          # [EXISTING] HN client
```

### Shared Types (`trending/types.ts`)
```typescript
export type TrendingSource = 'x' | 'hackernews' | 'rss' | 'arxiv' | 'github'

export interface TrendingItem {
  id: string                    // `${source}:${sourceId}`
  title: string
  url: string
  source: TrendingSource
  sourceId: string              // original ID from source
  author?: string
  publishedAt: string           // ISO date
  collectedAt: string           // ISO date
  content?: string              // raw text/abstract for LLM scoring
  metrics: {
    likes?: number
    retweets?: number
    comments?: number
    score?: number              // HN score, GitHub stars
    forks?: number              // GitHub
  }
  tags?: string[]
  summary?: string              // populated by LLM in Phase 02
}

export interface SourceConfig {
  name: TrendingSource
  enabled: boolean
  rateLimit: { maxRequests: number; windowMs: number }
  timeout: number
  priority: 1 | 2 | 3           // aigc-weekly tiered batching
}

export interface CollectionResult {
  source: TrendingSource
  items: TrendingItem[]
  errors: string[]
  fetchedAt: string
  durationMs: number
}
```

### X Client (`x/client.ts`)
```typescript
// Follows hn/client.ts pattern
const X_API = 'https://api.twitter.com/2'
const TIMEOUT_MS = 15000

export interface XClientConfig {
  bearerToken: string
  listIds?: string[]           // curated AI influencer lists
  searchQueries?: string[]     // e.g. "(AI OR LLM) min_faves:100 -is:retweet"
  maxResultsPerQuery?: number  // default 50
}

// Methods:
// fetchListTimeline(listId, maxResults?) -> TrendingItem[]
// searchRecent(query, maxResults?) -> TrendingItem[]
// Both normalize X API v2 tweet objects -> TrendingItem[]
```

### RSS Client (`trending/rss-client.ts`)
```typescript
// Reuses regex XML parsing from generate-weekly.ts
interface RSSFeedConfig {
  url: string
  name: string
  source: 'rss' | 'arxiv'
}

const AI_FEEDS: RSSFeedConfig[] = [
  { url: 'https://aigc-weekly.agi.li/rss.xml', name: 'AIGC Weekly', source: 'rss' },
  { url: 'https://tldr.tech/ai/rss', name: 'TLDR AI', source: 'rss' },
  { url: 'https://arxiv.org/rss/cs.AI', name: 'ArXiv cs.AI', source: 'arxiv' },
  { url: 'https://arxiv.org/rss/cs.CL', name: 'ArXiv cs.CL', source: 'arxiv' },
  { url: 'https://arxiv.org/rss/cs.LG', name: 'ArXiv cs.LG', source: 'arxiv' },
]

// fetchAllFeeds() -> TrendingItem[]
// fetchFeed(config) -> TrendingItem[]
```

### GitHub Trending Client (`trending/github-client.ts`)
```typescript
// Scrapes github.com/trending?since=daily&spoken_language_code=en
// or uses unofficial API: https://api.gitterapp.com/repositories?since=daily&language=python
// Filters: AI/ML repos only (by topic/description keyword match)

// fetchGitHubTrending(language?: string, since?: 'daily'|'weekly') -> TrendingItem[]
```

### Multi-Source Orchestrator (`trending/sources.ts`)
```typescript
// Follows aigc-weekly batch-research pattern:
// Batch 1 (Priority 1): HN, RSS newsletters -- most reliable, free
// Batch 2 (Priority 2): ArXiv, GitHub trending -- free, lower priority
// Batch 3 (Priority 3): X API -- costs money, optional

// Max 3 concurrent fetches per batch, 2s delay between batches
// Uses Promise.allSettled -- never throws, captures per-source errors

export async function collectFromAllSources(
  configs?: Partial<Record<TrendingSource, SourceConfig>>
): Promise<CollectionResult[]>
```

### LLM Wrapper (`trending/llm.ts`)
```typescript
// Shared GPT 5.3 Codex client used by Phase 02 (scoring, summarizing, reviewing)
// Uses existing proxy pattern from generate-weekly.ts:
//   ANTHROPIC_BASE_URL + ANTHROPIC_AUTH_TOKEN + anthropic-version header
//   Model: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'gpt-5.3-codex'

export async function callLLM(prompt: string, options?: {
  maxTokens?: number
  temperature?: number
}): Promise<string>

export async function callLLMJSON<T>(prompt: string, schema: string): Promise<T>
```

## Related Code Files
| File | Relevance |
|------|-----------|
| `apps/web/src/lib/hn/client.ts` | Pattern: typed interfaces, fetchWithTimeout, parallel fetch |
| `apps/web/scripts/generate-weekly.ts` | Pattern: RSS parsing, callAI proxy, Payload CMS save |
| `apps/web/src/lib/podcast/generator.ts` | Pattern: concurrency-limited parallel processing |
| `apps/web/.env.example` | Env vars to add |

## Implementation Steps

### Step 1: Create shared types
- File: `apps/web/src/lib/trending/types.ts`
- Define `TrendingItem`, `TrendingSource`, `SourceConfig`, `CollectionResult`
- No dependencies

### Step 2: Create LLM wrapper
- File: `apps/web/src/lib/trending/llm.ts`
- Extract `callAI` logic from `generate-weekly.ts` into reusable `callLLM()`
- Add `callLLMJSON<T>()` for structured output (scoring, review results)
- Config: ANTHROPIC_BASE_URL, ANTHROPIC_AUTH_TOKEN, model from env

### Step 3: Build RSS + ArXiv client
- File: `apps/web/src/lib/trending/rss-client.ts`
- Reuse regex XML parsing from `generate-weekly.ts`
- Configure 5 feeds (AIGC Weekly, TLDR AI, ArXiv cs.AI/cs.CL/cs.LG)
- Normalize to `TrendingItem[]`
- `fetchWithTimeout` per feed, 10s timeout

### Step 4: Build GitHub trending client
- File: `apps/web/src/lib/trending/github-client.ts`
- Parse github.com/trending HTML or use gitterapp API
- Filter by AI/ML keywords in description
- Normalize to `TrendingItem[]` with stars as `metrics.score`

### Step 5: Build X API client
- File: `apps/web/src/lib/x/types.ts` -- X API v2 response shapes
- File: `apps/web/src/lib/x/client.ts` -- `fetchListTimeline()`, `searchRecent()`
- Bearer token from `X_BEARER_TOKEN` env var
- Skip gracefully if no token (log warning, return empty)
- Map tweet objects to `TrendingItem[]`

### Step 6: Build multi-source orchestrator
- File: `apps/web/src/lib/trending/sources.ts`
- Tiered batching: Batch 1 (HN+RSS) -> Batch 2 (ArXiv+GitHub) -> Batch 3 (X)
- `Promise.allSettled` per batch, 2s delay between batches
- Returns `CollectionResult[]` with per-source errors and timing

### Step 7: Update .env.example
- Add `X_BEARER_TOKEN=` (optional)
- Add `TRENDING_API_SECRET=` for API route auth

## Todo List
- [ ] Create `apps/web/src/lib/trending/types.ts`
- [ ] Create `apps/web/src/lib/trending/llm.ts`
- [ ] Create `apps/web/src/lib/trending/rss-client.ts`
- [ ] Create `apps/web/src/lib/trending/github-client.ts`
- [ ] Create `apps/web/src/lib/x/types.ts`
- [ ] Create `apps/web/src/lib/x/client.ts`
- [ ] Create `apps/web/src/lib/trending/sources.ts`
- [ ] Update `apps/web/.env.example`
- [ ] Test: RSS client returns normalized items from AIGC Weekly + ArXiv feeds
- [ ] Test: GitHub client returns AI/ML repos with star counts
- [ ] Test: X client handles missing bearer token gracefully (returns [])
- [ ] Test: orchestrator returns results even when one source fails
- [ ] Test: orchestrator respects tiered batching order

## Success Criteria
1. `collectFromAllSources()` returns items from HN + RSS + ArXiv + GitHub without X API key
2. All items conform to `TrendingItem` interface with correct source attribution
3. No source failure crashes the pipeline (Promise.allSettled isolation)
4. Rate limits respected per source
5. `callLLM()` and `callLLMJSON()` work with existing proxy pattern
6. Total collection time < 60s for all free sources

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| X API PPU costs exceed budget | Medium | Medium | Start without X; add later with list timelines (cheaper) |
| GitHub trending HTML changes | Medium | Low | Fallback to gitterapp API; alert on parse failure |
| RSS feeds down or format changes | Low | Low | Per-feed error isolation; regex handles most XML variants |
| ArXiv rate limiting | Low | Low | 1 req per category per run; well within limits |
| LLM proxy unavailable | Low | High | Skip LLM phases, store raw items for later processing |

## Security Considerations
- `X_BEARER_TOKEN` stored as GitHub Actions secret, never in code
- X API responses: extract metadata only (text, metrics, URLs), no raw storage of user data
- Do not store full tweet text -- summarize only (X ToS compliance)
- RSS/ArXiv feeds are public, no auth concerns
- GitHub trending is public HTML, no auth needed
- LLM proxy auth token (`ANTHROPIC_AUTH_TOKEN`) in secrets only

## Next Steps
Phase 02 consumes `CollectionResult[]` from this phase and runs the daily 5-phase pipeline: score -> summarize -> review -> store in DailyTrending CMS.
