# Rollback Playbook - Weekly RSS/VN Insights Pipeline

**Date:** 2026-02-13
**Owner:** Hieu Dinh
**Target RTO:** < 15 minutes

---

## When to Trigger Rollback

Trigger rollback if ANY of the following occur:

1. **Validation script fails** - `npx tsx apps/web/scripts/validate-weekly-pipeline.ts` exits with code 1
2. **RSS feed is unavailable** for more than one scheduled run (consecutive Monday failures)
3. **AI proxy returns errors** consistently (generation fails on two consecutive attempts)
4. **Content quality is unacceptable** - generated Vietnamese content is garbled, off-topic, or structurally broken
5. **API endpoint is compromised** - unauthorized access detected or secret leaked
6. **Cron workflow runs unintended generation** - duplicate posts, wrong week number, or published instead of draft

---

## Rollback Levels

### Level 1: Disable Cron (Immediate, < 2 minutes)

Stops all automated runs. Manual generation via CLI remains available.

```bash
# Option A: Disable via GitHub UI
# 1. Go to: https://github.com/<owner>/<repo>/actions/workflows/weekly-cron.yml
# 2. Click the "..." menu (top right)
# 3. Click "Disable workflow"

# Option B: Disable by commenting out the schedule trigger
# Edit .github/workflows/weekly-cron.yml
# Change:
#   on:
#     schedule:
#       - cron: '0 6 * * 1'
# To:
#   on:
#     # schedule:
#     #   - cron: '0 6 * * 1'
#     workflow_dispatch:  # keep manual trigger
```

Verify cron is disabled:

```bash
gh workflow list --repo <owner>/<repo>
# The "Weekly Generation" workflow should show as "disabled_manually"
```

### Level 2: Disable API Endpoint (< 5 minutes)

Prevents any remote trigger of the generation pipeline.

```bash
# Remove or rotate the WEEKLY_API_SECRET in production environment
# For Cloudflare:
wrangler secret delete WEEKLY_API_SECRET

# Or rotate to a new value:
wrangler secret put WEEKLY_API_SECRET
# Enter a new random value: openssl rand -hex 32
```

Verify the endpoint rejects all requests:

```bash
# Should return 500 with API_NOT_CONFIGURED
curl -s -X POST https://<site-url>/api/weekly/generate \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

### Level 3: Revert to Manual Script Path (< 10 minutes)

Fall back to running the generation script locally via CLI.

```bash
# 1. Ensure local .env.local has the required vars:
#    ANTHROPIC_AUTH_TOKEN=<your-token>
#    ANTHROPIC_BASE_URL=http://127.0.0.1:8317
#    ANTHROPIC_DEFAULT_HAIKU_MODEL=gpt-5.3-codex

# 2. Start the AI proxy locally (if using local proxy)
# (proxy-specific startup command here)

# 3. Run the generation script directly:
cd apps/web
npx tsx scripts/generate-weekly.ts

# 4. Check the Payload CMS admin panel for the new draft
#    URL: http://localhost:3000/admin/collections/weekly
```

### Level 4: Remove Generated Content (< 5 minutes)

If bad content was generated and needs to be removed.

```bash
# Via Payload CMS Admin:
# 1. Go to /admin/collections/weekly
# 2. Find the post by slug (format: YYYY-wNN, e.g., 2026-w07)
# 3. Delete or revert to previous version

# Via Payload Local API (if admin is inaccessible):
# This requires running a script in the project context
npx tsx -e "
import { getPayload } from 'payload';
import config from './src/payload.config';

const payload = await getPayload({ config });
const result = await payload.find({
  collection: 'weekly',
  where: { slug: { equals: '2026-w07' } },  // adjust week
  limit: 1,
});
if (result.docs.length > 0) {
  await payload.delete({ collection: 'weekly', id: result.docs[0].id });
  console.log('Deleted:', result.docs[0].slug);
} else {
  console.log('No matching document found');
}
process.exit(0);
"
```

---

## Rollback Decision Matrix

| Symptom | Level | Action |
|---------|-------|--------|
| RSS feed returns non-200 | 1 | Disable cron, wait for feed recovery |
| AI proxy timeout / error | 1 | Disable cron, check proxy status |
| Generated content is garbled | 1 + 4 | Disable cron, delete bad content |
| API secret leaked | 2 | Rotate secret immediately |
| Duplicate posts created | 1 + 4 | Disable cron, delete duplicates |
| Content published instead of draft | 4 | Unpublish, investigate status field |
| Complete pipeline failure | 1 + 2 + 3 | Full revert to manual path |

---

## Pre-Rollback Verification

Before re-enabling the pipeline after a rollback, run the full validation:

```bash
cd apps/web

# Run the validation script
npx tsx scripts/validate-weekly-pipeline.ts --verbose

# If API checks are needed, start the dev server first:
# Terminal 1:
pnpm dev

# Terminal 2:
npx tsx scripts/validate-weekly-pipeline.ts --verbose
```

The validation script enforces a **go/no-go gate**:
- Exit code 0 = GO (all checks pass, safe to re-enable)
- Exit code 1 = NO-GO (failures exist, do not re-enable)

---

## Re-Enable Procedure

Only proceed after the validation script returns GO.

```bash
# 1. Re-enable the workflow
gh workflow enable weekly-cron.yml --repo <owner>/<repo>

# 2. Run a dry-run first
gh workflow run weekly-cron.yml --repo <owner>/<repo> -f dry_run=true

# 3. Verify dry-run succeeded
gh run list --workflow=weekly-cron.yml --repo <owner>/<repo> --limit 1

# 4. If dry-run passed, wait for next scheduled Monday run
#    OR trigger a manual live run:
gh workflow run weekly-cron.yml --repo <owner>/<repo> -f dry_run=false

# 5. Verify the generated content in Payload CMS admin
#    - Check status is "draft"
#    - Check content is Vietnamese
#    - Check insight section exists
#    - Check links are valid
```

---

## Contacts and Escalation

| Role | Contact | When |
|------|---------|------|
| Pipeline owner | Hieu Dinh | Any failure |
| Infrastructure | (same) | Proxy/deployment issues |

---

## Post-Incident Review Template

After any rollback, document:

1. **Trigger:** What caused the rollback?
2. **Detection:** How was it detected? (cron failure, manual review, validation script)
3. **Response:** Which rollback level was executed?
4. **Resolution:** What fixed the root cause?
5. **Prevention:** What changes prevent recurrence?
6. **Duration:** Time from detection to resolution
