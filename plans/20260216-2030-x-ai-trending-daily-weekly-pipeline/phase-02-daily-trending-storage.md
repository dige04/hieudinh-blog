# Phase 02: Daily Trending Collection & Storage

## Context
- [plan.md](./plan.md) | [Phase 01](./phase-01-x-client-multi-source.md) | [Research: X API](./research/researcher-02-x-twitter-ai-data-sources.md) | [Scout: Codebase](./scout/scout-01-codebase-patterns.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-16 |
| Description | DailyTrending Payload collection, batch script, dedup logic, trending score, 3x/day cron via GitHub Actions |
| Priority | High - storage layer for weekly aggregation |
| Impl Status | Planned |
| Review Status | Pending |
| Depends On | Phase 01 (multi-source clients) |

## Key Insights
1. Podcast pipeline (`generator.ts`) already implements daily dedup by checking existing Payload docs -- follow same pattern
2. DailyTrending stores snapshots per batch run, not per day. Each run has its own document with items array.
3. Dedup operates across batches within same day and across days (URL normalization is key)
4. Score is computed at collection time; weekly aggregation re-ranks by cumulative score
5. `status` field tracks processing state: `raw` -> `processed` -> `merged` (into weekly)

## Requirements
- **R1**: Payload CMS `DailyTrending` collection with typed schema
- **R2**: Batch script that calls `collectFromAllSources()` and stores results
- **R3**: URL normalization for dedup (strip UTM params, resolve redirects, lowercase host)
- **R4**: Title similarity check for near-duplicates (same story, different URL)
- **R5**: Trending score = `(likes + 2*retweets + 3*comments) / hours_since_posted^1.5`
- **R6**: API route with `x-api-secret` auth (follows weekly/podcast pattern)
- **R7**: GitHub Actions cron 3x/day at 08:00, 16:00, 00:00 UTC

## Architecture

### DailyTrending Collection Schema
```typescript
// apps/web/src/collections/DailyTrending.ts
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
    { name: 'batchId', type: 'text', required: true, unique: true },
    // format: "2026-02-16-08" (date-hour)
    { name: 'date', type: 'date', required: true, index: true },
    { name: 'status', type: 'select',
      options: [
        { label: 'Raw', value: 'raw' },
        { label: 'Processed', value: 'processed' },
        { label: 'Merged', value: 'merged' },
      ],
      defaultValue: 'raw',
    },
    { name: 'itemCount', type: 'number', defaultValue: 0 },
    { name: 'items', type: 'json', required: true },
    // items: TrendingItem[] serialized as JSON
    { name: 'sourceStats', type: 'json' },
    // sourceStats: { x: 5, hackernews: 10, rss: 8, arxiv: 3 }
    { name: 'errors', type: 'json' },
    // errors: string[] from failed sources
  ],
}
```

### Dedup Module (`trending/dedup.ts`)
```typescript
// URL normalization
export function normalizeUrl(url: string): string
// - Strip UTM/tracking params (?utm_*, ?ref=, ?source=)
// - Remove trailing slashes
// - Lowercase hostname
// - Resolve common shorteners (t.co -> follow redirect)

// Title similarity (Levenshtein distance / max length > 0.8 = duplicate)
export function isSimilarTitle(a: string, b: string, threshold?: number): boolean

// Dedup items against existing items
export function deduplicateItems(
  newItems: TrendingItem[],
  existingItems: TrendingItem[]
): { unique: TrendingItem[]; duplicates: TrendingItem[] }
```

### Scorer Module (`trending/scorer.ts`)
```typescript
export function calculateTrendingScore(item: TrendingItem): number
// Formula: (likes + 2*retweets + 3*comments) / hours_since_posted^1.5
// For HN: (score + 2*descendants) / hours^1.5
// For RSS: base score of 10 (no engagement metrics)

export function applySourceBoost(items: TrendingItem[]): TrendingItem[]
// Items appearing from multiple sources get 1.5x multiplier
```

### Batch Script Flow
```
collect-daily-trending.ts:
1. Generate batchId: "2026-02-16-08"
2. Check if batch already exists (dedup same-hour runs)
3. Call collectFromAllSources() from Phase 01
4. Flatten all CollectionResult[] into TrendingItem[]
5. Query last 24h of DailyTrending docs for existing items
6. Deduplicate new items against existing
7. Calculate trending score for each unique item
8. Apply cross-source boost
9. Create DailyTrending doc with status: 'raw'
10. Log stats: {source: count} and errors
```

## Related Code Files
| File | Relevance |
|------|-----------|
| `apps/web/src/lib/podcast/generator.ts` | Dedup pattern: query existing docs, filter by sourceId |
| `apps/web/src/app/api/podcast/generate/route.ts` | API route auth pattern to copy |
| `apps/web/.github/workflows/podcast-cron.yml` | Cron workflow pattern to copy |
| `apps/web/src/payload.config.ts` | Must add DailyTrending collection |

## Implementation Steps

### Step 1: Create DailyTrending collection
- File: `apps/web/src/collections/DailyTrending.ts`
- Register in `apps/web/src/payload.config.ts`
- Run `npx payload migrate:create` to generate migration

### Step 2: Build dedup module
- File: `apps/web/src/lib/trending/dedup.ts`
- `normalizeUrl()`: strip tracking params, lowercase host, trim trailing slash
- `isSimilarTitle()`: Levenshtein distance ratio. Threshold 0.8 = duplicate
- `deduplicateItems()`: check both URL match and title similarity
- Keep earliest occurrence, merge metrics from duplicates

### Step 3: Build scorer module
- File: `apps/web/src/lib/trending/scorer.ts`
- `calculateTrendingScore()`: source-aware formula
- `applySourceBoost()`: group by normalized URL, boost items found in 2+ sources

### Step 4: Build batch script
- File: `apps/web/scripts/collect-daily-trending.ts`
- Import orchestrator from Phase 01, dedup, scorer
- Initialize Payload CMS (same pattern as `generate-weekly.ts`)
- Main function: `runDailyCollection()`
- Export for API route import

### Step 5: Create API route
- File: `apps/web/src/app/api/trending/collect/route.ts`
- GET: health check (configured flags)
- POST: auth via `TRENDING_API_SECRET`, call `runDailyCollection()`
- Follow exact pattern from `api/weekly/generate/route.ts`

### Step 6: Create GitHub Actions cron
- File: `.github/workflows/daily-trending-cron.yml`
- Schedule: `cron: '0 0,8,16 * * *'` (3x/day)
- Steps: check secrets, health check, trigger POST
- Secret: `TRENDING_API_SECRET`

### Step 7: Update payload config
- Add `import { DailyTrending } from './collections/DailyTrending'`
- Add to `collections: [Users, Weekly, Media, Podcast, DailyTrending]`

## Todo List
- [ ] Create `apps/web/src/collections/DailyTrending.ts`
- [ ] Create `apps/web/src/lib/trending/dedup.ts`
- [ ] Create `apps/web/src/lib/trending/scorer.ts`
- [ ] Create `apps/web/scripts/collect-daily-trending.ts`
- [ ] Create `apps/web/src/app/api/trending/collect/route.ts`
- [ ] Create `.github/workflows/daily-trending-cron.yml`
- [ ] Modify `apps/web/src/payload.config.ts` -- add DailyTrending
- [ ] Modify `apps/web/.env.example` -- add TRENDING_API_SECRET
- [ ] Test: batch creates DailyTrending doc with correct schema
- [ ] Test: re-running same batch hour is idempotent (no duplicates)
- [ ] Test: items across batches are deduplicated by URL
- [ ] Test: cross-source items get boosted score

## Success Criteria
1. DailyTrending collection visible in Payload admin
2. Batch script creates document with items array and source stats
3. Re-running same batch does not create duplicate documents
4. Items with same URL across batches are deduplicated
5. Cross-source items have higher scores than single-source items
6. GitHub Actions cron triggers successfully 3x/day

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| DailyTrending JSON field grows too large | Low | Medium | Cap at 100 items per batch; older items archived |
| Levenshtein similarity causes false positives | Medium | Low | Conservative threshold (0.85); log flagged duplicates for review |
| Payload CMS migration breaks prod DB | Low | High | Test migration on dev first; use `migrate:create` not `migrate:fresh` |
| Cron runs overlap (slow batch) | Low | Medium | Batch ID uniqueness check prevents duplicate docs |

## Security Considerations
- `TRENDING_API_SECRET` stored as GitHub secret, never in code
- DailyTrending items contain summarized metadata only, no raw tweet content
- API route validates secret before processing (401 on mismatch)
- JSON fields are server-side only; not exposed to public frontend

## Next Steps
Phase 03 queries DailyTrending docs from past 7 days, ranks items, and generates the Vietnamese weekly digest via the existing Weekly pipeline.
