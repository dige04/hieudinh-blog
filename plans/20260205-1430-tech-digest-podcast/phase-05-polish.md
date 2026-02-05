# Phase 05: Polish

**Parent:** [plan.md](./plan.md)
**Dependencies:** [Phase 04](./phase-04-frontend.md)
**Date:** 2026-02-05 | **Priority:** P2 | **Status:** Partially Complete

---

## Overview

Final polish: podcast cover art, SEO optimization, podcast directory submission, and analytics integration.

---

## Key Insights

- Apple Podcasts requires 1400x1400 to 3000x3000 cover art (JPEG/PNG)
- Spotify requires RSS feed with proper iTunes tags
- JSON-LD structured data improves SEO
- Analytics via simple page view tracking initially

---

## Requirements

1. Podcast cover art (1400x1400 minimum)
2. Complete SEO metadata + JSON-LD
3. Apple Podcasts submission
4. Spotify for Podcasters submission
5. Basic analytics (listen counts)

---

## Architecture

### Cover Art Specifications

```
Size: 1400x1400 to 3000x3000 pixels (square)
Format: JPEG or PNG
File size: < 500KB recommended
Location: /public/podcast-cover.jpg
```

Design elements:
- "Tech Digest" title
- Vietnamese subtitle: "Ban tin Cong nghe"
- Tech-themed visual (circuit, code, etc.)
- Author name: Hieu Dinh

### JSON-LD for Podcast

```typescript
// apps/web/src/components/podcast/PodcastJsonLd.tsx
interface Episode {
  title: string
  description: string
  slug: string
  publishedAt: string
  audio?: { url: string }
  duration?: number
}

export function PodcastJsonLd({ episode, url }: { episode: Episode; url: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title,
    description: episode.description,
    url,
    datePublished: episode.publishedAt,
    duration: episode.duration ? `PT${Math.floor(episode.duration / 60)}M${episode.duration % 60}S` : undefined,
    associatedMedia: episode.audio?.url ? {
      '@type': 'MediaObject',
      contentUrl: episode.audio.url,
      encodingFormat: 'audio/mpeg',
    } : undefined,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'Tech Digest - Ban tin Cong nghe',
      description: 'Ban tin cong nghe hang ngay tu Hacker News',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

### Enhanced RSS for Directories

Update RSS to include all required tags:

```xml
<itunes:owner>
  <itunes:name>Hieu Dinh</itunes:name>
  <itunes:email>podcast@hieudinh.com</itunes:email>
</itunes:owner>
<itunes:type>episodic</itunes:type>
<itunes:complete>no</itunes:complete>
<itunes:new-feed-url>https://hieudinh.com/podcast/rss.xml</itunes:new-feed-url>
```

Per-episode additions:
```xml
<itunes:title>Episode Title</itunes:title>
<itunes:episode>1</itunes:episode>
<itunes:episodeType>full</itunes:episodeType>
<itunes:summary>Episode summary here</itunes:summary>
```

### Analytics Tracking

Simple approach: track via Payload field update on play.

```typescript
// apps/web/src/lib/podcast/analytics.ts
export async function trackListen(episodeId: string) {
  try {
    await fetch('/api/podcast/track', {
      method: 'POST',
      body: JSON.stringify({ episodeId, event: 'play' }),
    })
  } catch (e) {
    // Silent fail - analytics are non-critical
  }
}

// apps/web/src/app/api/podcast/track/route.ts
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  const { episodeId } = await request.json()
  const payload = await getPayload({ config })

  // Increment play count (add listens field to Podcast collection)
  const episode = await payload.findByID({ collection: 'podcast', id: episodeId })
  await payload.update({
    collection: 'podcast',
    id: episodeId,
    data: { listens: (episode.listens || 0) + 1 },
  })

  return new Response(null, { status: 204 })
}
```

Add to Podcast collection:
```typescript
{ name: 'listens', type: 'number', defaultValue: 0, admin: { position: 'sidebar', readOnly: true } }
```

---

## Podcast Directory Submission

### Apple Podcasts

1. Go to: https://podcasters.apple.com
2. Sign in with Apple ID
3. Submit RSS feed URL: `https://hieudinh.com/podcast/rss.xml`
4. Wait for review (2-5 days)

Requirements checklist:
- [ ] Valid RSS with iTunes namespace
- [ ] Cover art 1400x1400+
- [ ] At least 1 published episode
- [ ] Valid audio enclosure URLs
- [ ] Contact email in itunes:owner

### Spotify for Podcasters

1. Go to: https://podcasters.spotify.com
2. Create account or link Spotify
3. Add podcast via RSS URL
4. Verify ownership (add tag to feed or DNS TXT)
5. Wait for approval (usually same day)

---

## Related Code Files

### Existing (modify)
- `/apps/web/src/collections/Podcast.ts` - Add listens field
- `/apps/web/src/app/podcast/rss.xml/route.ts` - Add missing iTunes tags

### New (create)
- `/public/podcast-cover.jpg` - Cover art
- `/apps/web/src/components/podcast/PodcastJsonLd.tsx`
- `/apps/web/src/lib/podcast/analytics.ts`
- `/apps/web/src/app/api/podcast/track/route.ts`

---

## Implementation Steps

1. Design and export cover art (1400x1400)
2. Add cover art to /public
3. Update Podcast collection with listens field
4. Create analytics tracking endpoint
5. Add PodcastJsonLd component
6. Integrate JSON-LD into episode pages
7. Update RSS with missing iTunes tags
8. Validate RSS with podba.se
9. Submit to Apple Podcasts
10. Submit to Spotify
11. Add Google Podcasts (auto from RSS)

---

## Todo

- [ ] Create podcast cover art (requires design)
- [x] Add listens field to Podcast collection
- [x] Create track API route
- [x] Integrate play tracking in AudioPlayer
- [x] Create PodcastJsonLd component
- [x] Add JSON-LD to episode pages
- [x] Update RSS with all iTunes tags
- [ ] Validate RSS feed (after deployment)
- [ ] Submit to Apple Podcasts (manual)
- [ ] Submit to Spotify (manual)
- [ ] Monitor submissions

---

## Success Criteria

- [ ] Cover art meets Apple specs (1400x1400+)
- [ ] RSS validates on podba.se
- [ ] JSON-LD visible in page source
- [ ] Play events tracked in Payload
- [ ] Apple Podcasts listing approved
- [ ] Spotify listing approved

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Apple rejection | Medium | Follow spec exactly, test first |
| RSS validation fails | Medium | Use podba.se before submit |
| Analytics inflate counts | Low | Debounce tracking calls |

---

## Security Considerations

- Rate limit track endpoint (prevent spam)
- Validate episodeId exists before update
- No PII in analytics

---

## Next Steps

After completion:
- Monitor listener metrics weekly
- Gather feedback on audio quality
- Consider voice improvements (ElevenLabs for intro/outro)
- Add episode comments/feedback feature
