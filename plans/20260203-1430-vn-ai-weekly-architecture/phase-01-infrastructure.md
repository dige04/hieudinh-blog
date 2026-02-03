# Phase 01: Infrastructure Setup

## Context
- [Main Plan](./plan.md)
- Uses existing Supabase (via Lovable) + GCP credits

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-03 |
| Priority | P0 - Critical Path |
| Status | in_progress |
| Estimate | 2 hours |
| Description | Setup Supabase, GCP Cloud Run, and Cloudflare Pages infrastructure |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Supabase (Lovable - existing)                              │
│  ├── PostgreSQL Database                                    │
│  └── Supabase Storage (media)                               │
│                                                              │
│  Google Cloud Platform (credits)                            │
│  ├── Cloud Run (agent container)                            │
│  ├── Cloud Scheduler (weekly cron)                          │
│  ├── Artifact Registry (Docker images)                      │
│  └── Secret Manager (API keys)                              │
│                                                              │
│  Cloudflare (free tier)                                     │
│  └── Pages (Next.js frontend)                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Verify Supabase Access
```bash
# Get Supabase project URL and keys from Lovable dashboard
# You should already have:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - Database connection string
```

### Step 2: GCP Project Setup
```bash
# Install gcloud CLI if not installed
# brew install google-cloud-sdk

# Login to GCP
gcloud auth login

# Create or select project
gcloud projects create vn-ai-weekly --name="VN AI Weekly"
# OR use existing project
gcloud config set project <your-project-id>

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

### Step 3: Create Artifact Registry
```bash
# Create Docker repository for agent container
gcloud artifacts repositories create vn-ai-weekly \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="VN AI Weekly agent images"
```

### Step 4: Setup Secret Manager
```bash
# Store API keys securely
gcloud secrets create anthropic-api-key --replication-policy="automatic"
echo -n "your-anthropic-key" | gcloud secrets versions add anthropic-api-key --data-file=-

gcloud secrets create openai-api-key --replication-policy="automatic"
echo -n "your-openai-key" | gcloud secrets versions add openai-api-key --data-file=-

gcloud secrets create supabase-url --replication-policy="automatic"
echo -n "your-supabase-url" | gcloud secrets versions add supabase-url --data-file=-

gcloud secrets create supabase-service-key --replication-policy="automatic"
echo -n "your-supabase-service-key" | gcloud secrets versions add supabase-service-key --data-file=-
```

### Step 5: Cloudflare Pages Setup
```bash
# Install Wrangler if not installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Pages project will be created in Phase 02 when we have Next.js app
```

### Step 6: Create Environment File
Create `.env.local` (gitignored) for local development:
```env
# Supabase (from Lovable)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# Payload CMS
PAYLOAD_SECRET=<generate-32-char-random>

# AI Models (your API keys)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Firecrawl (free tier)
FIRECRAWL_API_KEY=fc-...
```

## Todo List
- [ ] Verify Supabase credentials from Lovable
- [ ] Setup GCP project (or use existing)
- [ ] Enable GCP APIs
- [ ] Create Artifact Registry
- [ ] Store secrets in Secret Manager
- [ ] Login to Cloudflare (wrangler)
- [ ] Create `.env.local` for local dev
- [ ] Get Firecrawl API key (free tier)

## Success Criteria
- [ ] `gcloud auth list` shows authenticated account
- [ ] `gcloud services list` shows required APIs enabled
- [ ] Secrets stored in GCP Secret Manager
- [ ] `wrangler whoami` shows Cloudflare account
- [ ] `.env.local` has all required keys
- [ ] Supabase connection verified

## Security Considerations
- Never commit `.env.local` or secrets
- Use GCP Secret Manager for production secrets
- Supabase service role key is sensitive - protect it
- Enable 2FA on all accounts (GCP, Cloudflare, Supabase)

## Next Steps
After completion → [Phase 02: Next.js + Payload CMS](./phase-02-nextjs-payload.md)
