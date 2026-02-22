# Phase 04: Monitoring, Validation & Hardening

## Context
- [plan.md](./plan.md) | [Phase 03](./phase-03-weekly-aggregation-digest.md) | [Scout: Codebase](./scout/scout-01-codebase-patterns.md)
- Existing validation script: `apps/web/scripts/validate-weekly-pipeline.ts`
- Existing rollback playbook: `apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/rollback-playbook.md`
- Podcast failure notification pattern: `.github/workflows/podcast-cron.yml` (notify-failure job)
- Existing crons: `weekly-cron.yml` (Friday 13:00 UTC), `daily-trending-cron.yml` (3x/day from Phase 02)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-16 |
| Description | Health monitoring, cost tracking, failure alerting, artifact integrity checks, rollback procedures, structured logging, and health check endpoint for both daily and weekly pipelines |
| Priority | Medium - operational reliability for unattended daily/weekly runs |
| Impl Status | Planned |
| Review Status | Pending |
| Depends On | Phase 03 (full 5-phase pipeline functional) |

## Key Insights
1. Podcast cron already has a `notify-failure` job with `if: failure()` pattern -- replicate for both daily and weekly crons.
2. Pipeline is self-healing for daily: missed daily batch is recovered by next run (8-hour overlap between 3x/day crons). Weekly is more critical since it runs once.
3. X API Basic costs $100/mo fixed. Variable cost is GPT 5.3 Codex API usage. Daily: ~2-3 LLM calls (scoring). Weekly: ~3-5 LLM calls (score + write + review x1-2). Estimated monthly: ~$5-15 at current token rates.
4. Existing `validate-weekly-pipeline.ts` checks 4 domains (preflight, RSS, API, content structure). We extend it with 2 new domains (DailyTrending health, artifact integrity).
5. Main failure modes in priority order: (a) source unavailability, (b) GPT 5.3 Codex timeout/error, (c) Payload CMS downtime, (d) rate limit exhaustion.
6. GitHub Actions provides built-in email notifications on workflow failure. We add explicit `notify-failure` job for structured error logging.

## Requirements
- **R1**: Daily pipeline health monitoring (GitHub Actions status, source availability, batch creation)
- **R2**: Weekly pipeline validation (pre-flight checks, artifact integrity, content quality)
- **R3**: Cost tracking for GPT 5.3 Codex API usage per day/week and X API credit consumption
- **R4**: Alert strategy: GitHub Actions failure notifications following podcast-cron pattern
- **R5**: Artifact integrity checks (daily snapshots exist before weekly runs)
- **R6**: Rollback procedures for both daily and weekly pipelines
- **R7**: Structured logging for each pipeline phase with consistent format
- **R8**: Simple health check API endpoint for external monitoring

## Architecture

### Health Check API (`api/trending/health/route.ts`)
```typescript
// GET /api/trending/health (public, no auth needed)
// Returns non-sensitive operational status

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    daily: {
      lastBatchTime: string | null       // ISO date of most recent DailyTrending doc
      lastBatchItemCount: number         // items in most recent batch
      batchesLast24h: number             // how many batches in last 24h (expect 3)
      sourcesHealthy: Record<string, boolean>  // { x: true, hn: true, rss: true }
    }
    weekly: {
      lastWeeklySlug: string | null      // most recent Weekly doc slug
      lastWeeklyStatus: string | null    // draft/review/published
      currentWeekDraftExists: boolean    // does this week's draft exist?
      artifactsExist: {                  // Phase 03 artifact checks
        aggregate: boolean
        scored: boolean
        draft: boolean
        reviewed: boolean
        published: boolean
      }
    }
    costs: {
      estimatedDailyLlmCalls: number     // LLM calls today
      estimatedWeeklyLlmCalls: number    // LLM calls this week
      xApiPlan: string                   // 'basic' | 'free' | 'disabled'
    }
  }
}

// Status logic:
// - healthy: batchesLast24h >= 2 AND lastBatchItemCount > 0
// - degraded: batchesLast24h >= 1 BUT some sources failed
// - unhealthy: batchesLast24h == 0 OR no DailyTrending docs at all
```

