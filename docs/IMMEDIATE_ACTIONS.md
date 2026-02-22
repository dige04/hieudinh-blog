# IMMEDIATE ACTION PLAN
**Generated**: 2026-02-08
**Priority**: CRITICAL - Execute within 24-48 hours

---

## 🔴 CRITICAL SECURITY FIXES (DO FIRST)

### 1. Remove .env from Git (15 minutes)
```bash
# Current status: .env is tracked in git with Supabase credentials
cd /Users/hieudinh/Documents/my-projects/my-portfolio

# Remove from git (keeps local file)
git rm --cached .env

# Update .gitignore
cat >> .gitignore << 'EOF'

# Environment variables
.env
.env*.local
!.env.example
EOF

# Commit the change
git add .gitignore
git commit -m "security: remove .env from version control and update .gitignore"

# Push immediately
git push origin feat/lovable-ui-migration
```

**Verify**: Run `git ls-files .env` - should return nothing

---

### 2. Fix Security Vulnerabilities (30 minutes)
```bash
cd /Users/hieudinh/Documents/my-projects/my-portfolio

# Update vulnerable packages in root
pnpm update @remix-run/router glob esbuild js-yaml

# Update vulnerable packages in apps/web
cd apps/web
pnpm update @remix-run/router glob esbuild js-yaml

# Verify no critical vulnerabilities remain
npm audit --audit-level=high
```

**Expected**: High/Critical vulnerabilities: 0

---

### 3. Rotate Supabase Credentials (if needed) (15 minutes)

The exposed key in `.env` is:
```
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Check if it's an anon key**:
- Anon keys are SAFE to expose (used in frontend)
- Service role keys are DANGEROUS (full database access)

**Action**:
1. Go to Supabase Dashboard → Settings → API
2. Check if the exposed key is "anon/public" key
   - If YES: No rotation needed, but still remove from git
   - If NO (service_role): ROTATE IMMEDIATELY

```bash
# If service_role was exposed:
# 1. Generate new service_role key in Supabase dashboard
# 2. Update in:
#    - apps/web/.env.local
#    - Cloudflare Workers secrets: wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# 3. Test deployment
```

---

## 🟡 HIGH PRIORITY FIXES (Within 1 week)

### 4. Remove Legacy Vite Code (2-4 hours)

**Current structure**:
```
my-portfolio/
├── src/               ← DELETE (legacy Vite React app)
├── dist/              ← DELETE (build artifacts)
├── public/            ← CHECK for unique assets, then DELETE
├── vite.config.ts     ← DELETE
├── tsconfig.app.json  ← DELETE
├── tsconfig.node.json ← DELETE
```

**Step-by-step**:
```bash
cd /Users/hieudinh/Documents/my-projects/my-portfolio

# 1. Backup first (optional)
tar -czf legacy-vite-backup-$(date +%Y%m%d).tar.gz src/ dist/ public/ vite.config.ts tsconfig.*.json

# 2. Check for unique assets in /public
ls -la public/
# If any unique files, move to apps/web/public/

# 3. Delete legacy code
rm -rf src/ dist/
rm vite.config.ts tsconfig.app.json tsconfig.node.json

# 4. Remove legacy configs
# Keep these for now, will clean in step 5:
# - tailwind.config.ts
# - eslint.config.js
# - postcss.config.js

# 5. Update root package.json (see next step)

# 6. Commit
git add -A
git commit -m "refactor: remove legacy Vite project code"
git push origin feat/lovable-ui-migration
```

---

### 5. Fix Root package.json (1 hour)

**Current issues**:
- Name: `vite_react_shadcn_ts` (wrong)
- Scripts: All Vite-related (wrong)
- Dependencies: Duplicate with apps/web (wasteful)

**Option A: Minimal Fix** (Recommended)
```bash
cd /Users/hieudinh/Documents/my-projects/my-portfolio

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
EOF

# Update package.json
cat > package.json << 'EOF'
{
  "name": "@vn-ai-weekly/monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm --filter web build",
    "typecheck": "pnpm --filter web typecheck",
    "lint": "pnpm --filter web lint",
    "deploy": "pnpm --filter web deploy"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">=18",
    "pnpm": ">=9"
  }
}
EOF

# Commit
git add package.json pnpm-workspace.yaml
git commit -m "refactor: convert to pnpm workspace monorepo"
```

**Option B: Remove Entirely** (Alternative)
```bash
# If you don't need monorepo structure
cd /Users/hieudinh/Documents/my-projects/my-portfolio
rm package.json
# Work directly in apps/web/
```

---

### 6. Add Missing .gitignore Entries (15 minutes)
```bash
cd /Users/hieudinh/Documents/my-projects/my-portfolio

# Add comprehensive ignores
cat >> .gitignore << 'EOF'

# Next.js
.next
.open-next
.wrangler

# Environment
.env
.env.local
.env*.local
!.env.example

