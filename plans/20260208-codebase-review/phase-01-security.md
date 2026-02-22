# Phase 01 - Critical Security Fixes

**Date**: 2026-02-08 | **Priority**: P0 | **Status**: Pending

## Context
- 3 critical security issues found during codebase review
- These MUST be resolved before any production deployment

## Requirements
- [ ] Remove exposed credentials from git history
- [ ] Patch known dependency vulnerabilities
- [ ] Eliminate hardcoded secret fallbacks

## Implementation Steps

### 1. Remove .env from git tracking
```bash
git rm --cached .env
echo ".env" >> .gitignore
```

### 2. Update .gitignore
Add missing entries:
```
.env
.env.local
.next
.open-next
.wrangler
*.sqlite
*.sqlite-shm
*.sqlite-wal
```

### 3. Fix dependency vulnerabilities
```bash
cd apps/web
pnpm update @remix-run/router glob esbuild js-yaml
pnpm audit
```

### 4. Fix payload.config.ts hardcoded secret
**File**: `apps/web/src/payload.config.ts:27`

Replace:
```typescript
secret: process.env.PAYLOAD_SECRET || 'your-secret-key-min-32-chars-long',
```
With:
```typescript
secret: process.env.PAYLOAD_SECRET ?? (() => {
  throw new Error('PAYLOAD_SECRET environment variable is required')
})(),
```

### 5. Fix deploy:database script
**File**: `apps/web/package.json:16`

Remove hardcoded `PAYLOAD_SECRET=ignore` from migration script. Use proper env var injection.

## Success Criteria
- [ ] `git log --all --full-history -- .env` shows removal commit
- [ ] `pnpm audit` returns 0 vulnerabilities
- [ ] App crashes on startup without PAYLOAD_SECRET set
- [ ] .gitignore covers all sensitive/generated files

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Git history still contains secrets | High | Critical | Rotate all exposed credentials |
| Breaking change from dep updates | Low | Medium | Test after updates |