### Extended Validation Script (`scripts/validate-trending.ts`)
```typescript
// Extends existing validate-weekly-pipeline.ts with 2 new domains

// Domain 5: DailyTrending Health
function validateDailyTrending(): ValidationReport {
  // 5a. DailyTrending docs exist for last 24h
  // 5b. Each doc has itemCount > 0
  // 5c. At least 2 of 3 expected daily batches exist
  // 5d. No source has 100% error rate in last 3 batches
  // 5e. Items contain valid URLs and non-empty titles
}

// Domain 6: Weekly Pipeline Artifacts
function validateWeeklyArtifacts(weekId: string): ValidationReport {
  // 6a. Artifact directory exists for current week
  // 6b. daily-aggregate.json is valid JSON with items array
  // 6c. scored-items.yaml has >= 10 items with score >= 70
  // 6d. weekly-draft.md contains required Vietnamese sections
  // 6e. review-pass file exists (review completed)
  // 6f. published/{weekId}.json has CMS response with doc ID
}
```

### Cost Tracking Module (`src/lib/trending/cost-tracker.ts`)
```typescript
// Simple file-based cost tracking (no database needed)
// Appends to pipeline-artifacts/cost-log.jsonl

interface CostEntry {
  timestamp: string
  pipeline: 'daily' | 'weekly'
  phase: string                  // 'collect' | 'score' | 'write' | 'review' | 'excerpt'
  model: string                  // 'gpt-5.3-codex'
  inputTokens: number            // from API response usage
  outputTokens: number           // from API response usage
  estimatedCostUsd: number       // calculated from token count
}

// Track by wrapping callAI() responses:
export function trackCost(entry: CostEntry): void
export function getCostSummary(days: number): CostSummary
```

Token pricing estimate (GPT 5.3 Codex):
- Input: ~$0.005 / 1K tokens
- Output: ~$0.015 / 1K tokens
- Daily pipeline: ~5K input + 2K output = ~$0.055/day = ~$1.65/month
- Weekly pipeline: ~15K input + 8K output = ~$0.195/week = ~$0.84/month
- **Total estimated: ~$2.50/month** (well within budget)

### Structured Logging (`src/lib/trending/logger.ts`)
```typescript
// Consistent structured logging across all pipeline phases

interface PipelineLog {
  timestamp: string
  pipeline: 'daily' | 'weekly'
  phase: string
  level: 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, unknown>
}

export function pipelineLog(log: PipelineLog): void {
  const prefix = `[${log.pipeline}:${log.phase}]`
  const msg = `${prefix} ${log.message}`

  switch (log.level) {
    case 'error':
      console.error(msg, log.metadata ?? '')
      break
    case 'warn':
      console.warn(msg, log.metadata ?? '')
      break
    default:
      console.log(msg, log.metadata ?? '')
  }
}

// Usage:
// pipelineLog({ pipeline: 'daily', phase: 'collect', level: 'info',
//   message: 'Collected 15 items from 3 sources',
//   metadata: { sources: { x: 5, hn: 7, rss: 3 } }
// })
```

### GitHub Actions Failure Notifications

#### Daily Trending Cron (add to `daily-trending-cron.yml`)
```yaml
notify-failure:
  runs-on: ubuntu-latest
  needs: collect
  if: failure()
  steps:
    - name: Log failure details
      run: |
        echo "::error::Daily trending collection failed!"
        echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        echo "Check the collect job logs for details."
        echo "Rollback: Re-run this workflow via workflow_dispatch"
```

#### Weekly Cron (add to `weekly-cron.yml`)
```yaml
notify-failure:
  runs-on: ubuntu-latest
  needs: generate-weekly
  if: failure()
  steps:
    - name: Log failure details
      run: |
        echo "::error::Weekly generation pipeline failed!"
        echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        echo "Check the generate-weekly job logs for details."
        echo "Rollback: Re-run with workflow_dispatch or use manual script"
        echo "See: apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/rollback-playbook.md"
```

Both follow the exact pattern from `.github/workflows/podcast-cron.yml` notify-failure job.

