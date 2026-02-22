# Phase 03: Weekly Full Pipeline (5-Phase aigc-weekly Pattern)

## Context
- [plan.md](./plan.md) | [Phase 02](./phase-02-daily-trending-storage.md) | [Research: aigc-weekly](./research/researcher-01-aigc-weekly-architecture.md) | [Scout: Codebase](./scout/scout-01-codebase-patterns.md)
- Existing weekly script: `apps/web/scripts/generate-weekly.ts`
- Existing cron: `.github/workflows/weekly-cron.yml` (Friday 13:00 UTC / 20:00 ICT)
- Existing validation: `apps/web/scripts/validate-weekly-pipeline.ts`
- Existing rollback: `apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/rollback-playbook.md`

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-16 |
| Description | Apply full aigc-weekly 5-phase pipeline to weekly digest: Aggregate -> Re-rank -> Write -> Review -> Publish. Replaces single-shot RSS-to-CMS with multi-pass LLM pipeline using GPT 5.3 Codex. |
| Priority | High - user-facing output |
| Impl Status | Planned |
| Review Status | Pending |
| Depends On | Phase 02 (DailyTrending storage populated) |

## Key Insights
1. aigc-weekly runs 5 discrete phases with artifact-based recovery (file exists = phase complete). We adopt this pattern using local artifacts in a `pipeline-artifacts/{week_id}/` directory.
2. Existing `generate-weekly.ts` has reusable patterns: `callAI()`, `textToLexical()`, Payload CMS upsert (find-by-slug, update-or-create), `getWeekNumber()`. We extend this file, not replace it.
3. Weekly collection schema already supports all needed fields: `title`, `slug`, `excerpt`, `content` (richText/Lexical), `personalInsight` (richText/Lexical), `status` (draft/review/published). No schema migration needed.
4. Cron already runs Friday 20:00 ICT (13:00 UTC). No cron change needed.
5. aigc-weekly scoring matrix: Relevance (40%) + Impact (30%) + Utility (30%), threshold >= 70/100. We apply this during re-rank.
6. Historical dedup: aigc-weekly checks RSS feed of previous issues. We query last 4 Weekly docs from Payload CMS instead (cheaper, same effect).
7. Issue number format: `Y26W12` (year prefix + W + zero-padded week). Maps to existing slug field.
8. Review loop capped at 2 iterations (not 3 like aigc-weekly) -- our content is shorter and simpler.

## Requirements
- **R1**: Query 7 days of DailyTrending docs from Payload CMS, merge all items into unified pool
- **R2**: LLM re-scores items using aigc-weekly scoring matrix (Relevance 40%, Impact 30%, Utility 30%). Dedup against last 4 weekly issues. Select top 15-20 items.
- **R3**: LLM writes Vietnamese digest. Structure: Mo dau -> Tin tuc -> Mo hinh -> Cong cu -> Ket luan. Each item: 2-5 sentence summary with source links. Style: professional, insightful, personal Vietnamese perspective.
- **R4**: LLM review loop (max 2 iterations). Checks: AI relevance, no marketing, date range correct, links preserved, Vietnamese quality.
- **R5**: Upsert draft to Payload CMS Weekly collection using existing find-by-slug + update-or-create pattern
- **R6**: Artifact-based recovery -- each phase produces a file; presence = phase complete
- **R7**: If DailyTrending has < 5 items, fallback to existing RSS fetch (backward compatible)
- **R8**: Mark consumed DailyTrending docs status = `merged` after successful publish

## Architecture

### 5-Phase Pipeline Flow

