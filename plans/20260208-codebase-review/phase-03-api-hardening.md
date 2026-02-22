# Phase 03 - API Hardening

**Date**: 2026-02-08 | **Priority**: P1 | **Status**: Pending

## Context
- Public API endpoints lack rate limiting
- Email validation is too basic
- Listen count updates have race conditions
- Error logging exposes stack traces

## Implementation Steps

### 1. Add rate limiting
**Files**: `src/app/api/subscribe/route.ts`, `src/app/api/podcast/track/route.ts`

Options:
- Cloudflare Workers rate limiting (preferred, infra-level)
- `@upstash/ratelimit` with Upstash Redis
- In-memory rate limiter for dev

### 2. Improve email validation
**File**: `src/app/api/subscribe/route.ts:11-16`

Replace basic `includes('@')` check:
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(normalizedEmail)) {
  return NextResponse.json({ error: 'Email khong hop le' }, { status: 400 })
}
```

### 3. Fix atomic listen count
**File**: `src/app/api/podcast/track/route.ts:33-40`

Current read-then-write pattern causes race conditions. Use database-level atomic increment or optimistic locking.

### 4. Sanitize error logging
**Files**: All API routes

Replace `console.error('...', error)` with:
```typescript
console.error('Subscribe error:', error instanceof Error ? error.message : 'Unknown')
```

### 5. Add Supabase connection pooling
**File**: `src/lib/subscribers.ts:3-8`

```typescript
let _supabase: ReturnType<typeof createClient> | null = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabase
}
```

## Success Criteria
- [ ] Rate limiting active on all public POST endpoints
- [ ] Invalid emails rejected (test: `@`, `test@@`, `no-at-sign`)
- [ ] Concurrent listen tracking produces correct counts
- [ ] No stack traces in production logs
- [ ] Supabase client reused across requests
