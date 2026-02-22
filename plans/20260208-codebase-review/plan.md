# Codebase Review & Improvement Plan

**Date**: 2026-02-08
**Branch**: feat/lovable-ui-migration
**Stack**: Next.js 15 + Payload CMS 3.74 + Cloudflare Workers + Tailwind 4

## Summary

130+ files reviewed across 3 parallel code reviews. 3 critical, 7 high, 11 medium, 4 low issues found.

**Scores** (current → target):
| Area | Score | Target |
|------|-------|--------|
| Security | 40/100 | 90/100 |
| Type Coverage | 95/100 | 98/100 |
| Test Coverage | 0% | 60%+ |
| Accessibility | 40/100 | 80/100 |
| SEO | 85/100 | 95/100 |
| Code Quality | 70/100 | 90/100 |

---

## Phases

### Phase 01 - Critical Security Fixes [BLOCKED - Production Risk]
**Priority**: P0 | **Status**: Pending
→ [phase-01-security.md](./phase-01-security.md)

- Remove `.env` from git tracking (credentials exposed)
- Fix dependency vulnerabilities (@remix-run/router XSS, glob injection)
- Remove hardcoded Payload secret fallback
- Update `.gitignore` with missing entries

### Phase 02 - Legacy Cleanup [HIGH]
**Priority**: P1 | **Status**: Pending
→ [phase-02-legacy-cleanup.md](./phase-02-legacy-cleanup.md)

- Delete legacy Vite app (root src/, dist/, vite.config.ts)
- Fix root package.json metadata
- Remove duplicate dependencies
- Clean up duplicate configs (eslint, tailwind, postcss at root)

### Phase 03 - API Hardening [HIGH]
**Priority**: P1 | **Status**: Pending
→ [phase-03-api-hardening.md](./phase-03-api-hardening.md)

- Add rate limiting to public endpoints
- Improve email validation (/api/subscribe)
- Fix non-atomic listen count updates
- Sanitize error logging (remove stack traces)
- Add request validation with zod

### Phase 04 - Architecture & DX [MEDIUM]
**Priority**: P2 | **Status**: Pending
→ [phase-04-architecture.md](./phase-04-architecture.md)

- Centralize config (SITE_URL, constants)
- Add Supabase connection pooling
- Improve OpenAI retry logic
- Add error boundaries
- Add CI/CD workflows (typecheck, lint, deploy)

### Phase 05 - Accessibility & SEO [MEDIUM]
**Priority**: P2 | **Status**: Pending
→ [phase-05-a11y-seo.md](./phase-05-a11y-seo.md)

- Fix SearchOverlay ARIA/keyboard handling
- Add podcast URLs to sitemap
- Add robots.txt
- Improve structured data (JSON-LD)
- Add keyboard shortcuts to AudioPlayer

### Phase 06 - Testing & Monitoring [LOW]
**Priority**: P3 | **Status**: Pending
→ [phase-06-testing.md](./phase-06-testing.md)

- Set up test framework (Vitest)
- Add unit tests for critical paths
- Add error monitoring (Sentry)
- Add performance monitoring (Web Vitals)

---

## Unresolved Questions

1. Is dark mode planned? If not, remove `next-themes` dependency
2. What rate limit thresholds for `/api/subscribe`?
3. Testing strategy preference: Vitest vs Jest? Playwright for E2E?
4. Error monitoring service choice: Sentry vs LogRocket?
5. Is the podcast RSS feed compliant with Apple/Spotify requirements?
6. Should podcast analytics be real-time or eventually consistent?
7. Deployment pipeline: Does it validate env vars before deploy?
