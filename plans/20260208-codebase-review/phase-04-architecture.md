# Phase 04 - Architecture & DX

**Date**: 2026-02-08 | **Priority**: P2 | **Status**: Pending

## Context
- Duplicated config values across files (SITE_URL, tag mappings)
- Missing CI/CD workflows beyond podcast cron
- No error boundaries for graceful degradation
- OpenAI retry logic uses fragile string matching

## Implementation Steps

### 1. Centralize configuration
Create `src/lib/config.ts`:
```typescript
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://hieudinh.com' : 'http://localhost:3000')

export const OPENAI_CONCURRENCY = 2
```

Replace all hardcoded site URL references across:
- `blog/[slug]/page.tsx` (2 occurrences with different defaults)
- `lib/resend.ts`

### 2. Add CI/CD workflows
Create `.github/workflows/ci.yml`:
- TypeScript type checking on PR
- ESLint on PR
- Build validation on PR

### 3. Add error boundaries
Create `src/app/error.tsx` and `src/app/blog/error.tsx` for graceful error handling.

### 4. Improve OpenAI retry logic
**File**: `src/lib/podcast/summarizer.ts:33-43`

Check `error.status` instead of string matching on `error.message`.

### 5. Improve podcast generator concurrency
**File**: `src/lib/podcast/generator.ts:33-40`

Replace custom concurrency control with `p-limit` or `p-queue`.

### 6. Add typecheck script
**File**: `apps/web/package.json`
```json
"scripts": {
  "type-check": "tsc --noEmit"
}
```

## Success Criteria
- [ ] Single source of truth for SITE_URL
- [ ] CI runs typecheck + lint on every PR
- [ ] Runtime errors show fallback UI, not white screen
- [ ] OpenAI retries handle status codes properly
