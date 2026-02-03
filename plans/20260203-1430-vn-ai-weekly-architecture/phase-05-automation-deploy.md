# Phase 05: Automation & Deployment

## Context
- [Cloudflare Infrastructure Research](./research/researcher-01-cloudflare-infrastructure.md)
- [Phase 04: Agent System](./phase-04-agent-system.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-03 |
| Priority | P1 - Required |
| Status | pending |
| Estimate | 4 hours |
| Depends On | Phase 01, Phase 02, Phase 04 |
| Description | Deploy to Cloudflare, setup cron automation, CI/CD pipeline |

## Key Insights
- OpenNext deploys Next.js + Payload to Workers
- Cron triggers are native in Workers (`wrangler.toml`)
- Containers for heavy agent workloads (scale-to-zero)
- GitHub Actions for CI/CD

## Requirements

### Functional
- Production deployment on Cloudflare
- Weekly cron trigger (Saturdays 6 AM UTC+7)
- Email/Slack notification when draft ready
- One-click publish from admin

### Non-Functional
- Zero-downtime deployments
- <2s TTFB globally
- Rollback capability
- Cost monitoring

## Architecture

```
GitHub Repository
        │
        ▼ (push to main)
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions                                         │
│  1. Build Next.js + Payload                             │
│  2. Deploy to Cloudflare Workers                        │
│  3. Deploy agent container                              │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Cloudflare                                             │
│  ├── Workers (vn-ai-weekly)                             │
│  │   └── Next.js + Payload Admin                        │
│  ├── Cron Trigger (weekly)                              │
│  │   └── Triggers Container                             │
│  └── Container (agent-runtime)                          │
│      └── OpenCode agents                                │
└─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Notifications                                          │
│  ├── Email (Resend)                                     │
│  └── Slack webhook                                      │
└─────────────────────────────────────────────────────────┘
```

## Related Code Files

### New Files
| File | Purpose |
|------|---------|
| `wrangler.toml` | Cloudflare Workers config |
| `.github/workflows/deploy.yml` | CI/CD pipeline |
| `workers/cron-trigger.ts` | Cron handler |
| `scripts/notify.ts` | Notification helper |

## Implementation Steps

### Step 1: Complete Wrangler Configuration

**wrangler.toml** (final):
```toml
name = "vn-ai-weekly"
main = ".open-next/worker.js"
compatibility_date = "2026-01-01"
compatibility_flags = ["nodejs_compat"]

# Production account
account_id = "${CLOUDFLARE_ACCOUNT_ID}"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "vn-ai-weekly-db"
database_id = "${D1_DATABASE_ID}"

# R2 Storage
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "vn-ai-weekly-assets"

# Environment Variables (secrets via wrangler secret)
[vars]
NEXT_PUBLIC_SITE_URL = "https://vn-ai-weekly.pages.dev"

# Cron Triggers
# Every Saturday at 6 AM UTC+7 (23:00 Friday UTC)
[triggers]
crons = ["0 23 * * 5"]

# Routes
[[routes]]
pattern = "vn-ai-weekly.pages.dev/*"
zone_name = "pages.dev"
```

### Step 2: Create Cron Handler

**workers/cron-trigger.ts**:
```typescript
export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('Weekly newsletter generation triggered')

    try {
      // Trigger agent container
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/containers/${env.CONTAINER_ID}/run`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            command: ['node', 'agents/primary.js'],
            env: {
              PAYLOAD_API_URL: env.PAYLOAD_API_URL,
              PAYLOAD_API_KEY: env.PAYLOAD_API_KEY,
              FIRECRAWL_API_KEY: env.FIRECRAWL_API_KEY,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Container trigger failed: ${response.statusText}`)
      }

      console.log('Agent container started successfully')
    } catch (error) {
      console.error('Cron job failed:', error)

      // Send failure notification
      await sendNotification({
        type: 'error',
        message: `Weekly generation failed: ${error}`,
        env,
      })
    }
  },
}

async function sendNotification(opts: {
  type: 'success' | 'error'
  message: string
  env: Env
}) {
  // Slack webhook
  if (opts.env.SLACK_WEBHOOK_URL) {
    await fetch(opts.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `[VN AI Weekly] ${opts.type.toUpperCase()}: ${opts.message}`,
      }),
    })
  }
}
```

### Step 3: Create GitHub Actions Workflow

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  NODE_VERSION: '20'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Payload types
        run: npm run payload generate:types

      - name: Build with OpenNext
        run: npx @opennextjs/cloudflare build

      - name: Run D1 migrations
        run: |
          npx wrangler d1 migrations apply vn-ai-weekly-db --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy to Workers
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

      - name: Deploy agent container
        run: |
          docker build -t vn-ai-weekly-agent -f Dockerfile.agent .
          npx wrangler containers deploy vn-ai-weekly-agent \
            --name agent-runtime
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

  notify:
    needs: deploy
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify on success
        if: needs.deploy.result == 'success'
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "VN AI Weekly deployed successfully!"}'

      - name: Notify on failure
        if: needs.deploy.result == 'failure'
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "VN AI Weekly deployment FAILED!"}'
```

### Step 4: Setup Secrets

```bash
# Cloudflare secrets (production)
wrangler secret put PAYLOAD_SECRET
wrangler secret put PAYLOAD_API_KEY
wrangler secret put FIRECRAWL_API_KEY
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put SLACK_WEBHOOK_URL

