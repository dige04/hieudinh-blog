# Phase 01 - RSS ingestion and generation core

## Context links
- Parent plan: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/plan.md`
- Dependencies: none
- Docs:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/docs/development-rules.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/docs/code-standards.md`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/phase-1-podcast/reports/260213-aigc-weekly-ingestion-research.md`

## Overview
- Date: 2026-02-13
- Description: swap weekly source from HN API to AIGC Weekly RSS while preserving existing generation + Payload upsert pipeline.
- Priority: P0
- Implementation status: Implemented (requires hardening fixes)
- Review status: Reviewed (changes requested)

## Key Insights
- Current weekly script already does Vietnamese generation + personal insight + Payload upsert.
- Biggest value with minimal blast radius: replace ingestion function only.
- RSS has stable fields; HTML scraping can stay fallback-only.

## Requirements
1. Use `https://aigc-weekly.agi.li/rss.xml` as primary source.
2. Keep translation + insights output behavior in Vietnamese.
3. Keep local AI proxy env:
   - `ANTHROPIC_AUTH_TOKEN=sk-dummy`
   - `ANTHROPIC_BASE_URL=http://127.0.0.1:8317`
   - `ANTHROPIC_DEFAULT_HAIKU_MODEL=gpt-5.3-codex`
4. Preserve existing dedupe/upsert by weekly slug.
5. Avoid schema migration unless explicitly needed.

## Architecture
- Replace source adapter inside existing script:
  - Old: HN API fetch + keyword filter.
  - New: RSS fetch + XML parse + normalize to existing `NewsItem` shape.
- Keep unchanged:
  - `callAI()` endpoint shape (`/v1/messages`)
  - `generateWeeklyContent()` return contract
  - Payload `weekly` upsert block
- Add lightweight fallback chain:
  1) RSS parse
  2) If RSS fails, abort with explicit error (phase-2 API handles retry) OR optional sitemap fallback later.

## Related code files
- Modify: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts`
- Modify: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/.env.example`
- Reference: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/src/collections/Weekly.ts`

## Implementation Steps
1. Extract source config constants for AIGC RSS URL.
2. Replace `fetchHackerNews()` with `fetchAigcWeeklyRss()` returning same internal item shape.
3. Normalize RSS fields: `title`, `link`, `description/content:encoded`, `pubDate`, `guid`.
4. Limit items deterministically (e.g., latest 5) to keep prompt bounded.
5. Update generation prompt to explicitly demand:
   - Vietnamese translation of source highlights
   - practical implications for VN developers
   - concise insight section.
6. Keep `status: draft` default for safe publish workflow.
7. Update `.env.example` comments to include local proxy defaults for weekly generation usage.

## Todo list
- [x] Define RSS parser choice (implemented inline regex parser, no new dependency).
- [ ] Finalize normalization rules for missing fields (description/content/guid/pubDate still not normalized; URL safety checks missing).
- [x] Finalize prompt delta (translation + insights).
- [x] Verify unchanged Payload write contract (slug dedupe + upsert still intact).

## Success Criteria
- Script ingests from AIGC RSS, not HN.
- Generated post includes Vietnamese translated digest + personal insights.
- Existing front-end rendering works without schema changes.

## Risk Assessment
- RSS structure drift -> parser failure.
- Prompt drift -> low-quality/verbose output.
- Missing fields in feed -> degraded summaries.

## Security Considerations
- Keep secrets only in env; never inline tokens.
- No new external write surface introduced in this phase.
- Fail loud on fetch/parse errors, no silent partial ingest.

## Next steps
- Apply Phase 01 hardening patch: robust RSS field normalization for `description/content/guid/pubDate`, safe URL validation, and fail-loud behavior when parsed items are zero.
- Remove hard-coded year in generation title/prompt by deriving year from current date.
- Add timeout + retry policy for RSS and AI fetch calls to reduce hang risk.
- Re-run `pnpm exec tsc --noEmit` and `pnpm run build` after patch.
- Proceed to Phase 02 production enablement only after hardening patch passes.

## Unresolved questions
1. Introduce `rss-parser` dependency vs built-in XML parsing utility already in repo?
2. Should phase-1 include sitemap fallback now or defer to YAGNI?