```
generate-weekly.ts (extended):

Phase 1 - AGGREGATE
  Input:  Payload CMS DailyTrending (last 7 days)
  Action: Query docs where date >= 7 days ago AND status != 'merged'
          Flatten all items from all batch docs
          Basic dedup by normalizedUrl (reuse dedup module from Phase 02)
  Output: pipeline-artifacts/{week_id}/daily-aggregate.json
  Guard:  If file exists, skip to Phase 2

Phase 2 - RE-RANK (LLM)
  Input:  daily-aggregate.json + last 4 Weekly docs (for historical dedup)
  Action: Send items to GPT 5.3 Codex with scoring matrix prompt
          - Relevance (40%): Core AI/ML = 40, tangential = 20, unrelated = 0
          - Impact (30%): Major release = 30, routine update = 15, fluff = 0
          - Utility (30%): Code/demo/tutorial = 30, paper-only = 15, news-only = 0
          Threshold: >= 70/100
          Dedup: penalize items whose URL/title appeared in last 4 weekly issues
          Categorize: 'tin-tuc' | 'mo-hinh' | 'cong-cu' | 'nghien-cuu'
          Select top 15-20 items
  Output: pipeline-artifacts/{week_id}/scored-items.yaml
  Guard:  If file exists, skip to Phase 3

Phase 3 - WRITE (LLM)
  Input:  scored-items.yaml
  Action: Send ranked+categorized items to GPT 5.3 Codex
          Vietnamese content generation prompt (see below)
          Also generates: title, excerpt, personalInsight
  Output: pipeline-artifacts/{week_id}/weekly-draft.md
  Guard:  If file exists, skip to Phase 4

Phase 4 - REVIEW (LLM, max 2 iterations)
  Input:  weekly-draft.md + scored-items.yaml (for cross-check)
  Action: Send draft to GPT 5.3 Codex reviewer prompt
          Checks: AI relevance, no marketing content, date range,
                  source links preserved, Vietnamese quality, structure
          Returns "PASS" or structured critique
          If critique: re-send to writer with feedback, re-review
          Max 2 iterations total (write -> review -> revise -> review)
  Output: pipeline-artifacts/{week_id}/review-pass (empty file = passed)
  Guard:  If file exists, skip to Phase 5

Phase 5 - PUBLISH
  Input:  weekly-draft.md (reviewed)
  Action: Parse markdown sections into title, excerpt, content, personalInsight
          Convert to Lexical JSON via textToLexical()
          Upsert to Payload CMS Weekly collection as draft
          Mark DailyTrending docs as 'merged'
          Save CMS response
  Output: pipeline-artifacts/{week_id}/published/{week_id}.json
  Guard:  If file exists, pipeline is done
```

### Artifact Directory Structure
```
apps/web/pipeline-artifacts/
  Y26W12/
    daily-aggregate.json     # Phase 1 output
    scored-items.yaml        # Phase 2 output
    weekly-draft.md          # Phase 3 output (may be revised in Phase 4)
    review-pass              # Phase 4 output (empty marker file)
    published/
      Y26W12.json            # Phase 5 output (CMS response)
```

Add `apps/web/pipeline-artifacts/` to `.gitignore`. Artifacts are ephemeral; they enable recovery within the same run week, not version control.

### Issue Number Format
```typescript
function getIssueNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2) // "26"
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
  return `Y${year}W${week.toString().padStart(2, '0')}` // "Y26W12"
}
```

Maps to existing `slug` field in Weekly collection. Backward compatible -- old slugs like `2026-w07` coexist.

### Phase 2: Scoring Prompt (GPT 5.3 Codex)
```
You are an AI content curator. Score each item using this matrix:

SCORING (total 100):
- Relevance (40%): Core AI/ML topic = 40, tangential tech = 20, unrelated = 0
- Impact (30%): Major release/breakthrough = 30, routine update = 15, fluff/opinion = 0
- Utility (30%): Has code/demo/tutorial = 30, paper with results = 15, news-only = 0

RULES:
- Items scoring < 70 are EXCLUDED
- Items matching these previously covered URLs/titles get 0.3x penalty: {previous_urls}
- Categorize each item: tin-tuc | mo-hinh | cong-cu | nghien-cuu

INPUT: {items_json}

OUTPUT FORMAT (YAML):
items:
  - id: "..."
    title: "..."
    url: "..."
    score: 85
    relevance: 40
    impact: 30
    utility: 15
    category: "mo-hinh"
    reason: "Major GPT-5 release with API access"
  ...
```

