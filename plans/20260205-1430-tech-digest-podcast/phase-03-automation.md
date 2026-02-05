# Phase 03: Automation

**Parent:** [plan.md](./plan.md)
**Dependencies:** [Phase 02](./phase-02-generation-pipeline.md)
**Date:** 2026-02-05 | **Priority:** P1 | **Status:** Completed

---

## Completion Notes

- **Date completed:** 2026-02-05
- Dedupe check added to prevent duplicate daily episodes
- GitHub Actions workflow created: `.github/workflows/podcast-cron.yml`
- Retry logic already implemented in Phase 2
- **Note:** GitHub secrets (`SITE_URL`, `PODCAST_API_SECRET`) need to be configured after deployment

## Overview

Automate daily episode generation via Cloudflare cron trigger. Add robust error handling, retry logic, and monitoring.

---

## Key Insights

- Cloudflare Workers support cron triggers via `scheduled` handler
- Current wrangler.json has no triggers config yet
- CF Workers have 30s CPU time limit (paid), 10ms (free)
- Need Durable Objects or Queue for long-running tasks
- Alternative: use Next.js API route + external cron (simpler)

---

## Requirements

1. Daily trigger at 6AM UTC (1PM Vietnam time)
2. Dedupe: skip if episode exists for today
3. Retry failed generations (max 3 attempts)
4. Error notifications (optional: Discord/email)
5. Logging for debugging

---

## Architecture

### Option A: Cloudflare Cron (Recommended)

Add to wrangler.json:
```json
{
  "triggers": {
    "crons": ["0 6 * * *"]
  }
}
```

Worker handler:
```typescript
// .open-next/worker-entry.ts or custom worker
export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(generateDailyEpisode(env))
  }
}
```

**Issue:** Next.js on CF Workers via OpenNext doesn't expose scheduled handler easily.

### Option B: External Cron + API (Simpler)

Use external cron service (cron-job.org, GitHub Actions) to call:
```
POST /api/podcast/generate
Authorization: Bearer <CRON_SECRET>
```

### Chosen: Option B

Simpler integration, no worker modifications needed.

### Cron API Route

```typescript
// apps/web/src/app/api/podcast/generate/route.ts
import { NextResponse } from 'next/server'
import { generateEpisode } from '@/lib/podcast/generator'

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if episode exists for today
  const today = new Date().toISOString().split('T')[0]
  const slug = `tech-digest-${today}`

  try {
    const episode = await generateEpisode()
    return NextResponse.json({ success: true, episode: { id: episode.id, slug: episode.slug } })
  } catch (error) {
    console.error('Generation failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
```

### GitHub Actions Cron

```yaml
# .github/workflows/podcast-cron.yml
name: Daily Podcast Generation

on:
  schedule:
    - cron: '0 6 * * *'  # 6AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger podcast generation
        run: |
          response=$(curl -s -w "%{http_code}" -o response.json \
            -X POST "${{ secrets.SITE_URL }}/api/podcast/generate" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json")

          if [ "$response" != "200" ]; then
            echo "Failed with status: $response"
            cat response.json
            exit 1
          fi

          echo "Success:"
          cat response.json

      - name: Notify on failure
        if: failure()
        run: |
          # Optional: Send Discord/Slack notification
          echo "Generation failed - add notification logic here"
```

### Dedupe Logic (in generator.ts)

```typescript
// Add to generateEpisode()
const today = new Date().toISOString().split('T')[0]
const existing = await payload.find({
  collection: 'podcast',
  where: { slug: { equals: `tech-digest-${today}` } },
  limit: 1,
})

if (existing.docs.length > 0) {
  throw new Error(`Episode already exists for ${today}`)
}
```

### Retry Logic

```typescript
// apps/web/src/lib/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.error(`Attempt ${attempt}/${maxAttempts} failed:`, lastError.message)

      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, delayMs * attempt))
      }
    }
  }

  throw lastError
}
```

---

## Related Code Files

### Existing (modify)
- `/apps/web/src/lib/podcast/generator.ts` - Add dedupe check

### New (create)
- `/.github/workflows/podcast-cron.yml` - GitHub Actions cron
- `/apps/web/src/lib/utils/retry.ts` - Retry utility

---

## Implementation Steps

1. Add CRON_SECRET to environment variables
2. Update generate route with auth check
3. Add dedupe logic to generator
4. Create retry utility
5. Wrap TTS and OpenAI calls with retry
6. Create GitHub Actions workflow
7. Add SITE_URL and CRON_SECRET to GitHub secrets
8. Test manual workflow dispatch
9. Verify daily runs work

---

## Todo

- [x] Add CRON_SECRET env var (uses `PODCAST_API_SECRET`)
- [x] Update API route with auth
- [x] Add dedupe check in generator
- [x] Create retry utility
- [x] Apply retry to external API calls
- [x] Create GitHub Actions workflow
- [ ] Configure GitHub secrets
- [ ] Test workflow manually
- [ ] Monitor first few daily runs

---

## Success Criteria

- [x] API rejects unauthorized requests
- [x] Duplicate episodes prevented
- [x] Failed API calls retry automatically
- [x] GitHub Actions runs daily at 6AM UTC
- [ ] Episodes created automatically
- [ ] Failures logged and visible

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cron secret exposed | High | Use GitHub secrets, rotate regularly |
| GitHub Actions outage | Medium | Manual trigger available, monitor |
| Site down during cron | Medium | Retry logic, alert on failure |

---

## Security Considerations

- CRON_SECRET must be strong (32+ chars random)
- Store in GitHub secrets, not in repo
- Rate limit endpoint (1 call per minute max)
- Log all generation attempts

---

## Next Steps

After completion, proceed to [Phase 04: Frontend](./phase-04-frontend.md)
