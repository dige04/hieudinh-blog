# X/AI Trending Daily-to-Weekly Pipeline

**Date**: 2026-02-16 | **Branch**: `feat/x-ai-trending-pipeline`
**Scope**: Full aigc-weekly 5-phase pipeline at daily + weekly frequencies, GPT 5.3 Codex as primary LLM

## Architecture

Both daily and weekly runs execute the full **5-phase pipeline** (Collect -> Curate/Score -> Write/Summarize -> Review -> Store/Publish), adapted from [aigc-weekly](./research/researcher-01-aigc-weekly-architecture.md). Artifact-based recovery: file/doc existence = phase complete.

**Daily Pipeline** (3x/day): Multi-source fetch -> LLM scoring (>=70/100) -> LLM summary -> LLM review -> DailyTrending CMS
**Weekly Pipeline** (Friday): Aggregate 7 days -> LLM re-rank -> LLM write Vietnamese digest -> LLM review loop (max 2) -> Weekly CMS draft

**Model**: GPT 5.3 Codex via existing Anthropic-compatible proxy (`ANTHROPIC_BASE_URL`). Fallback: cheaper model for daily scoring if cost exceeds $30/mo.

## Phases

| # | Phase | File | Status |
|---|-------|------|--------|
| 01 | Multi-Source Client Layer | [phase-01](./phase-01-x-client-multi-source.md) | Planned |
| 02 | Daily Full Pipeline (5-phase) | [phase-02](./phase-02-daily-full-pipeline.md) | Planned |
| 03 | Weekly Full Pipeline (5-phase) | phase-03-weekly-full-pipeline.md | Planned |
| 04 | Monitoring & Hardening | phase-04-monitoring-hardening.md | Planned |

## File Changes

### New Files
| File | Purpose |
|------|---------|
| `src/lib/x/client.ts`, `types.ts` | X API v2 client (list timelines, search) |
| `src/lib/trending/types.ts` | Shared TrendingItem, ScoredItem, CollectionResult |
| `src/lib/trending/sources.ts` | Multi-source parallel fetch orchestrator |
| `src/lib/trending/rss-client.ts` | RSS/ArXiv feed client |
| `src/lib/trending/github-client.ts` | GitHub trending scraper |
| `src/lib/trending/scorer.ts` | LLM scoring matrix (Relevance + Impact + Utility) |
| `src/lib/trending/dedup.ts` | URL normalization + historical dedup |
| `src/lib/trending/reviewer.ts` | LLM review validation |
| `src/lib/trending/llm.ts` | GPT 5.3 Codex wrapper (shared across phases) |
| `src/collections/DailyTrending.ts` | Payload CMS daily snapshot collection |
| `scripts/run-daily-pipeline.ts` | Daily 5-phase pipeline script |
| `scripts/run-weekly-pipeline.ts` | Weekly 5-phase pipeline script |
| `src/app/api/trending/daily/route.ts` | Daily pipeline API trigger |
| `src/app/api/trending/weekly/route.ts` | Weekly pipeline API trigger |
| `.github/workflows/daily-trending.yml` | Cron: 3x/day (08:00, 16:00, 00:00 UTC) |

### Modified Files
| File | Change |
|------|--------|
| `src/payload.config.ts` | Add DailyTrending collection |
| `scripts/generate-weekly.ts` | Replaced by `run-weekly-pipeline.ts` |
| `.env.example` | Add X_BEARER_TOKEN, TRENDING_API_SECRET, OPENAI_API_KEY |
| `.github/workflows/weekly-cron.yml` | Point to new weekly pipeline route |

## Delivery

Sequential: 01 -> 02 -> 03 -> 04. Each independently testable. Phase 01 works without X API key (HN + RSS + ArXiv + GitHub). Phase 02 can test with mock LLM responses.

## Definition of Done

- [ ] Daily pipeline runs 3x/day, stores scored+reviewed items in DailyTrending
- [ ] Weekly pipeline aggregates 7 days, produces Vietnamese draft in Weekly CMS
- [ ] LLM scoring threshold >=70/100 filters low-quality items
- [ ] Historical dedup prevents repeats across 7 daily snapshots + past weeklies
- [ ] Artifact-based recovery: pipeline resumes from last completed phase
- [ ] No regression to existing Podcast pipeline
- [ ] Graceful degradation: any source failure does not crash pipeline
