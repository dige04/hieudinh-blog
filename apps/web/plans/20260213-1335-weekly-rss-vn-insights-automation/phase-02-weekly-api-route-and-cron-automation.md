# Phase 02 - Weekly API route and cron automation

## Context links
- Parent plan: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/plan.md`
- Dependencies:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-01-rss-ingestion-and-generation-core.md`
- Docs:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/docs/development-rules.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/podcast/generate/route.ts`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/.github/workflows/podcast-cron.yml`

## Overview
- Date: 2026-02-13
- Description: add minimal, authenticated weekly generation endpoint and scheduled trigger.
- Priority: P0
- Implementation status: Implemented
- Review status: Reviewed (hardening follow-ups identified)

## Key Insights
- Podcast path already provides proven automation pattern.
- Reusing same auth model reduces risk and review overhead.
- API route gives manual trigger + cron trigger with one code path.

## Requirements
1. Add API route for weekly generation trigger.
2. Require secret header auth (`x-api-secret`).
3. Add weekly cron workflow with manual dispatch support.
4. Keep runtime/timeout conservative; no queue infra.
5. Avoid overengineering (single job, single endpoint, clear logs).

## Architecture
- New API endpoint orchestrates weekly script logic (or shared function extracted from script).
- Workflow runs on schedule, calls endpoint via curl with secret.
- Health-check GET endpoint reports configuration readiness.

## Related code files
- Create: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/weekly/generate/route.ts`
- Create: `/Users/hieudinh/Documents/my-projects/my-portfolio/.github/workflows/weekly-cron.yml`
- Modify (if needed to share logic): `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts`
- Modify: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/.env.example`

## Implementation Steps
1. Decide reuse boundary:
   - Option A (preferred): extract script core into callable module, used by script + API route.
   - Option B: API route invokes script logic directly with minimal duplication.
2. Implement POST route with:
   - secret check against `WEEKLY_API_SECRET`
   - optional `dryRun` body flag
   - structured JSON response (success/error, slug/title).
3. Implement GET route with config status booleans.
4. Add weekly GitHub workflow:
   - `schedule` weekly cron (UTC)
   - `workflow_dispatch` for manual run
   - config checks for `SITE_URL`, `WEEKLY_API_SECRET`
   - health check step then POST trigger step.
5. Keep retries minimal (single rerun via GH UI), avoid custom backoff infra.

## Todo list
- [x] Confirm weekly cron timing. (`0 6 * * 1`, Monday 06:00 UTC)
- [x] Confirm secret name: `WEEKLY_API_SECRET`.
- [x] Finalize response contract for route logs. (`success`, `data`, structured `error`)
- [x] Ensure logs redact secrets. (no secret value logged in route/workflow)
- [ ] Add timing-safe secret comparison in API route auth check.
- [ ] Add basic rate limiting / anti-abuse guard for POST trigger endpoint.
- [ ] Add maxDuration and upstream timeout handling for generation request path.

## Success Criteria
- Manual POST call can trigger weekly generation.
- Scheduled workflow triggers endpoint and reports outcome.
- Unauthorized requests return 401.

## Risk Assessment
- Cron fires but endpoint misconfigured -> repeated failures.
- Duplicate weekly post attempts -> should be safe via existing slug upsert.
- Runtime timeout if AI call is slow.

## Security Considerations
- Secret required for POST.
- No secret in query string; header only.
- Keep GET health response non-sensitive.

## Next steps
- Add timeout + request-shape hardening in weekly API route.
- Add `maxDuration` to weekly API route to reduce runtime timeout risk.
- Execute phase 03 validation and rollback readiness before enabling schedule in production.

## Unresolved questions
1. Should cron run once every Monday UTC, or Sunday to match source cadence?
2. Should workflow support dry-run prompt-only mode in first week rollout?
