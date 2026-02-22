# Research Report: Substack Pipeline Integration Feasibility

**Date:** 2026-02-16
**Scope:** Can an automated content pipeline (HN → OpenAI → TTS) publish to Substack programmatically?

## Executive Summary

**No. Substack has no public API for publishing content or uploading audio.**

Substack's own platform config explicitly disables `developer_api_enabled` and `publisher_api_enabled`. The only community library (`substack-api` on PyPI) is read-only. No workarounds exist for automated publishing — no email-to-publish, no RSS auto-import, no webhook triggers.

If the user wants pipeline-to-newsletter automation, **Ghost** or **Buttondown** are the viable alternatives. Ghost is the strongest match (full Admin API, self-hostable, podcast support).

## Key Findings

### 1. Substack API: Does Not Exist (for Publishing)

| Capability | Status | Evidence |
|------------|--------|----------|
| Public API for creating posts | **No** | Platform config: `developer_api_enabled: false`, `publisher_api_enabled: false` |
| Audio/podcast upload via API | **No** | Podcast upload is manual-only through web UI |
| RSS auto-import for publishing | **No** | RSS verification code exists but for feed validation, not ingest |
| Email-to-publish | **No** | Not a Substack feature |
| Unofficial publish API | **No** | `substack-api` (PyPI v1.1.3) is read-only: fetch posts, metadata, search. No write endpoints |

### 2. Substack Podcast Features

- Manual audio upload through web dashboard only
- Apple Podcast auto-publish flag exists but disabled by default
- No programmatic audio ingestion path
- No external podcast RSS import for auto-publishing episodes

### 3. Reverse-Engineering Internal API

Technically possible (Substack's frontend makes API calls) but:
- Against Substack Terms of Service
- Fragile — endpoints change without notice
- Requires session cookie authentication (manual browser login)
- No community-maintained write client exists
- **Not recommended**

### 4. Alternatives with Real APIs

| Platform | Publish API | Audio Upload | Self-Host | Newsletter | Podcast |
|----------|-------------|-------------|-----------|------------|---------|
| **Ghost** | Full Admin API (CRUD posts, pages, images) | Yes (via `/images/` upload) | Yes | Yes (built-in) | Via embeds |
| **Buttondown** | REST API (create emails, manage subscribers) | No native audio | No (SaaS) | Yes | No |
| **Beehiiv** | API available | Limited | No (SaaS) | Yes | No |
| **Current (Payload CMS)** | Full control | Yes (S3/R2) | Yes (CF Workers) | Yes (Resend) | Yes (FPT TTS) |

## Comparative Analysis

### Your Current Stack vs. Substack vs. Ghost

```
                  Current (Payload)    Substack         Ghost
Pipeline API      Full control         None             Full Admin API
Podcast/Audio     FPT TTS → S3         Manual upload    Upload via API
Newsletter        Resend + Supabase    Built-in         Built-in (Mailgun)
Audience Network  None                 Yes (discovery)  No
Hosting           Cloudflare Workers   Managed          Self-host or Pro
Cost              ~$0 (CF free tier)   Free/$+)         Free self / $9+ Pro
Portfolio Value   High                 None             Medium
```

### Verdict by Goal

| Goal | Best Choice |
|------|-------------|
| Keep pipeline automation | Stay on Payload CMS (current) |
| Pipeline + better newsletter | Migrate to Ghost |
| Audience discovery only | Cross-post to Substack manually or via Zapier |
| Zero maintenance | Substack (but lose pipeline entirely) |

## Implementation Recommendations

### Option A: Stay Current (Recommended)
Keep Payload CMS. Add cross-posting to Substack as distribution:
- Generate post via pipeline → publish to Payload
- Manually copy/paste to Substack (or use Zapier with RSS)
- Maintain canonical URL on your domain

### Option B: Migrate to Ghost
If you want a more "newsletter-native" platform with API:
1. Self-host Ghost (Docker) or use Ghost Pro ($9/mo)
2. Adapt pipeline to use Ghost Admin API (`POST /posts/`, `POST /images/upload/`)
3. Ghost handles newsletter delivery (Mailgun integration)
4. Lose: Payload CMS flexibility, Cloudflare Workers deployment
5. Gain: Better newsletter UX, member management, built-in analytics

### Option C: Hybrid Ghost + Substack
- Ghost as primary CMS (API-driven pipeline)
- Auto-cross-post to Substack via RSS (manual or Zapier)
- Best of both: automation + Substack discovery network

## Unresolved Questions

1. Does Ghost's image upload endpoint support audio files (MP3), or would a separate storage (S3/R2) still be needed for podcast episodes?
2. Beehiiv API docs were inaccessible — may have improved podcast/audio support since last check
3. Substack has hinted at "developer tools" in config flags — could launch a public API in future (no timeline)

## Resources

- PyPI `substack-api`: https://pypi.org/project/substack-api/ (read-only)
- Ghost Admin API: https://docs.ghost.org/admin-api/
- Buttondown API: https://docs.buttondown.com/api-introduction
