# Phase 02: Daily Full Pipeline (5-Phase)

## Context
- [plan.md](./plan.md) | [Phase 01](./phase-01-x-client-multi-source.md) | [aigc-weekly architecture](./research/researcher-01-aigc-weekly-architecture.md) | [X API research](./research/researcher-02-x-twitter-ai-data-sources.md) | [Codebase patterns](./scout/scout-01-codebase-patterns.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-16 |
| Description | Full aigc-weekly 5-phase pipeline running 3x/day: Collect -> Score (LLM) -> Summarize (LLM) -> Review (LLM) -> Store to DailyTrending CMS |
| Priority | High -- core daily pipeline, feeds weekly aggregation |
| Depends On | Phase 01 (multi-source clients + LLM wrapper) |

## Key Insights
1. aigc-weekly scoring matrix: Relevance (40%) + Impact (30%) + Utility (30%), threshold >=70/100
2. Artifact-based recovery: each phase produces a checkpoint file; if present, skip that phase on retry
3. LLM does scoring, summarization, and review -- 3 separate API calls per pipeline run
4. Historical dedup: check last 7 daily snapshots to avoid repeating items across days
5. aigc-weekly review loop is max 3 iterations; daily pipeline uses single-pass review (cost control)
6. GPT 5.3 Codex via existing Anthropic-compatible proxy (same pattern as `generate-weekly.ts`)
7. Existing Podcast collection uses `status: draft/published` pattern -- DailyTrending follows same

## Requirements
- **R1**: DailyTrending Payload CMS collection with typed schema
- **R2**: Phase 1 (Collect): call `collectFromAllSources()` from Phase 01, flatten results
- **R3**: Phase 2 (Score): LLM scores each item using aigc-weekly matrix (>=70/100 threshold)
- **R4**: Phase 3 (Summarize): LLM generates 2-3 sentence summary per scored item
- **R5**: Phase 4 (Review): LLM validates batch -- checks relevance, no spam, no duplicates
- **R6**: Phase 5 (Store): save curated items to DailyTrending Payload CMS collection
- **R7**: URL normalization + historical dedup against last 7 daily snapshots
- **R8**: Artifact-based recovery checkpoints between phases
- **R9**: Cron: 3x/day (08:00, 16:00, 00:00 UTC) via GitHub Actions
- **R10**: API route with `x-api-secret` auth (follows weekly/podcast pattern)

## Architecture

### Pipeline Flow
```
run-daily-pipeline.ts:

Phase 1: COLLECT
  ├── Call collectFromAllSources() (Phase 01)
  ├── Flatten CollectionResult[] -> TrendingItem[]
  ├── Checkpoint: artifacts/daily/{batchId}/collected.json
  └── Output: raw TrendingItem[] (typically 50-150 items)

Phase 2: SCORE (LLM)
  ├── Load collected.json (or use in-memory if Phase 1 just ran)
  ├── Query last 7 DailyTrending docs for historical URLs
  ├── Dedup: remove items matching historical URLs or similar titles
  ├── Batch items into groups of 20 for LLM scoring
  ├── LLM prompt: score each item on Relevance(40) + Impact(30) + Utility(30)
  ├── Filter: keep items scoring >=70/100
  ├── Checkpoint: artifacts/daily/{batchId}/scored.json
  └── Output: ScoredItem[] (typically 15-40 items)

Phase 3: SUMMARIZE (LLM)
  ├── Load scored.json
  ├── Batch items into groups of 10 for LLM summarization
  ├── LLM prompt: generate 2-3 sentence summary per item
  ├── Checkpoint: artifacts/daily/{batchId}/summarized.json
  └── Output: ScoredItem[] with summary field populated

Phase 4: REVIEW (LLM)
  ├── Load summarized.json
  ├── Single LLM call: review all items for quality
  ├── Checks: AIGC relevance, no marketing/spam, summaries accurate
  ├── LLM returns: { approved: string[], rejected: string[], reasons: {} }
  ├── Remove rejected items
  ├── Checkpoint: artifacts/daily/{batchId}/reviewed.json
  └── Output: reviewed ScoredItem[]

Phase 5: STORE
  ├── Load reviewed.json
  ├── Create DailyTrending doc in Payload CMS (status: 'processed')
  ├── Checkpoint: artifacts/daily/{batchId}/stored.json
  └── Output: DailyTrending doc ID
```

### DailyTrending Collection Schema
```typescript
// apps/web/src/collections/DailyTrending.ts
import type { CollectionConfig } from 'payload'

export const DailyTrending: CollectionConfig = {
  slug: 'daily-trending',
  admin: {
    useAsTitle: 'batchId',
    defaultColumns: ['batchId', 'date', 'status', 'itemCount'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'batchId',
      type: 'text',
      required: true,
      unique: true,
      // format: "2026-02-16T08" (ISO date + hour)
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Collected', value: 'collected' },
        { label: 'Scored', value: 'scored' },
        { label: 'Processed', value: 'processed' },
        { label: 'Merged', value: 'merged' },
      ],
      defaultValue: 'collected',
      admin: { position: 'sidebar' },
    },
    {
      name: 'itemCount',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'items',
      type: 'json',
      required: true,
      // ScoredItem[] serialized as JSON
    },
    {
      name: 'sourceStats',
      type: 'json',
      // { hackernews: 12, rss: 8, arxiv: 5, github: 3, x: 0 }
    },
    {
      name: 'pipelineLog',
      type: 'json',
      // { phases: { collect: { duration: 12s, count: 80 }, score: {...}, ... }, errors: [] }
    },
  ],
}
```

### ScoredItem Type
```typescript
// extends TrendingItem from Phase 01
export interface ScoredItem extends TrendingItem {
  score: {
    relevance: number    // 0-40
    impact: number       // 0-30
    utility: number      // 0-30
    total: number        // 0-100, must be >=70
    reason: string       // LLM explanation for score
  }
  category: 'news' | 'model' | 'tool' | 'paper' | 'tutorial' | 'release'
  reviewStatus: 'approved' | 'rejected' | 'pending'
}
```

### LLM Scoring Prompt (Phase 2)
```
You are an AI content curator. Score each item on three dimensions:

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

Respond in JSON: [{ "id": "...", "relevance": N, "impact": N, "utility": N, "reason": "...", "category": "..." }]

Items to score:
{items_json}
```

### LLM Review Prompt (Phase 4)
```
You are a quality reviewer for an AI trending content pipeline.
Review these curated items and flag any that should be removed.

Rejection criteria:
1. Not genuinely about AI/ML (false positive from scoring)
2. Marketing/promotional content disguised as news
3. Duplicate topic already covered by another item in this batch
4. Summary is inaccurate or misleading
5. Spam, clickbait, or low-effort content

Respond in JSON: { "approved": ["id1", "id2"], "rejected": ["id3"], "reasons": { "id3": "..." } }

Items to review:
{items_json}
```

### Dedup Module (`trending/dedup.ts`)
```typescript
export function normalizeUrl(url: string): string
// Strip UTM/tracking params, trailing slashes, lowercase hostname
// Resolve t.co shorteners (HEAD request, follow redirect)

export function isSimilarTitle(a: string, b: string, threshold?: number): boolean
// Levenshtein ratio > 0.85 = duplicate

export async function deduplicateAgainstHistory(
  items: TrendingItem[],
  payload: Payload,    // Payload CMS instance
  lookbackDays: number // default 7
): Promise<{ unique: TrendingItem[]; duplicates: TrendingItem[] }>
// Query last N days of DailyTrending, extract all URLs, compare
```

### Artifact-Based Recovery
```typescript
// Each phase writes a checkpoint file
const ARTIFACTS_DIR = 'artifacts/daily'

interface PipelineCheckpoint {
  batchId: string
  phase: 'collected' | 'scored' | 'summarized' | 'reviewed' | 'stored'
  data: unknown  // phase-specific output
  timestamp: string
}

function getCheckpoint(batchId: string, phase: string): PipelineCheckpoint | null
// Returns null if file doesn't exist = phase not complete

function saveCheckpoint(checkpoint: PipelineCheckpoint): void
// Write to artifacts/daily/{batchId}/{phase}.json
```

### GPT 5.3 Codex Integration
```typescript
// Uses existing proxy pattern from generate-weekly.ts (line 113-141):
//   Base URL: process.env.ANTHROPIC_BASE_URL || 'http://127.0.0.1:8317'
//   Auth: x-api-key header with ANTHROPIC_AUTH_TOKEN
//   Model: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL || 'gpt-5.3-codex'
//   Protocol: Anthropic Messages API (/v1/messages)
//
// The LLM wrapper (trending/llm.ts from Phase 01) encapsulates this.
// Daily pipeline makes 3 LLM calls per run:
//   1. Score: ~2000 tokens input, ~1000 output (batches of 20)
//   2. Summarize: ~1500 tokens input, ~800 output (batches of 10)
//   3. Review: ~1000 tokens input, ~300 output (single call)
//
// Estimated cost: ~$0.05-0.15 per daily run with GPT 5.3 Codex
// Monthly (3x/day * 30 days): ~$5-15/mo
```

## Related Code Files
| File | Relevance |
|------|-----------|
| `apps/web/scripts/generate-weekly.ts` | callAI pattern, Payload CMS save, RSS parsing |
| `apps/web/src/lib/hn/client.ts` | fetchWithTimeout, parallel fetch pattern |
| `apps/web/src/lib/podcast/generator.ts` | Daily dedup: query existing docs by sourceId |
| `apps/web/src/collections/Weekly.ts` | Collection schema pattern to follow |
| `apps/web/src/collections/Podcast.ts` | Status field + sources array pattern |
| `apps/web/src/app/api/weekly/generate/route.ts` | API route auth pattern (x-api-secret) |
| `.github/workflows/weekly-cron.yml` | Cron workflow pattern |

## Implementation Steps

### Step 1: Create DailyTrending collection
- File: `apps/web/src/collections/DailyTrending.ts`
- Register in `apps/web/src/payload.config.ts`
- Run `npx payload migrate:create` for migration

### Step 2: Create ScoredItem type
- File: extend `apps/web/src/lib/trending/types.ts` (from Phase 01)
- Add `ScoredItem`, `PipelineCheckpoint`, `PipelineLog` interfaces

### Step 3: Build dedup module
- File: `apps/web/src/lib/trending/dedup.ts`
- `normalizeUrl()`: strip tracking params, lowercase host, resolve shorteners
- `isSimilarTitle()`: Levenshtein ratio >= 0.85
- `deduplicateAgainstHistory()`: query Payload CMS for last 7 days of DailyTrending

### Step 4: Build scorer module
- File: `apps/web/src/lib/trending/scorer.ts`
- `scoreItems(items: TrendingItem[]): Promise<ScoredItem[]>`
- Calls `callLLMJSON()` with scoring prompt
- Batches items in groups of 20
- Filters items below 70/100 threshold

### Step 5: Build summarizer
- Integrate into scorer module or separate `trending/summarizer.ts`
- `summarizeItems(items: ScoredItem[]): Promise<ScoredItem[]>`
- Calls `callLLM()` with summarization prompt
- Batches items in groups of 10
- Populates `summary` field on each item

### Step 6: Build reviewer module
- File: `apps/web/src/lib/trending/reviewer.ts`
- `reviewItems(items: ScoredItem[]): Promise<{ approved: ScoredItem[], rejected: ScoredItem[] }>`
- Single LLM call per batch
- Returns approved/rejected split with reasons

### Step 7: Build pipeline script
- File: `apps/web/scripts/run-daily-pipeline.ts`
- `runDailyPipeline(batchId?: string): Promise<DailyPipelineResult>`
- Implements 5-phase flow with artifact checkpoints
- Initializes Payload CMS (same pattern as `generate-weekly.ts`)
- Logs pipeline stats (per-phase timing, item counts, errors)

### Step 8: Create API route
- File: `apps/web/src/app/api/trending/daily/route.ts`
- POST: auth via `TRENDING_API_SECRET`, call `runDailyPipeline()`
- GET: health check (return last batch status)
- Follow pattern from `api/weekly/generate/route.ts`

### Step 9: Create GitHub Actions cron
- File: `.github/workflows/daily-trending.yml`
- Schedule: `cron: '0 0,8,16 * * *'` (3x/day)
- Steps: validate secrets -> health check -> trigger POST
- Secrets: `TRENDING_API_SECRET`, `ANTHROPIC_AUTH_TOKEN`

### Step 10: Update payload config
- Add DailyTrending to `collections` array in `payload.config.ts`
- Update `.env.example` with `TRENDING_API_SECRET`

## Todo List
- [ ] Create `apps/web/src/collections/DailyTrending.ts`
- [ ] Extend `apps/web/src/lib/trending/types.ts` with ScoredItem, PipelineCheckpoint
- [ ] Create `apps/web/src/lib/trending/dedup.ts`
- [ ] Create `apps/web/src/lib/trending/scorer.ts`
- [ ] Create `apps/web/src/lib/trending/reviewer.ts`
- [ ] Create `apps/web/scripts/run-daily-pipeline.ts`
- [ ] Create `apps/web/src/app/api/trending/daily/route.ts`
- [ ] Create `.github/workflows/daily-trending.yml`
- [ ] Modify `apps/web/src/payload.config.ts` -- add DailyTrending
- [ ] Modify `apps/web/.env.example` -- add TRENDING_API_SECRET
- [ ] Test: LLM scoring returns valid JSON with scores for each item
- [ ] Test: items scoring <70 are filtered out
- [ ] Test: dedup removes items seen in last 7 daily snapshots
- [ ] Test: review phase rejects spam/marketing content
- [ ] Test: artifact checkpoint allows pipeline resume from last phase
- [ ] Test: re-running same batchId is idempotent
- [ ] Test: full pipeline end-to-end with mock LLM responses

## Success Criteria
1. Pipeline completes all 5 phases and creates DailyTrending doc in Payload CMS
2. Scoring threshold >=70/100 effectively filters low-quality items (expect 30-60% rejection)
3. Dedup eliminates items already seen in last 7 daily snapshots
4. Review phase catches spam/marketing that passed scoring (expect <5% additional rejection)
5. Artifact checkpoints enable resume -- re-running a failed pipeline skips completed phases
6. Re-running same batchId does not create duplicate CMS documents
7. GitHub Actions cron triggers 3x/day without errors
8. Total pipeline duration < 3 minutes per run

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| LLM scoring inconsistency | Medium | Medium | Fixed prompt + JSON schema; log scores for calibration review |
| LLM costs higher than estimated | Low | Medium | Start with daily-only scoring; fall back to cheaper model if >$30/mo |
| DailyTrending JSON grows too large | Low | Medium | Cap at 50 items per batch; archive old snapshots after 30 days |
| Artifact files accumulate on disk | Low | Low | Cleanup cron: delete artifacts older than 7 days |
| LLM returns malformed JSON | Medium | Low | `callLLMJSON` retries up to 2x with stricter prompt; fallback to raw text parsing |
| Payload CMS migration breaks prod | Low | High | Test on dev first; use `migrate:create` not `migrate:fresh` |
| Cron overlap (slow pipeline) | Low | Medium | batchId uniqueness check; skip if previous run still in progress |

## Security Considerations
- `TRENDING_API_SECRET` stored as GitHub secret, never in code
- `ANTHROPIC_AUTH_TOKEN` stored as GitHub secret
- API route validates secret before processing (401 on mismatch)
- DailyTrending items contain summarized metadata, no raw tweet content
- LLM prompts do not include user PII
- JSON fields server-side only; not exposed to public frontend
- Artifact files stored in gitignored directory, not committed

## Next Steps
Phase 03 (Weekly Full Pipeline) queries 7 days of DailyTrending data, re-ranks the best items, generates Vietnamese weekly digest with personal insights, runs review loop (max 2 iterations), and publishes as draft to Weekly CMS collection.
