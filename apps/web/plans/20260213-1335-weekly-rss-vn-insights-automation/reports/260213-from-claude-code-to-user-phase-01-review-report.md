## Code Review Summary

### Scope
- Files reviewed:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/.env.example`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-01-rss-ingestion-and-generation-core.md`
- Lines of code analyzed: ~370
- Review focus: Phase 01 RSS ingestion robustness/safety + env defaults + behavior preservation
- Updated plans:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/plans/20260213-1335-weekly-rss-vn-insights-automation/phase-01-rss-ingestion-and-generation-core.md`

### Overall Assessment
Phase 01 mostly on target: source switched to AIGC RSS, VN generation + insight still present, Payload slug upsert preserved, env defaults now match requested local Anthropic-compatible settings. Main risk is data integrity and ingest safety around RSS parse/empty-feed handling.

### Critical Issues
1. **Silent fabricated fallback content violates fail-loud requirement**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:256-263`
   - Problem: when RSS parse returns 0 items, script injects sample news and continues generation.
   - Impact: can publish non-source-derived weekly content (trust/reliability breach).
   - Minimal fix:
```ts
if (news.length === 0) {
  throw new Error(`No RSS items parsed from ${RSS_FEED_URL}`)
}
```

### High Priority Findings
1. **RSS parsing is brittle for real-world feed variants**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:79-90`
   - Problem: regex extraction only handles simple `<title>`/CDATA and `<link>`, ignores `description`, `content:encoded`, `guid`, `pubDate`, entity decoding, and namespace variations.
   - Impact: partial/malformed ingestion as feed evolves; reduced robustness promised by plan.
   - Minimal fix (no new dependency, KISS): add tiny helper extractors for fallback tag patterns and basic XML entity decode.

2. **No URL sanity check before prompt injection of links**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:83-88,167-169`
   - Problem: link from feed goes directly into prompt; no protocol validation.
   - Impact: prompt contamination and unsafe/unexpected URL propagation.
   - Minimal fix:
```ts
function safeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : 'https://aigc-weekly.agi.li'
  } catch {
    return 'https://aigc-weekly.agi.li'
  }
}
```

### Medium Priority Improvements
1. **Readability/maintainability: duplicated title regex call**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:82`
   - Minimal fix: compute `const titleMatch = ...` once.

2. **Year hardcoded in VN prompt title**
   - File: `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:172,235`
   - This can drift in future years. Use current year from `getWeekNumber()` path for consistency.

### Low Priority Suggestions
1. Log output has non-ASCII/emojis in script logs; harmless but not ideal for machine log parsing.

### Positive Observations
- Env defaults now exactly match requested local Anthropic-compatible setup:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:95-97`
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/.env.example:30-32`
- VN translation + personal insights behavior retained (separate prompts still present):
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:172-198,204-219`
- Payload upsert + slug dedupe preserved:
  - `/Users/hieudinh/Documents/my-projects/my-portfolio/apps/web/scripts/generate-weekly.ts:287-326`

### Recommended Actions
1. Remove sample fallback and fail loud on zero parsed RSS items.
2. Harden RSS normalization minimally (tag fallback extraction + basic decode + URL protocol allowlist).
3. Keep everything else unchanged (YAGNI): no schema migration, no new parser dependency unless breakage observed.

### Metrics
- Type Coverage: not measured (no coverage tool configured)
- Test Coverage: not measured
- Linting Issues: build surfaced 12 warnings (react-refresh/only-export-components; unrelated to Phase 01 files)
- Typecheck: `pnpm exec tsc --noEmit` passed
- Build: `pnpm run build` passed

### Unresolved questions
1. Stay with lightweight regex parser + hardening now, or switch to dedicated RSS parser library in Phase 01.5?
2. Should empty-feed handling be hard-fail always, or retry once in-script before failing?