### Phase 3: Vietnamese Writing Prompt (GPT 5.3 Codex)
```
Ban la Hieu, mot tech blogger Viet Nam chuyen ve AI. Viet ban tin tuan {week_id}.

ITEMS (ranked by score):
{scored_items_yaml}

STRUCTURE:
## Mo dau
1-2 doan tom tat xu huong chinh trong tuan. Goc nhin tong quan.

## Tin tuc noi bat
### [Ten tin]
2-5 cau tom tat. Giai thich y nghia. [Nguon](url)

## Mo hinh & Nghien cuu
### [Ten]
2-5 cau. So sanh voi mo hinh truoc. [Nguon](url)

## Cong cu & Thu vien
### [Ten]
2-5 cau. Use case cu the. [Nguon](url)

## Ket luan
- 3-5 bullet points key takeaways
- Du doan xu huong sap toi

## Goc nhin cua minh
2-3 doan. Suy nghi ca nhan ve cach AI anh huong developer Viet Nam.
Giong van than thien, nhu dang noi chuyen voi ban be.

RULES:
- Tieng Viet tu nhien, de hieu
- Moi tin 2-5 cau, PHAI co source link
- Su dung markdown: ## heading, ### sub-heading, **bold**, [text](url)
- KHONG dich may -- viet nhu nguoi Viet
- KHONG quang cao, chi phan tich khach quan
```

### Phase 4: Review Prompt (GPT 5.3 Codex)
```
Review this Vietnamese AI weekly digest. Check ALL criteria:

1. AI RELEVANCE: Every item must be about AI/ML. Flag non-AI items.
2. NO MARKETING: No promotional language. Flag "best", "amazing", "must-have".
3. DATE RANGE: Content should cover week {start_date} to {end_date}.
4. LINKS PRESERVED: Every item MUST have at least one [text](url) source link.
5. VIETNAMESE QUALITY: Natural Vietnamese, not machine-translated. Check diacritics.
6. STRUCTURE: Must have Mo dau, category sections, Ket luan, Goc nhin cua minh.
7. LENGTH: Each item summary 2-5 sentences. Total digest 1500-3000 words.

DRAFT:
{weekly_draft_md}

RESPOND WITH EXACTLY ONE OF:
A) "PASS" (if all criteria met)
B) Structured critique:
   - criterion: [which check failed]
   - location: [paragraph/section]
   - issue: [what's wrong]
   - suggestion: [specific fix]
```

### Backward Compatibility
```typescript
// In runWeeklyGeneration():
const dailyItems = await queryDailyTrending(7)

if (dailyItems.length >= MIN_ITEMS) {
  // New 5-phase pipeline
  await runFivePhasePipeline(dailyItems)
} else {
  // Existing RSS fallback (unchanged)
  const news = await fetchAigcRss(8)
  const content = await generateWeeklyContent(news)
  await upsertToPayload(content)
}
```

Existing functions (`fetchAigcRss`, `callAI`, `textToLexical`, `getWeekNumber`, Payload upsert logic) remain unchanged and are reused by the new pipeline.

### How This Extends `generate-weekly.ts`

The existing file is ~365 lines. Changes:

| Existing Function | Change |
|---|---|
| `fetchAigcRss()` | No change - kept as RSS fallback |
| `callAI()` | No change - reused for all 5 LLM calls |
| `textToLexical()` | No change - used in Phase 5 |
| `getWeekNumber()` | Replaced by `getIssueNumber()` for new format; old format kept for fallback |
| `generateWeeklyContent()` | Still used in RSS fallback path |
| `runWeeklyGeneration()` | Extended: try 5-phase pipeline first, fallback to RSS |

New functions added:
- `queryDailyTrending(days: number)` -- Payload find with date filter
- `queryPreviousWeeklyUrls(count: number)` -- last N weekly docs for dedup
- `runFivePhasePipeline(items: TrendingItem[])` -- orchestrates Phases 1-5
- `scoreItems(items, previousUrls)` -- Phase 2 LLM call
- `writeDigest(scoredItems)` -- Phase 3 LLM call
- `reviewDigest(draft, scoredItems)` -- Phase 4 LLM call + retry loop
- `getIssueNumber()` -- Y26W12 format
- `checkArtifact(weekId, phase)` / `saveArtifact(weekId, phase, data)` -- recovery helpers

