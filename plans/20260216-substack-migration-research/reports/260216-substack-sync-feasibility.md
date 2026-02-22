# Research Report: Syncing Content Pipeline to Substack

**Date:** 2026-02-16
**Scope:** How to sync an automated content pipeline (HN → OpenAI → Payload CMS) to Substack as distribution channel

## Executive Summary

**Yes, syncing to Substack is feasible via `python-substack` (PyPI, v0.1.17).**

This unofficial library wraps Substack's internal API and supports the full publish lifecycle: create post → upload draft → prepublish → publish. It handles markdown conversion, image uploads, audience targeting, and sections. Last updated Dec 2025, actively maintained.

**What works:** Text posts, markdown content, images (local + remote), audience controls, draft management.
**What doesn't:** Audio/podcast upload — still no programmatic path. Podcast episodes would need to link to externally-hosted audio.

The recommended architecture: keep Payload CMS as canonical source, add a sync step that pushes content to Substack via `python-substack` after each pipeline run.

## Research Methodology
- Sources consulted: 12+
- Date range: 2024–2026
- Key search terms: substack API, python-substack, programmatic publishing, cross-post substack, substack sync

## Key Findings

### 1. `python-substack` — The Working Solution

**PyPI:** https://pypi.org/project/python-substack/
**GitHub:** https://github.com/ma2za/python-substack
**Version:** 0.1.17 (Dec 21, 2025)

| Capability | Supported | Method |
|------------|-----------|--------|
| Create posts | Yes | `Post(title, subtitle, user_id, audience)` |
| Markdown → post | Yes | `post.from_markdown(md_string, api)` |
| Upload draft | Yes | `api.post_draft(draft_data)` |
| Publish live | Yes | `api.prepublish_draft(id)` → `api.publish_draft(id)` |
| Upload images | Yes | `api.get_image(local_path)` + auto-upload from markdown |
| Set audience | Yes | `"everyone"`, `"only_paid"`, `"founding"`, `"only_free"` |
| Sections | Yes | `post.set_section(name, sections)` |
| Embeds | Yes | `api.publication_embed(url)` |
| Upload audio | **No** | Not supported |
| Manage subscribers | **No** | Not in scope |

#### Authentication

Two modes:
1. **Email + Password** — requires manually setting a password in Substack settings (new accounts use magic links by default)
2. **Cookies** — export from browser Network tab, provide as JSON file or string

#### Publishing Flow

```python
from substack import Api, Post

api = Api(email="...", password="...", publication_url="...")
user_id = api.get_user_id()

post = Post(title="Weekly Tech Digest #42", subtitle="...", user_id=user_id)
post.from_markdown(markdown_content, api=api)  # auto-uploads local images

draft = api.post_draft(post.get_draft())
draft_id = draft["id"]

api.prepublish_draft(draft_id)
api.publish_draft(draft_id)
```

#### YAML-based publishing (alternative)

```yaml
title: "Weekly Tech Digest #42"
subtitle: "AI trends, HN highlights"
audience: "everyone"
body:
  - type: paragraph
    text: "This week's top stories..."
  - type: image
    src: "./images/chart.png"
```

### 2. Other Libraries Evaluated

| Library | Publishes Posts? | Notes |
|---------|-----------------|-------|
| **python-substack** (PyPI) | **Yes** | Full lifecycle. Active. Best option |
| `jakub-k-slys/substack-api` (npm) | No (Notes only) | TypeScript. Can create Notes, not articles |
| `substack-api` (PyPI) | No | Read-only. Fetch/search only |
| `Jolie-Ni/medium-to-substack` | No | One-time RSS migration tool |
| `wildan-m/substack-uploader` | No | Uploads subscriber CSVs via Selenium |

### 3. Risks & Limitations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Unofficial API — could break | Medium | Pin version, monitor for changes, keep Payload as source of truth |
| No audio upload | Low | Host audio on S3/R2, embed link in post |
| Cookie auth may expire | Low | Automate cookie refresh or use email/password |
| Rate limiting unknown | Low | Publish 1 post/week — unlikely to hit limits |
| Against Substack ToS? | Low-Medium | No explicit prohibition on API usage; many tools exist |

### 4. Podcast Workaround

Since audio can't be uploaded via API:
- Keep podcast audio on S3/R2 (current setup)
- Embed audio player link in Substack post body
- Or embed via `<audio>` tag if Substack's editor supports it (untested)
- Or link to podcast page on your portfolio site

## Implementation Recommendation

### Architecture: Dual-Publish Pipeline

```
HN API → OpenAI Summarization → Markdown Content
                                       │
                               ┌───────┴───────┐
                               ▼               ▼
                          Payload CMS    python-substack
                          (canonical)    (distribution)
                               │               │
                               ▼               ▼
                          Portfolio Site   Substack Newsletter
                          + Podcast        (text + images only)
```

### Implementation Steps

1. `pip install python-substack`
2. Set up `.env` with Substack credentials
3. Add sync script to pipeline (after Payload CMS publish step):

```typescript
// In generate-weekly.ts, after publishing to Payload:
import { execSync } from 'child_process';

// After content is generated and saved to Payload
const markdownContent = generatedMarkdown; // from pipeline
execSync(`python3 scripts/sync-to-substack.py "${markdownContent}"`, {
  env: { ...process.env }
});
```

4. Create `scripts/sync-to-substack.py`:

```python
import sys
from substack import Api, Post

api = Api(
    email=os.environ["SUBSTACK_EMAIL"],
    password=os.environ["SUBSTACK_PASSWORD"],
    publication_url=os.environ["SUBSTACK_PUB_URL"]
)

user_id = api.get_user_id()
post = Post(
    title=sys.argv[1],  # or parse from content
    subtitle="Weekly AI & Tech Digest",
    user_id=user_id,
    audience="everyone"
)
post.from_markdown(sys.argv[2], api=api)

draft = api.post_draft(post.get_draft())
api.prepublish_draft(draft["id"])
api.publish_draft(draft["id"])
```

5. Add canonical URL back-link in Substack post to your portfolio site

### What This Gives You

- **Payload CMS** remains canonical (portfolio showcase, full pipeline, podcast)
- **Substack** becomes distribution channel (audience discovery, newsletter)
- Pipeline runs once → publishes to both
- Podcast stays self-hosted (link from Substack post)

## Unresolved Questions

1. Does `python-substack` handle rich HTML content (code blocks, tables) correctly via `from_markdown()`?
2. Can Substack posts embed external audio players (e.g., `<audio src="...">`)? Needs testing.
3. Cookie expiration timeline — how often does re-auth need to happen?
4. Does Substack rate-limit or flag automated publishing after N posts?

## Resources

- **python-substack** (PyPI): https://pypi.org/project/python-substack/
- **python-substack** (GitHub): https://github.com/ma2za/python-substack
- **Substack support**: https://support.substack.com
- Ghost Admin API (alternative): https://docs.ghost.org/admin-api/
