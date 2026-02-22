## Code Review Summary

### Scope
- Files reviewed:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/weekly/generate/route.ts`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/.github/workflows/weekly-cron.yml`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/.env.example`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/plan.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-01-rss-ingestion-and-generation-core.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-02-weekly-api-route-and-cron-automation.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-03-validation-risk-and-rollback.md`
- Lines analyzed: ~700
- Review focus: weekly pipeline architecture, security, resilience, task completeness
- Updated plans:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/plan.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-02-weekly-api-route-and-cron-automation.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-03-validation-risk-and-rollback.md`

### Overall Assessment
Pipeline is functionally coherent: RSS ingest -> AI generation -> Payload upsert, plus authenticated API trigger + cron orchestration. Main gaps now are resilience and security hardening around external AI call failures, route-level request validation/timeouts, and concurrency control to avoid duplicate expensive runs.

### Critical Issues
1. **Error payload leak from upstream AI service**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:134-137`
   - Problem: throws error including raw upstream response body (`${error}` from `response.text()`).
   - Impact: upstream body may include sensitive internal details; this message propagates to API JSON error at `/api/weekly/generate`.
   - Fix direction: log raw upstream body server-side only (redacted), return generic client-safe message.

2. **Import boundary violation: API route imports script from outside app source tree**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/weekly/generate/route.ts:2`
   - Problem: route imports `../../../../../scripts/generate-weekly` directly. Script has CLI side concerns (`dotenv.config`, process-exit launcher block).
   - Impact: architectural coupling, brittle bundling/runtime assumptions, harder testability.
   - Fix direction: extract pure service module under `src/lib/weekly/` shared by script + route; keep CLI wrapper minimal.

### High Priority Findings
1. **No timeout/abort on network I/O**
   - Files:
     - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:87,120`
     - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/weekly/generate/route.ts:71`
   - Problem: RSS fetch + AI fetch + full generation run have no AbortSignal timeout.
   - Impact: long hangs, job timeout unpredictability (cron job timeout 15 min, route has no explicit `maxDuration`).
   - Fix direction: per-call timeout + route-level max duration and clear timeout failures.

2. **Weak request validation on POST body**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/weekly/generate/route.ts:53-59`
   - Problem: accepts any JSON shape; silently ignores malformed payload.
   - Impact: ambiguous caller behavior and weak contract.
   - Fix direction: strict schema (`dryRun?: boolean`) and 400 on invalid body.

3. **Potential race condition on duplicate runs**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:303-346`
   - Problem: find-then-create/update is non-atomic; two concurrent requests can both pass existence check before create.
   - Impact: duplicate writes or one request failure due to unique slug contention; wasted AI cost.
   - Fix direction: lock/idempotency key per week slug or single-writer guard in route/workflow.

4. **Hardcoded year in title/prompt**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:191,254`
   - Problem: always `2026` while slug uses dynamic year.
   - Impact: wrong title/prompt in future years.

### Medium Priority Improvements
1. **File size rule breach**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts` (~365 LOC)
   - Against project rule target (<200 LOC). Split into parser/client/generator/persistence modules.

2. **Regex-only RSS parsing remains fragile**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:94-103`
   - Still only title/link extraction; plan notes missing normalization for description/content/guid/pubDate.

3. **Log parse approach in workflow is brittle**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/.github/workflows/weekly-cron.yml:39-40,60,80`
   - Uses `tail` + `sed` split by last line status code. Works now, but brittle if output shaping changes.

### Low Priority Suggestions
1. Health GET endpoint exposes configuration booleans; acceptable, but consider auth gating in high-threat deployments.
2. Emoji logs in script reduce log machine-parsing consistency.

### Positive Observations
- `sanitizeUrl` allowlists protocols and defaults safely.
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:70-83`
- Unauthorized POST properly returns 401 with stable structure.
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/weekly/generate/route.ts:40-51`
- Cron includes required secret checks before network calls.
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/.github/workflows/weekly-cron.yml:24-35`
- Draft-first persistence reduces publish blast radius.
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:322,341`

### Recommended Actions
1. Sanitize external error handling path:
```ts
// in callAI
if (!response.ok) {
  const raw = await response.text()
  console.error('[Weekly][AI upstream error]', { status: response.status, raw: raw.slice(0, 500) })
  throw new Error(`AI API error: ${response.status}`)
}
```

2. Add route-level input schema + hard timeout + maxDuration:
```ts
export const maxDuration = 180
// validate body strictly -> 400
// wrap runWeeklyGeneration in timeout/Abort policy
```

3. Remove route<->script coupling by extracting a pure service module under `src/lib/weekly/`.

4. Add idempotency lock for `slug` generation window (route mutex or DB-level upsert strategy).

5. Fix dynamic year derivation and complete Phase 01 normalization TODO.

### Metrics
- Type Coverage: not measured (no coverage tool configured)
- Test Coverage: not measured
- Typecheck: `pnpm -C apps/web exec tsc --noEmit` (completed, no errors)
- Linting: `pnpm -C apps/web run lint` -> 12 warnings (existing react-refresh warnings, not weekly-specific)
- Pipeline TODO status in plan:
  - Phase 01: 1 TODO still open
  - Phase 02: TODOs marked complete
  - Phase 03: 3 TODOs open

### Unresolved questions
1. Do you want weekly GET health endpoint public, or guarded by secret in production?
2. Should concurrency be solved at API layer (mutex) or persistence layer (true upsert/transaction)?
3. Should Phase 03 require automated smoke test scripts, or keep manual checklist only?