Estimated addition: ~200 lines. Total file: ~565 lines. Consider extracting pipeline logic into `apps/web/src/lib/weekly/pipeline.ts` if it exceeds 500 lines (per development rules).

## Related Code Files
| File | Relevance |
|------|-----------|
| `apps/web/scripts/generate-weekly.ts` | **Extended**: add 5-phase pipeline, keep RSS fallback |
| `apps/web/src/app/api/weekly/generate/route.ts` | No changes needed -- calls `runWeeklyGeneration()` |
| `apps/web/src/collections/Weekly.ts` | No changes needed -- schema already sufficient |
| `.github/workflows/weekly-cron.yml` | No changes needed -- Friday 13:00 UTC |
| `apps/web/src/lib/trending/dedup.ts` | Reused for Phase 1 URL normalization |
| `apps/web/src/lib/trending/types.ts` | Reused for `TrendingItem` type |
| `apps/web/src/collections/DailyTrending.ts` | Queried in Phase 1, status updated in Phase 5 |
| `apps/web/scripts/validate-weekly-pipeline.ts` | Extended to validate new pipeline artifacts |

## Implementation Steps

### Step 1: Create artifact helpers
- File: `apps/web/src/lib/weekly/artifacts.ts` (~50 lines)
- Functions: `getArtifactDir(weekId)`, `checkArtifact(weekId, phase)`, `saveArtifact(weekId, phase, data)`, `loadArtifact(weekId, phase)`
- Uses `fs` module (script context, not edge runtime)
- Add `apps/web/pipeline-artifacts/` to `.gitignore`

### Step 2: Create pipeline orchestrator
- File: `apps/web/src/lib/weekly/pipeline.ts` (~300 lines)
- `runFivePhasePipeline(items: TrendingItem[]): Promise<WeeklyGenerationResult>`
- Imports `callAI` and `textToLexical` from `generate-weekly.ts` (or move to shared)
- Phase 1: aggregate + dedup -> `daily-aggregate.json`
- Phase 2: scoring LLM call -> `scored-items.yaml`
- Phase 3: writing LLM call -> `weekly-draft.md`
- Phase 4: review loop (max 2) -> `review-pass`
- Phase 5: parse + Lexical convert + Payload upsert + mark merged -> `published/{week_id}.json`
- Each phase checks artifact existence before running (recovery)

### Step 3: Add DailyTrending query functions
- In `apps/web/src/lib/weekly/pipeline.ts` or separate `queries.ts`
- `queryDailyTrending(days: number)`: `payload.find({ collection: 'daily-trending', where: { date: { greater_than_equal: sevenDaysAgo }, status: { not_equals: 'merged' } } })`
- `queryPreviousWeeklyUrls(count: number)`: `payload.find({ collection: 'weekly', sort: '-publishedAt', limit: count })` then extract URLs from content

### Step 4: Modify generate-weekly.ts
- Extract shared functions (`callAI`, `textToLexical`) to `apps/web/src/lib/weekly/shared.ts`
- Keep `fetchAigcRss`, `generateWeeklyContent` in place for fallback
- Modify `runWeeklyGeneration()`:
  1. Try DailyTrending query
  2. If >= MIN_ITEMS (5): run `runFivePhasePipeline(items)`
  3. Else: fallback to existing RSS path
- Export `WeeklyGenerationResult` (already exported)

### Step 5: Write LLM prompts
- Store prompts as template strings in `apps/web/src/lib/weekly/prompts.ts` (~100 lines)
- `getScoringPrompt(items, previousUrls)`
- `getWritingPrompt(scoredItems, weekId)`
- `getReviewPrompt(draft, startDate, endDate)`
- Separating prompts enables iteration without touching pipeline logic

### Step 6: Test end-to-end
- Seed DailyTrending with 7 days of test data (mock or real from Phase 02 output)
- Run `npx tsx apps/web/scripts/generate-weekly.ts` locally
- Verify artifact files created in correct order
- Verify Weekly draft in Payload CMS admin
- Verify DailyTrending docs marked as `merged`
- Test recovery: delete `weekly-draft.md`, re-run -> should skip Phases 1-2, resume at 3
- Test fallback: empty DailyTrending -> should produce Weekly from RSS