### Rate Limit Tracking (X Client)
```typescript
// In apps/web/src/lib/x/client.ts
// X API returns rate limit headers on every response:
//   x-rate-limit-limit: 50
//   x-rate-limit-remaining: 47
//   x-rate-limit-reset: 1708000000

interface RateLimitStatus {
  endpoint: string
  limit: number
  remaining: number
  resetAt: string            // ISO date
  percentUsed: number        // 0-100
}

// Module-level tracking (resets each process invocation)
const rateLimits: Map<string, RateLimitStatus> = new Map()

export function updateRateLimit(endpoint: string, headers: Headers): void {
  const limit = parseInt(headers.get('x-rate-limit-limit') ?? '0')
  const remaining = parseInt(headers.get('x-rate-limit-remaining') ?? '0')
  const reset = parseInt(headers.get('x-rate-limit-reset') ?? '0')

  if (limit > 0) {
    const status: RateLimitStatus = {
      endpoint,
      limit,
      remaining,
      resetAt: new Date(reset * 1000).toISOString(),
      percentUsed: ((limit - remaining) / limit) * 100,
    }
    rateLimits.set(endpoint, status)

    // Warn when approaching limit
    if (status.percentUsed > 80) {
      pipelineLog({
        pipeline: 'daily', phase: 'collect', level: 'warn',
        message: `X API rate limit at ${status.percentUsed.toFixed(0)}% for ${endpoint}`,
        metadata: status
      })
    }
  }
}

export function getRateLimitStatus(): RateLimitStatus[] {
  return Array.from(rateLimits.values())
}
```

### Pre-Flight Checks (Before Weekly Pipeline)
```typescript
// Run before Phase 1 of weekly pipeline
// Checks that daily data is sufficient for weekly generation

async function weeklyPreFlight(payload: Payload): Promise<{
  pass: boolean
  checks: Array<{ name: string; pass: boolean; message: string }>
}> {
  const checks = []

  // Check 1: DailyTrending docs exist for at least 5 of last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const dailyDocs = await payload.find({
    collection: 'daily-trending',
    where: { date: { greater_than_equal: sevenDaysAgo.toISOString() } },
    limit: 100,
  })
  const uniqueDays = new Set(dailyDocs.docs.map(d =>
    new Date(d.date).toISOString().split('T')[0]
  ))
  checks.push({
    name: 'daily_coverage',
    pass: uniqueDays.size >= 5,
    message: `${uniqueDays.size}/7 days have DailyTrending data`
  })

  // Check 2: Total items across all docs >= MIN_ITEMS
  const totalItems = dailyDocs.docs.reduce((sum, d) => {
    const items = Array.isArray(d.items) ? d.items : []
    return sum + items.length
  }, 0)
  checks.push({
    name: 'item_count',
    pass: totalItems >= 5,
    message: `${totalItems} total items across ${dailyDocs.docs.length} batches`
  })

  // Check 3: AI proxy is reachable
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'http://127.0.0.1:8317'
  try {
    const resp = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) })
    checks.push({ name: 'ai_proxy', pass: true, message: `AI proxy reachable at ${baseUrl}` })
  } catch {
    checks.push({ name: 'ai_proxy', pass: false, message: `AI proxy unreachable at ${baseUrl}` })
  }

  return {
    pass: checks.every(c => c.pass),
    checks
  }
}
```

## Related Code Files
| File | Relevance |
|------|-----------|
| `apps/web/scripts/validate-weekly-pipeline.ts` | **Extended**: add DailyTrending health + artifact integrity domains |
| `.github/workflows/podcast-cron.yml` | `notify-failure` job pattern to replicate |
| `.github/workflows/daily-trending-cron.yml` | **Modified**: add notify-failure job |
| `.github/workflows/weekly-cron.yml` | **Modified**: add notify-failure job |
| `apps/web/src/lib/x/client.ts` | **Modified**: add rate limit header parsing |
| `apps/web/src/app/api/weekly/generate/route.ts` | Health check GET pattern reference |
| `apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/rollback-playbook.md` | Existing rollback procedures to extend |

## Implementation Steps

### Step 1: Create structured logger
- File: `apps/web/src/lib/trending/logger.ts` (~40 lines)
- `pipelineLog()` function with consistent `[pipeline:phase]` prefix
- Levels: info, warn, error
- Optional metadata object for structured data
- No external dependencies; wraps `console.log/warn/error`

