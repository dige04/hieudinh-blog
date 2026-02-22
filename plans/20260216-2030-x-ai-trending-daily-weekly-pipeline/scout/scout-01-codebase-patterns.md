# Scout Report: Codebase Patterns for X/AI Trending Pipeline

## 1. Existing Pipeline Infrastructure
The codebase already implements a "Fetch -> AI Process -> CMS -> Publish" pipeline for Weekly and Podcast content.

- **Weekly Pipeline**:
  - Script: `apps/web/scripts/generate-weekly.ts` (RSS -> AI -> Payload CMS)
  - API: `apps/web/src/app/api/weekly/generate/route.ts` (Triggered by Cron)
  - CMS: `apps/web/src/collections/Weekly.ts`
  - Cron: `.github/workflows/weekly-cron.yml`

- **Podcast Pipeline (Daily pattern)**:
  - Generator: `apps/web/src/lib/podcast/generator.ts` (HN -> AI -> TTS -> Payload CMS)
  - Client: `apps/web/src/lib/hn/client.ts`
  - CMS: `apps/web/src/collections/Podcast.ts`

## 2. Reusable Patterns
- **External API Clients**: `apps/web/src/lib/hn/` establishes a pattern for typed API clients.
- **AI Integration**: `apps/web/src/lib/podcast/summarizer.ts` and `apps/web/scripts/generate-weekly.ts` show how to prompt Anthropic models via proxy.
- **Cron Security**: `WEEKLY_API_SECRET` header validation in API routes matches GitHub Actions secrets.
- **Scraping**: `FIRECRAWL_API_KEY` is present in `.env.example`, suggesting Firecrawl availability for scraping links found on X.

## 3. Integration Points
- **New Twitter Client**: Create `apps/web/src/lib/x/client.ts` following `hn/client.ts` pattern.
- **Daily Storage**: create `apps/web/src/collections/DailyTrending.ts` (or similar) to store daily fetched tweets/trends.
- **Aggregation**: New script `apps/web/scripts/generate-weekly-digest.ts` to query `DailyTrending` and compile into `Weekly`.

## 4. Gaps & Missing Components
- **Twitter/X API**: No existing integration or env vars (`TWITTER_API_KEY`, etc. missing).
- **Daily Persistence**: No collection for storing raw daily trends before weekly aggregation.
- **Deduplication**: Logic needed to prevent same trending topic appearing multiple days (similar to `apps/web/src/lib/podcast/generator.ts` dedupe logic).