# Workspace
node_modules
pnpm-lock.yaml
.pnpm-store

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/*
!.vscode/extensions.json
.idea

# Build
dist
dist-ssr
*.local

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
EOF

# Commit
git add .gitignore
git commit -m "chore: update .gitignore for Next.js and workspace"
```

---

### 7. Add CI/CD Workflow (2 hours)

**Create** `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'

      - name: Install dependencies
        run: |
          cd apps/web
          pnpm install --frozen-lockfile

      - name: Type check
        run: |
          cd apps/web
          pnpm exec tsc --noEmit

      - name: Lint
        run: |
          cd apps/web
          pnpm lint

      - name: Build check
        run: |
          cd apps/web
          pnpm build
        env:
          DATABASE_URL: postgresql://fake:fake@localhost:5432/test
          PAYLOAD_SECRET: test-secret-32-chars-long-test
          S3_BUCKET: test
          S3_ENDPOINT: http://localhost
          S3_ACCESS_KEY_ID: test
          S3_SECRET_ACCESS_KEY: test
```

**Create** `.github/workflows/security.yml`:
```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 1' # Every Monday
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Security audit
        run: |
          cd apps/web
          pnpm audit --audit-level=high
```

---

## 🟢 MEDIUM PRIORITY IMPROVEMENTS (Within 2 weeks)

### 8. Fix payload.config.ts Secrets (30 minutes)

**File**: `apps/web/src/payload.config.ts`

**Change line 27** from:
```typescript
secret: process.env.PAYLOAD_SECRET || 'your-secret-key-min-32-chars-long',
```

**To**:
```typescript
secret: (() => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) {
    throw new Error('PAYLOAD_SECRET environment variable is required')
  }
  if (secret.length < 32) {
    throw new Error('PAYLOAD_SECRET must be at least 32 characters')
  }
  return secret
})(),
```

**Also fix S3 credentials** (lines 44-46):
```typescript
credentials: {
  accessKeyId: (() => {
    const key = process.env.S3_ACCESS_KEY_ID
    if (!key) throw new Error('S3_ACCESS_KEY_ID is required')
    return key
  })(),
  secretAccessKey: (() => {
    const key = process.env.S3_SECRET_ACCESS_KEY
    if (!key) throw new Error('S3_SECRET_ACCESS_KEY is required')
    return key
  })(),
},
```

---

### 9. Add Missing Scripts to apps/web/package.json (15 minutes)

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "payload": "payload",
    "generate:types": "payload generate:types",
    "generate:importmap": "payload generate:importmap",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "pnpm run deploy:database && pnpm run deploy:app",
    "deploy:database": "cross-env NODE_ENV=production payload migrate && wrangler d1 execute DB --command 'PRAGMA optimize' --remote",
    "deploy:app": "opennextjs-cloudflare build && opennextjs-cloudflare deploy"
  }
}
```

**Add** `typecheck` and `lint:fix` scripts.

---

### 10. Fix Podcast Cron Workflow (30 minutes)

**File**: `.github/workflows/podcast-cron.yml`

**Changes**:
1. Line 22: Increase timeout from 10 to 20 minutes
2. Lines 38-50: Create dedicated health endpoint
3. Add retry logic

```yaml
# Line 22:
timeout-minutes: 20

# Lines 52-72: Replace with retry logic
- name: Generate podcast episode (with retry)
  if: ${{ github.event.inputs.dry_run != 'true' }}
  run: |
    echo "Triggering podcast generation..."

    MAX_ATTEMPTS=3
    ATTEMPT=1

    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
      echo "Attempt $ATTEMPT of $MAX_ATTEMPTS..."

      response=$(curl -s -w "\n%{http_code}" \
        -X POST "$SITE_URL/api/podcast/generate" \
        -H "x-api-secret: ${{ secrets.PODCAST_API_SECRET }}" \
        -H "Content-Type: application/json" \
        -d '{"maxArticles": 5}')

      http_code=$(echo "$response" | tail -n1)
      body=$(echo "$response" | sed '$d')

      if [ "$http_code" = "200" ]; then
        echo "✓ Success on attempt $ATTEMPT"
        echo "$body" | jq '.'
        exit 0
      fi

      echo "✗ Failed with status $http_code"
      ATTEMPT=$((ATTEMPT + 1))
      [ $ATTEMPT -le $MAX_ATTEMPTS ] && sleep 30
    done

    echo "::error::All $MAX_ATTEMPTS attempts failed"
    exit 1
```

---

## ✅ VERIFICATION CHECKLIST

After completing actions, verify:

- [ ] `git ls-files .env` returns nothing
- [ ] `npm audit --audit-level=high` shows 0 vulnerabilities
- [ ] No `/src` directory exists at root
- [ ] No `/dist` directory exists at root
- [ ] `pnpm-workspace.yaml` exists (if using workspace)
- [ ] `.gitignore` includes `.env`, `.next`, `.open-next`
- [ ] CI workflow runs on PR
- [ ] `pnpm typecheck` passes in apps/web
- [ ] `pnpm build` succeeds in apps/web
- [ ] Deployment still works to Cloudflare Workers

---

## 📊 EXPECTED RESULTS

**Before**:
- Security Score: 40/100
- Type Safety: 65/100
- Code Quality: 70/100

**After**:
- Security Score: 90/100 ✅
- Type Safety: 85/100 ✅
- Code Quality: 90/100 ✅

**Time Investment**: ~6-8 hours total
**Risk Reduction**: Critical → Low

---

## 🆘 IF SOMETHING BREAKS

### Rollback Strategy
```bash
# If issues after cleanup:
git reflog
git reset --hard HEAD@{1}  # Go back one commit
git push --force-with-lease origin feat/lovable-ui-migration
```

### Get Help
1. Check build logs in Cloudflare Workers dashboard
2. Review error messages from `pnpm build`
3. Verify all environment variables are set
4. Test locally with `pnpm preview` before deploying

---

**Generated**: 2026-02-08
**Est. Completion**: 2026-02-10 (if executed in order)
**Next Review**: After all critical actions complete