# GitHub secrets (for CI/CD)
# Go to repo Settings > Secrets > Actions
# Add: CLOUDFLARE_API_TOKEN, SLACK_WEBHOOK_URL
```

### Step 5: Create Notification Script

**scripts/notify.ts**:
```typescript
interface NotifyOptions {
  title: string
  message: string
  postUrl?: string
  type: 'draft_ready' | 'published' | 'error'
}

export async function notifyDraftReady(postId: string, title: string) {
  const adminUrl = `${process.env.PAYLOAD_API_URL}/admin/collections/weekly/${postId}`

  await notify({
    title: 'Draft Ready for Review',
    message: `"${title}" is ready for review`,
    postUrl: adminUrl,
    type: 'draft_ready',
  })
}

async function notify(opts: NotifyOptions) {
  // Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: opts.title },
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: opts.message },
          },
          ...(opts.postUrl
            ? [
                {
                  type: 'actions',
                  elements: [
                    {
                      type: 'button',
                      text: { type: 'plain_text', text: 'Review Now' },
                      url: opts.postUrl,
                    },
                  ],
                },
              ]
            : []),
        ],
      }),
    })
  }

  // Email via Resend (optional)
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VN AI Weekly <noreply@vn-ai-weekly.pages.dev>',
        to: process.env.NOTIFICATION_EMAIL,
        subject: opts.title,
        html: `<p>${opts.message}</p>${opts.postUrl ? `<a href="${opts.postUrl}">Review Now</a>` : ''}`,
      }),
    })
  }
}
```

### Step 6: First Deployment

```bash
# Build locally first
npm run build
npx @opennextjs/cloudflare build

# Deploy manually for first time
npx wrangler deploy

# Run migrations
npx wrangler d1 migrations apply vn-ai-weekly-db --remote

# Verify deployment
curl https://vn-ai-weekly.pages.dev/api/health

# Check admin panel
open https://vn-ai-weekly.pages.dev/admin
```

### Step 7: Test Cron Trigger

```bash
# Trigger cron manually for testing
curl -X POST https://vn-ai-weekly.pages.dev/__cron \
  -H "X-Cloudflare-Cron-Verification: ${CRON_SECRET}"

# Or use wrangler
wrangler dev --test-scheduled
```

### Step 8: Setup Monitoring

```bash
# Enable Cloudflare analytics
# Dashboard > Workers > vn-ai-weekly > Analytics

# Set up alerts
# Dashboard > Notifications > Create
# - Worker errors > 5
# - Cron job failures
```

## Todo List
- [ ] Finalize `wrangler.toml` with all bindings
- [ ] Create cron handler worker
- [ ] Create GitHub Actions workflow
- [ ] Setup all Cloudflare secrets
- [ ] Setup GitHub repository secrets
- [ ] Create notification script
- [ ] Build and deploy first version
- [ ] Run D1 migrations in production
- [ ] Verify admin panel works
- [ ] Test cron trigger manually
- [ ] Setup Slack webhook
- [ ] Configure monitoring alerts
- [ ] Test full weekly generation flow
- [ ] Document rollback procedure

## Success Criteria
- [ ] Site accessible at production URL
- [ ] Admin panel login works
- [ ] Cron trigger fires on schedule
- [ ] Agent container starts on trigger
- [ ] Draft created in CMS
- [ ] Notification received
- [ ] Human can review and publish
- [ ] Published post visible on public site
- [ ] CI/CD deploys on push to main

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Deploy breaks production | Med | High | Preview deployments, rollback plan |
| Cron timing issues | Low | Low | UTC timezone awareness, logs |
| Secret exposure | Low | Critical | Wrangler secrets, no .env in git |
| D1 migration failures | Med | High | Test locally, backup before migrate |
| Container timeout | Low | Med | Increase timeout, async processing |

## Security Considerations
- All secrets via `wrangler secret`
- GitHub secrets for CI/CD
- Cron endpoint protected by verification header
- Admin panel behind Payload auth
- HTTPS enforced by Cloudflare

## Rollback Procedure

```bash
# List deployments
wrangler deployments list

# Rollback to previous
wrangler rollback --message "Reverting due to X"

# If D1 migration issue
# Restore from backup (manual via dashboard)
```

## Cost Estimate

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Workers Paid | Base | $5.00 |
| D1 | 500MB storage | ~$0.40 |
| R2 | 5GB storage | ~$0.08 |
| Containers | 4 runs/month | ~$0.10 |
| Firecrawl | 100 pages/month | ~$19.00 |
| **Total** | | **~$25/month** |

## Next Steps
After completion:
1. Monitor first automated run
2. Iterate on prompts based on output quality
3. Add more sources to researcher
4. Consider multi-language support (future)
5. Add RSS feed generation
