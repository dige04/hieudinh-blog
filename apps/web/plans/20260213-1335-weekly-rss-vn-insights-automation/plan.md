# Weekly RSS -> Vietnamese Insights Automation Plan

- Plan path: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation`
- Date: 2026-02-13
- Scope: migrate weekly ingestion to AIGC RSS, keep current generation/persistence pattern, add minimal API + cron automation.

## Inputs
- [Synthesis report](./reports/01-input-synthesis.md)

## Phase status
| Phase | Title | Status | Progress | File |
|---|---|---:|---:|---|
| 01 | RSS ingestion + generation core swap | In review (hardening pending) | 85% | [phase-01-rss-ingestion-and-generation-core.md](./phase-01-rss-ingestion-and-generation-core.md) |
| 02 | Weekly API trigger + cron automation | Implemented (security hardening pending) | 90% | [phase-02-weekly-api-route-and-cron-automation.md](./phase-02-weekly-api-route-and-cron-automation.md) |
| 03 | Validation, risk controls, rollback | In Progress | 25% | [phase-03-validation-risk-and-rollback.md](./phase-03-validation-risk-and-rollback.md) |

## Planned file changes (target implementation)
### Modify
- `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts`
- `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/.env.example`

### Create
- `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/app/api/weekly/generate/route.ts`
- `/Users/hieudinh/Documents/my-projects/my-portfolio/.github/workflows/weekly-cron.yml`

### Optional (defer unless approved)
- `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/collections/Weekly.ts`
- Migration file under `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/migrations/`

## Delivery approach
- Keep existing `weekly` schema and upsert behavior.
- Replace source adapter only (HN -> RSS-first AIGC).
- Reuse existing Anthropic-compatible proxy call path.
- Reuse podcast automation security pattern (`x-api-secret` + GH secret).

## Definition of done
- Weekly generation reads from `https://aigc-weekly.agi.li/rss.xml` first.
- Output remains Vietnamese summary + personal insight.
- Automation path exists: authenticated API route + scheduled workflow.
- Validation checklist passes; rollback steps documented.