### Step 7: Update validation script
- Extend `validate-weekly-pipeline.ts` Domain 4 (Content Structure) to:
  - Check artifact directory health
  - Validate `scored-items.yaml` has >= 10 items with score >= 70
  - Validate `weekly-draft.md` has all required Vietnamese sections
  - Validate review passed (review-pass file exists)

## Todo List
- [ ] Create `apps/web/src/lib/weekly/artifacts.ts` -- artifact CRUD helpers
- [ ] Create `apps/web/src/lib/weekly/prompts.ts` -- LLM prompt templates
- [ ] Create `apps/web/src/lib/weekly/pipeline.ts` -- 5-phase orchestrator
- [ ] Extract `callAI` and `textToLexical` to `apps/web/src/lib/weekly/shared.ts`
- [ ] Modify `apps/web/scripts/generate-weekly.ts` -- add pipeline branch + fallback
- [ ] Add `pipeline-artifacts/` to `apps/web/.gitignore`
- [ ] Test: Phase 1 aggregation produces `daily-aggregate.json` from DailyTrending
- [ ] Test: Phase 2 scoring filters items by threshold >= 70
- [ ] Test: Phase 3 produces Vietnamese digest with correct structure
- [ ] Test: Phase 4 review loop converges in <= 2 iterations
- [ ] Test: Phase 5 upserts draft to Weekly collection with correct slug
- [ ] Test: DailyTrending docs marked as `merged` after Phase 5
- [ ] Test: Artifact-based recovery skips completed phases on re-run
- [ ] Test: RSS fallback activates when DailyTrending has < 5 items
- [ ] Test: Existing weekly API route works unchanged
- [ ] Extend `validate-weekly-pipeline.ts` to check new pipeline artifacts

## Success Criteria
1. Weekly draft appears in Payload CMS admin with categorized Vietnamese content generated through the 5-phase pipeline
2. Scoring matrix filters low-quality items (score < 70 excluded)
3. Items from previous 4 weeks are deprioritized (historical dedup)
4. Review loop catches and fixes content issues within 2 iterations
5. If DailyTrending is empty, pipeline falls back to RSS without error
6. Consumed DailyTrending docs have status = `merged`
7. Artifact-based recovery works: interrupted pipeline resumes from last completed phase
8. No changes needed to `weekly-cron.yml`, `Weekly.ts`, or API route
9. Existing weekly API route works unchanged (`/api/weekly/generate` POST)
10. Total GPT 5.3 Codex calls per weekly run: 3-5 (score + write + review x1-2 + excerpt)

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| LLM scoring inconsistent across runs | Medium | Medium | Structured YAML output format + score validation (numeric range check) |
| Review loop never passes (infinite critique) | Low | Medium | Hard cap at 2 iterations; accept draft with warning after cap |
| GPT 5.3 Codex rate limit during multi-call pipeline | Low | High | Sequential calls with 2s delay; weekly runs once so unlikely |
| Vietnamese content quality drops with scoring step | Medium | Medium | Keep existing RSS-based prompt as fallback benchmark |
| Artifact directory permissions on CI | Low | Medium | Use `/tmp/pipeline-artifacts/` on CI; local dir for dev |
| DailyTrending query returns 500+ items | Low | Medium | Cap aggregation at 200 items before sending to LLM |
| YAML parsing fails on LLM output | Medium | Medium | Validate YAML structure; retry LLM call once on parse failure |
| Lexical JSON conversion loses markdown formatting | Low | Low | Existing `textToLexical()` already handles this; test with longer content |

## Security Considerations
- No new env vars or secrets needed for this phase (reuses existing `ANTHROPIC_*` vars)
- LLM prompts contain only aggregated metadata (titles, URLs, scores) -- no raw user data
- Artifact files stored locally, never committed to git. Add to `.gitignore`.
- Vietnamese content generated server-side, stored as Lexical JSON in Payload
- Previous weekly URLs query is internal Payload API; no data exposure
- All content published as draft; human review required before public publish

## Next Steps
Phase 04 adds monitoring, validation, cost tracking, and alerting to harden both daily and weekly pipelines for unattended operation.
