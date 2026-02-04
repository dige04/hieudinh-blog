# Tech Digest Podcast - Brainstorm Summary

**Date:** 2026-02-05
**Status:** Approved for implementation

---

## Problem Statement

Create a Vietnamese tech podcast section for the portfolio website that:
- Auto-fetches trending Hacker News articles daily
- Translates and summarizes content to Vietnamese
- Converts to audio via TTS
- Hosts as podcast with RSS feed support

---

## Requirements

| Requirement | Decision |
|-------------|----------|
| Content source | Hacker News API |
| Language flow | English → Vietnamese (translate + summarize) |
| Episode format | Daily digest, 3-5 articles, 10-15 min |
| Automation | Fully automated via Cloudflare cron |
| TTS provider | Pluggable (FPT.AI recommended) |
| Branding | "Tech Digest" / "Bản tin Công nghệ" |

---

## Evaluated Approaches

### Option A: Fork hacker-podcast ❌
- **Pros:** Fastest launch, battle-tested
- **Cons:** Separate codebase, not integrated with Payload CMS
- **Verdict:** Rejected - maintenance burden of two projects

### Option B: Integrated into Portfolio ✅ SELECTED
- **Pros:** Single codebase, leverages existing R2/Payload, unified deployment
- **Cons:** More initial development
- **Verdict:** Best long-term maintainability

### Option C: Hybrid (Stateless Worker + CMS)
- **Pros:** Isolated worker logic
- **Cons:** Two moving parts, more complex
- **Verdict:** Over-engineered for this use case

---

## Architecture

```
Cloudflare Cron (daily 6AM UTC)
         │
         ▼
┌─────────────────────────────────────────┐
│           Generation Pipeline            │
│  HN Fetch → AI Summarize → TTS → Save   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│              Payload CMS                 │
│  Podcast Collection + Media (audio)     │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│               Frontend                   │
│  /podcast + AudioPlayer + RSS feed      │
└─────────────────────────────────────────┘
```

---

## Data Model

### New: `Podcast` Collection

```typescript
// src/collections/Podcast.ts
{
  slug: 'podcast',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
    { name: 'description', type: 'textarea' },      // Vietnamese summary
    { name: 'transcript', type: 'richText' },       // Full Vietnamese script
    { name: 'audio', type: 'upload', relationTo: 'media' },
    { name: 'duration', type: 'number' },           // seconds
    { name: 'sourceUrls', type: 'array', fields: [
      { name: 'url', type: 'text' },
      { name: 'title', type: 'text' },
    ]},
    { name: 'publishedAt', type: 'date' },
    { name: 'status', type: 'select', options: ['draft', 'published'] },
  ]
}
```

### Update: `Media` Collection

```typescript
// src/collections/Media.ts
upload: {
  mimeTypes: ['image/*', 'audio/*'],  // Add audio support
}
```

---

## TTS Provider Abstraction

```typescript
// src/lib/tts/types.ts
export interface TTSProvider {
  name: string;
  synthesize(text: string, options?: TTSOptions): Promise<Buffer>;
}

export interface TTSOptions {
  voice?: string;
  speed?: number;
}
```

**Supported Providers:**
| Provider | Quality | Cost | Notes |
|----------|---------|------|-------|
| FPT.AI | Excellent Vietnamese | ~$0.10/5min | Recommended |
| Viettel AI | Excellent Vietnamese | Similar | Alternative |
| ElevenLabs | Good Vietnamese | Higher | Best emotional range |
| Mock | N/A | Free | Development only |

**Environment Config:**
```env
TTS_PROVIDER=fpt  # fpt | viettel | elevenlabs | mock
TTS_API_KEY=your_api_key_here
TTS_VOICE=banmai  # Provider-specific voice ID
```

---

## Pipeline Flow

### Daily Cron Job

1. **Fetch** - Get top 10 HN stories via API
2. **Filter** - Skip already-processed (check by sourceUrl)
3. **Select** - Pick top 3-5 most interesting
4. **Summarize** - OpenAI GPT-4 translates + summarizes each to ~200 words Vietnamese
5. **Compile** - Create episode script with intro/outro
6. **TTS** - Convert full script to audio
7. **Upload** - Save MP3 to R2 via Payload Media
8. **Publish** - Create Podcast entry with status: 'published'

### Prompt Template (Summarization)

