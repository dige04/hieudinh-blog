# Phase 03 - Validation, risk, and rollback

## Context links
- Parent plan: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/plan.md`
- Dependencies:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-01-rss-ingestion-and-generation-core.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-02-weekly-api-route-and-cron-automation.md`
- Docs:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/docs/development-rules.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/docs/system-architecture.md`

## Overview
- Date: 2026-02-13
- Description: validate correctness, run minimal acceptance checklist, and define rollback playbook.
- Priority: P0
- Implementation status: In Progress (review checkpoints running)
- Review status: Reviewed (pipeline hardening and QA gate pending)

## Key Insights
- Highest risk is source/AI instability, not schema/rendering.
- Rollback is straightforward if generation logic remains isolated.
- Keep first rollout in `draft` to reduce blast radius.

## Requirements
1. Validate ingestion correctness from RSS fields.
2. Validate Vietnamese quality + insight structure.
3. Validate automation path (API + cron) end-to-end.
4. Define explicit rollback to previous HN/manual path.

## Architecture
- Validation levels:
  - Unit-ish functional checks for source normalization.
  - Manual API smoke test with auth header.
  - Cron dry run + one live run.
- Rollback levels:
  - Disable cron first.
  - Repoint source logic to previous HN path if needed.

## Related code files
- Validate modified/created files from phases 01-02.
- Validate runtime config in:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/.env.example`
  - GitHub repo secrets for workflow.

## Implementation Steps
1. Preflight config check:
   - local proxy env values present
   - weekly API secret set
   - site URL set.
2. Script validation checklist:
   - RSS fetch success
   - item normalization non-empty
   - generated content saved to `weekly` as draft.
3. API validation checklist:
   - GET health = configured true
   - POST unauthorized returns 401
   - POST authorized returns success payload.
4. Cron validation checklist:
   - run workflow_dispatch dry run
   - run workflow_dispatch live once
   - verify created/updated weekly doc.
5. Content validation:
   - Vietnamese readability
   - insights section present
   - links sane and non-empty.
6. Rollback rehearsal:
   - disable workflow schedule
   - confirm manual script path still works.

## Todo list
- [ ] Define explicit command list for QA operator.
- [ ] Capture expected response examples for API route.
- [ ] Add go/no-go gate before schedule enable.

## Success Criteria
- End-to-end pipeline runs with no manual code edits during weekly run.
- New content is draft, reviewable, and structurally correct.
- Rollback can be done in <15 minutes.

## Risk Assessment
- Feed outage -> no weekly output.
- Model/proxy outage -> generation fails.
- Overlong prompts -> timeout risk.
- Duplicate run same week -> should update existing slug, not duplicate.

## Security Considerations
- Redact secrets in logs/workflow outputs.
- Keep POST endpoint auth strict.
- Avoid exposing raw upstream feed body in public responses.

## Next steps
- Add weekly route hardening before schedule reliance: request timeout, request schema validation, and generic external error responses.
- Add generation lock/idempotency strategy to avoid race conditions on concurrent runs.
- Complete QA operator command list and go/no-go gate.
- If phase passes, keep schedule enabled.
- If phase fails, execute rollback steps immediately.

## Unresolved questions
1. Should rollback revert only cron, or also source adapter immediately on first failure?
2. Who owns weekly draft review SLA before publish?
