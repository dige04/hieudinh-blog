# Tech Digest Podcast - Implementation Plan

**Created:** 2026-02-05
**Status:** Ready for Implementation
**Branch:** `feat/tech-digest-podcast`

---

## Overview

Vietnamese tech podcast auto-generated from Hacker News. Daily episodes (10-15 min) with 3-5 translated/summarized articles via TTS.

**Stack:** Next.js 15 + Payload CMS 3.74 + Cloudflare (D1/R2) + FPT.AI TTS

---

## Phases

| # | Phase | Priority | Status | File |
|---|-------|----------|--------|------|
| 1 | Foundation | P0 | Completed | [phase-01-foundation.md](./phase-01-foundation.md) |
| 2 | Generation Pipeline | P0 | Completed | [phase-02-generation-pipeline.md](./phase-02-generation-pipeline.md) |
| 3 | Automation | P1 | Completed | [phase-03-automation.md](./phase-03-automation.md) |
| 4 | Frontend | P1 | Completed | [phase-04-frontend.md](./phase-04-frontend.md) |
| 5 | Polish | P2 | Partially Complete | [phase-05-polish.md](./phase-05-polish.md) |

---

## Key Decisions

- **Architecture:** Integrated into Payload CMS (not separate codebase)
- **TTS:** Pluggable abstraction, FPT.AI default (best Vietnamese quality/cost)
- **Storage:** Reuse existing R2 bucket `vn-ai-weekly-media`
- **Automation:** Cloudflare cron trigger (daily 6AM UTC)
- **Content:** HN top stories -> OpenAI translate/summarize -> TTS

---

## Cost Estimate

| Component | Per Episode | Monthly (30 eps) |
|-----------|-------------|------------------|
| OpenAI GPT-4o | $0.05-0.10 | $1.50-3.00 |
| FPT.AI TTS | $0.15-0.25 | $4.50-7.50 |
| R2 Storage | Free tier | Free tier |
| **Total** | ~$0.25 | ~$7.50 |

---

## Research References

- [TTS APIs Research](./research/researcher-01-tts-apis.md)
- [Content Pipeline Research](./research/researcher-02-content-pipeline.md)
- [Codebase Patterns](./scout/scout-01-codebase-patterns.md)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Episodes/week | 7 (daily) |
| Audio quality | 4+/5 rating |
| RSS subscribers | 100+ (3 months) |
| Listen completion | >60% |

---

## Environment Variables Required

```env
# TTS
TTS_PROVIDER=fpt
TTS_API_KEY=your_fpt_api_key
TTS_VOICE=banmai

# OpenAI (existing)
OPENAI_API_KEY=your_openai_key
```