```
You are a Vietnamese tech journalist. Summarize this Hacker News article for a podcast audience.

Rules:
- Write in natural, conversational Vietnamese
- 150-200 words per article
- Focus on: what it is, why it matters, key insight
- Avoid jargon, explain technical terms simply
- End with a thought-provoking question or observation

Article: {title}
Content: {content}
Top Comments: {comments}
```

---

## Frontend Components

### Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/podcast` | PodcastListPage | Episode listing with filters |
| `/podcast/[slug]` | PodcastEpisodePage | Single episode + transcript |
| `/podcast/rss.xml` | RSS Route Handler | Podcast RSS feed |

### AudioPlayer Component

- Persistent player (doesn't reset on navigation)
- Playback speed control (0.5x - 2x)
- Skip 15s forward/back
- Progress bar with time display
- Mini player when scrolled away

---

## RSS Feed

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Tech Digest - Bản tin Công nghệ</title>
    <link>https://hieudinh.com/podcast</link>
    <description>Bản tin công nghệ hàng ngày từ Hacker News</description>
    <language>vi</language>
    <itunes:author>Hieu Dinh</itunes:author>
    <itunes:category text="Technology"/>
    <itunes:image href="https://hieudinh.com/podcast-cover.jpg"/>

    <item>
      <title>Episode Title</title>
      <description>Episode description</description>
      <enclosure url="https://r2.../episode.mp3" length="12345678" type="audio/mpeg"/>
      <pubDate>Wed, 05 Feb 2026 06:00:00 GMT</pubDate>
      <itunes:duration>12:34</itunes:duration>
      <guid>unique-episode-id</guid>
    </item>
  </channel>
</rss>
```

---

## Cost Estimation

| Component | Per Episode | Monthly (30 eps) |
|-----------|-------------|------------------|
| HN API | Free | Free |
| OpenAI GPT-4 (summarize) | $0.05-0.10 | $1.50-3.00 |
| FPT.AI TTS (10 min) | $0.15-0.25 | $4.50-7.50 |
| R2 Storage | Negligible | Free tier |
| **Total** | **~$0.20-0.35** | **~$6-10** |

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create `Podcast` collection in Payload
- [ ] Update `Media` to allow audio uploads
- [ ] Create TTS provider abstraction with mock provider
- [ ] Manual episode creation flow (test data model)

### Phase 2: Generation Pipeline
- [ ] HN API client
- [ ] OpenAI summarization service
- [ ] Integrate real TTS provider (FPT.AI)
- [ ] Worker endpoint: `POST /api/podcast/generate`

### Phase 3: Automation
- [ ] Cloudflare cron trigger
- [ ] Duplicate detection (skip processed articles)
- [ ] Error handling + retry logic
- [ ] Logging/monitoring

### Phase 4: Frontend
- [ ] `/podcast` listing page
- [ ] `/podcast/[slug]` episode page
- [ ] Persistent AudioPlayer component
- [ ] RSS feed route

### Phase 5: Polish
- [ ] Podcast cover art
- [ ] SEO metadata
- [ ] Apple Podcasts / Spotify submission
- [ ] Analytics integration

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| TTS quality inconsistent | Medium | Abstract provider, easy swap |
| HN API rate limits | Low | Cache responses, respect limits |
| Long articles = high TTS cost | Medium | Limit summary to 800 words max |
| Worker timeout (10ms CF limit) | High | Process 1-3 articles per run, queue rest |
| Vietnamese pronunciation errors | Medium | Use FPT.AI (native Vietnamese), test voices |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Episodes published | 1/day (7/week) |
| Audio quality rating | >4/5 listener feedback |
| RSS subscribers | 100+ in first 3 months |
| Average listen duration | >60% of episode |

---

## Next Steps

1. **User:** Add TTS API keys to environment when ready
2. **Implementation:** Start with Phase 1 (data model)
3. **Testing:** Create 2-3 manual test episodes before automation

---

## References

- [hacker-podcast](https://github.com/miantiao-me/hacker-podcast) - Reference implementation
- [FPT.AI TTS](https://fpt.ai/tts) - Recommended Vietnamese TTS
- [Payload CMS Hooks](https://payloadcms.com/docs/hooks) - For automation triggers
- [Apple Podcasts Requirements](https://podcasters.apple.com/support/823-podcast-requirements) - RSS spec
