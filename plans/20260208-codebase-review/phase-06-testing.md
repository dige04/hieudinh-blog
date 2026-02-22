# Phase 06 - Testing & Monitoring

**Date**: 2026-02-08 | **Priority**: P3 | **Status**: Pending

## Context
- 0% test coverage - no test files found
- No error monitoring service
- No performance monitoring
- No health check endpoint

## Implementation Steps

### 1. Set up Vitest
```bash
cd apps/web
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

Add vitest.config.ts, test scripts.

### 2. Add unit tests for critical paths
Priority test targets:
- `/api/subscribe` - email validation, duplicate handling
- `/api/podcast/track` - listen counting
- `subscribers.ts` - add/remove/confirm flows
- `podcast/summarizer.ts` - retry logic
- `podcast/generator.ts` - deduplication logic

### 3. Add error monitoring
Options:
- Sentry (recommended - free tier, Next.js SDK)
- LogRocket (session replay + errors)

### 4. Add Web Vitals tracking
Use `next/web-vitals` or Vercel Analytics equivalent for Cloudflare.

### 5. Add health check endpoint
Create `/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: Date.now() })
}
```

## Success Criteria
- [ ] Test framework configured and running
- [ ] Critical path tests passing
- [ ] Error monitoring capturing production errors
- [ ] Web Vitals baseline established
- [ ] Health check endpoint responding