### Step 2: Create cost tracker
- File: `apps/web/src/lib/trending/cost-tracker.ts` (~60 lines)
- `trackCost()`: appends JSON line to `pipeline-artifacts/cost-log.jsonl`
- `getCostSummary(days)`: reads log, sums costs for last N days
- Token-to-cost conversion constants for GPT 5.3 Codex
- Integrate into `callAI()` wrapper: parse `usage` field from API response

### Step 3: Add rate limit tracking to X client
- Modify: `apps/web/src/lib/x/client.ts`
- Parse `x-rate-limit-*` headers from every X API response
- Store in module-level `Map<string, RateLimitStatus>`
- Export `getRateLimitStatus()` for health check
- Log warning when `percentUsed > 80`

### Step 4: Create health check API endpoint
- File: `apps/web/src/app/api/trending/health/route.ts` (~80 lines)
- GET handler (no auth needed -- returns non-sensitive counts and booleans)
- Queries DailyTrending for last 24h batches
- Queries Weekly for current week draft existence
- Checks artifact directory for current week
- Includes cost summary from tracker
- Returns structured `HealthResponse` JSON

### Step 5: Extend validation script
- Modify: `apps/web/scripts/validate-weekly-pipeline.ts`
- Add Domain 5: DailyTrending health checks
  - Docs exist for last 24h
  - Each doc has items
  - No source has 100% error rate
- Add Domain 6: Weekly artifact integrity
  - Artifact directory exists
  - Each phase file is valid (JSON parseable, YAML parseable, non-empty)
  - Review-pass marker file exists
- Update report summary to include new domains
- Keep existing Domains 1-4 unchanged

### Step 6: Add failure notifications to both crons
- Modify: `.github/workflows/daily-trending-cron.yml`
  - Add `notify-failure` job (needs: collect, if: failure())
  - Log structured error with timestamp and rollback link
- Modify: `.github/workflows/weekly-cron.yml`
  - Add `notify-failure` job (needs: generate-weekly, if: failure())
  - Log structured error with rollback playbook reference

### Step 7: Add pre-flight checks to weekly pipeline
- Add `weeklyPreFlight()` to `apps/web/src/lib/weekly/pipeline.ts`
- Run before Phase 1 of `runFivePhasePipeline()`
- Checks: daily coverage (5/7 days), item count (>= 5), AI proxy reachable
- If pre-flight fails: log warning, fall back to RSS pipeline (not hard fail)

### Step 8: Document rollback procedures
- Extend existing rollback playbook with daily pipeline procedures
- Daily: delete DailyTrending doc -> re-trigger via `workflow_dispatch`
- Weekly: delete artifact directory -> re-trigger weekly cron
- Both: `workflow_dispatch` support for manual re-runs (already configured)

## Rollback Procedures

### Re-run Missed Daily Batch
1. Go to GitHub Actions > Daily Trending Collection
2. Click "Run workflow" > select branch > Run
3. Batch ID (date-hour format) prevents duplicates if original partially succeeded
4. If batch created bad data: delete DailyTrending doc in Payload admin, re-trigger

### Re-run Weekly Generation
1. Go to GitHub Actions > Weekly Generation
2. Click "Run workflow" > set `dry_run: false` > Run
3. Existing weekly doc is updated (upsert by slug)
4. To force full re-run: delete artifact directory `pipeline-artifacts/{week_id}/` first

### Reset DailyTrending Data
1. Go to Payload admin > Daily Trending collection
2. Delete problematic docs (filter by date)
3. Re-trigger daily batch via `workflow_dispatch`
4. Weekly generation will use whatever DailyTrending data exists

### Rollback Weekly Draft
1. Go to Payload admin > Weekly collection
2. Set status back to "draft" or delete the doc entirely
3. Delete artifact directory: `rm -rf pipeline-artifacts/{week_id}/`
4. Re-trigger weekly generation (will regenerate from DailyTrending)

### Emergency: Disable All Automation
```bash
# Disable both cron workflows
gh workflow disable daily-trending-cron.yml
gh workflow disable weekly-cron.yml

# Verify disabled
gh workflow list
# Both should show "disabled_manually"

# Re-enable after fix:
gh workflow enable daily-trending-cron.yml
gh workflow enable weekly-cron.yml
```

