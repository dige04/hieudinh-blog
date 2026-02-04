# VN AI Weekly - Complete Features Implementation Plan

**Created**: 2026-02-05
**Status**: Planning
**Stack**: Next.js 15.4 + Payload CMS 3.74 + Supabase PostgreSQL + Cloudflare Workers

## Overview

Complete remaining blog features: Lexical rich text rendering, newsletter subscription with Resend, SEO/OpenGraph, related posts, and draft preview.

## Current State

- Blog list page: done (BlogHome, BlogCard, TagFilter, SearchOverlay)
- Blog post page: scaffold only, no rich text rendering
- Subscribe UI: done, API missing
- SEO: basic metadata only, no OG images or structured data

## Phases

| Phase | Name | Priority | Status | Est. |
|-------|------|----------|--------|------|
| 01 | [Blog Post Page](./phase-01-blog-post-page.md) | P0 | ✅ Done | 3h |
| 02 | [Newsletter Subscription](./phase-02-newsletter-subscription.md) | P0 | ✅ Done | 2h |
| 03 | [SEO & OpenGraph](./phase-03-seo-opengraph.md) | P1 | Pending | 2h |
| 04 | [Related Posts](./phase-04-related-posts.md) | P2 | Pending | 1.5h |
| 05 | [Draft Preview](./phase-05-draft-preview.md) | P2 | Pending | 1.5h |

## Dependencies

```
Phase 01 ─┬─> Phase 03 (SEO needs post page)
          └─> Phase 04 (Related posts on post page)
          └─> Phase 05 (Preview needs post page)
Phase 02 ──── Independent
```

## Key Decisions

1. **Rich Text**: Use `@payloadcms/richtext-lexical/react` RichText component directly (no HTML conversion)
2. **Newsletter**: Resend + Supabase `subscribers` table + double opt-in
3. **OG Images**: Dynamic generation via `opengraph-image.tsx` (Edge Runtime)
4. **Related Posts**: Tag-based matching (MVP), vector search deferred
5. **Reading Progress**: CSS scroll-driven animations with framer-motion fallback

## Files to Create

```
src/
├── app/
│   ├── api/
│   │   ├── subscribe/route.ts          # Phase 02
│   │   ├── confirm/route.ts            # Phase 02
│   │   └── preview/route.ts            # Phase 05
│   ├── blog/
│   │   └── [slug]/
│   │       └── opengraph-image.tsx     # Phase 03
├── components/
│   ├── RichText.tsx                    # Phase 01
│   ├── ReadingProgress.tsx             # Phase 01
│   ├── SocialShare.tsx                 # Phase 01
│   └── RelatedPosts.tsx                # Phase 04
├── lib/
│   ├── resend.ts                       # Phase 02
│   └── subscribers.ts                  # Phase 02
```

## Success Criteria

- [ ] Blog posts render Lexical content with proper styling
- [ ] Newsletter subscription with email confirmation flow
- [ ] Dynamic OG images generated for each post
- [ ] Related posts shown based on tag matching
- [ ] Draft posts viewable via preview mode

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudflare Edge compatibility with Resend | High | Test early, fallback to Cloudflare Email Workers |
| Lexical custom blocks undefined | Medium | Map all block types in converters |
| OG image generation timeout | Low | Keep design simple, cache aggressively |