## Todo List
- [ ] Create `apps/web/src/lib/trending/logger.ts` -- structured pipeline logger
- [ ] Create `apps/web/src/lib/trending/cost-tracker.ts` -- LLM cost tracking
- [ ] Create `apps/web/src/app/api/trending/health/route.ts` -- health check endpoint
- [ ] Modify `apps/web/src/lib/x/client.ts` -- add rate limit header parsing + warning
- [ ] Modify `apps/web/scripts/validate-weekly-pipeline.ts` -- add Domain 5 (DailyTrending) + Domain 6 (artifacts)
- [ ] Modify `.github/workflows/daily-trending-cron.yml` -- add notify-failure job
- [ ] Modify `.github/workflows/weekly-cron.yml` -- add notify-failure job
- [ ] Add `weeklyPreFlight()` to weekly pipeline (Phase 03 integration)
- [ ] Integrate `trackCost()` into `callAI()` response handling
- [ ] Integrate `pipelineLog()` into all pipeline phases (daily + weekly)
- [ ] Test: health endpoint returns correct status without auth
- [ ] Test: validation detects missing daily batches (Domain 5)
- [ ] Test: validation detects incomplete weekly artifacts (Domain 6)
- [ ] Test: cost tracker calculates daily/weekly estimates correctly
- [ ] Test: rate limit warning triggers at > 80% usage
- [ ] Test: notify-failure job fires when pipeline job fails
- [ ] Test: manual re-run via `workflow_dispatch` recovers from missed batch

## Success Criteria
1. `GET /api/trending/health` returns meaningful status (healthy/degraded/unhealthy) without authentication
2. GitHub Actions sends failure notification (via notify-failure job) when daily or weekly pipeline fails
3. X API rate limit tracked per-request and surfaced in health check
4. Manual re-run via `workflow_dispatch` recovers from missed daily batch or failed weekly generation
5. Validation script catches: no batches in 24h, source failures, missing weekly draft, incomplete artifacts
6. Cost tracker produces monthly estimate within 20% accuracy of actual billing
7. Structured logs enable grep-based debugging: `[daily:collect]`, `[weekly:score]`, etc.
8. Pre-flight checks prevent weekly pipeline from running with insufficient daily data (falls back to RSS)
9. All rollback procedures documented and manually verified
10. No new secrets or env vars needed (reuses existing infrastructure)

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Health endpoint exposes internal state | Low | Low | Only return aggregate counts, booleans, and timestamps. No item content, API keys, or error details. |
| Rate limit tracking inaccurate across serverless invocations | Medium | Low | Track per-invocation only; conservative 80% warning threshold. Health endpoint shows last-known state. |
| Notification fatigue from transient failures | Medium | Medium | Only alert on job-level failure (not individual source failure). Pipeline is self-healing for daily; only weekly is critical. |
| Cost tracker file grows unbounded | Low | Low | JSONL file grows ~1KB/day. Rotate monthly or cap at 10K lines. |
| Validation script takes too long | Low | Medium | Set 30s timeout per domain. Skip slow checks with `--skip-daily` flag. |
| Pre-flight check false negative (passes when data is bad) | Low | High | Multiple independent checks (coverage, item count, proxy). Worst case: RSS fallback catches it. |

## Security Considerations
- Health endpoint is public but returns only non-sensitive data: counts, booleans, timestamps, status strings
- No API keys, tokens, or secrets in health response or cost tracker output
- Cost tracker stores token counts only; no prompt content or API keys logged
- Validation script runs server-side only (CLI); not exposed as API
- Rate limit data is per-request, stored in-memory only (no persistence across invocations)
- Notify-failure job logs go to GitHub Actions logs (private repo only)
- Cost log file (`cost-log.jsonl`) stored in `pipeline-artifacts/` (gitignored)

## Next Steps
After Phase 04, the pipeline runs unattended with monitoring. Future enhancements (not in scope):
- Firecrawl integration for full article content extraction from source URLs
- AI agent pattern (OpenCode/aigc-weekly style) for fully autonomous multi-agent curation
- Email notification to subscribers when Weekly is published (via existing Resend integration)
- Analytics dashboard for trending topic patterns over time
- Discord/Slack webhook integration for real-time failure alerts (upgrade from GitHub Actions email)
