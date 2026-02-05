# Phase 02: Generation Pipeline

**Parent:** [plan.md](./plan.md)
**Dependencies:** [Phase 01](./phase-01-foundation.md)
**Date:** 2026-02-05 | **Priority:** P0 | **Status:** Completed

---

## Overview

Build the core content pipeline: HN fetch -> OpenAI summarize -> TTS synthesis -> Payload save. Expose as API endpoint for manual triggering.

---

## Key Insights

- HN API has no auth/rate limits but requires N+1 calls (list + details)
- Use HTTP/2 parallel requests (batch 20-50 concurrent)
- GPT-4o best for Vietnamese translation quality/cost
- FPT.AI async mode for long text (returns URL, poll for result)
- Limit to 3-5 articles per episode (10-15 min audio)

---

## Requirements

1. Fetch top HN stories with score/comment filtering
2. Summarize each article to Vietnamese (~150-200 words)
3. Compile episode script with intro/outro
4. Convert script to audio via TTS
5. Upload audio to R2 and create Podcast entry
6. API endpoint: `POST /api/podcast/generate`

---

## Architecture

### Pipeline Flow

```
HN API (top 30)
    -> Filter (score > 100, comments > 20)
    -> Dedupe (check existing sources.hnId)
    -> Select top 5
    -> Parallel: Summarize each (OpenAI)
    -> Compile script
    -> TTS synthesis
    -> Upload to Media
    -> Create Podcast entry
```

### HN Client

```typescript
// apps/web/src/lib/hn/client.ts
const HN_API = 'https://hacker-news.firebaseio.com/v0'

export interface HNStory {
  id: number
  title: string
  url?: string
  score: number
  descendants: number  // comment count
  by: string
  time: number
  kids?: number[]  // top-level comment IDs
}

export async function fetchTopStories(limit = 30): Promise<HNStory[]> {
  const ids = await fetch(`${HN_API}/topstories.json`).then(r => r.json())
  const topIds = ids.slice(0, limit)

  // Parallel fetch with concurrency limit
  const stories = await Promise.all(
    topIds.map(id => fetch(`${HN_API}/item/${id}.json`).then(r => r.json()))
  )
  return stories.filter(s => s && s.type === 'story')
}

export async function fetchComments(ids: number[], limit = 3): Promise<string[]> {
  const comments = await Promise.all(
    ids.slice(0, limit).map(id =>
      fetch(`${HN_API}/item/${id}.json`).then(r => r.json())
    )
  )
  return comments.filter(c => c?.text).map(c => c.text)
}
```

### OpenAI Summarizer

```typescript
// apps/web/src/lib/podcast/summarizer.ts
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are a Vietnamese tech journalist for a podcast.
Summarize English articles for Vietnamese listeners.

RULES:
- Write natural, conversational Vietnamese
- Keep technical terms in English (React, LLM, API, etc.)
- 150-200 words per article
- Structure: Hook sentence, 3 key points, closing thought
- No flowery language, focus on engineering value`

export async function summarizeArticle(
  title: string,
  url: string,
  comments: string[]
): Promise<string> {
  const openai = new OpenAI()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Title: ${title}\nURL: ${url}\nTop Comments:\n${comments.join('\n\n')}` }
    ]
  })

  return response.choices[0].message.content || ''
}
```

### Episode Compiler

```typescript
// apps/web/src/lib/podcast/compiler.ts
interface ArticleSummary {
  title: string
  summary: string
  hnId: string
  url: string
}

export function compileScript(summaries: ArticleSummary[], date: Date): string {
  const dateStr = date.toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const intro = `Xin chào! Đây là Tech Digest, bản tin công nghệ ngày ${dateStr}. Hôm nay chúng ta có ${summaries.length} tin đáng chú ý từ Hacker News.`

  const articles = summaries.map((s, i) =>
    `Tin số ${i + 1}: ${s.title}.\n\n${s.summary}`
  ).join('\n\n')

  const outro = `Đó là tất cả cho hôm nay. Cảm ơn bạn đã lắng nghe Tech Digest. Hẹn gặp lại trong bản tin ngày mai!`

  return `${intro}\n\n${articles}\n\n${outro}`
}
```

### Generator Service

```typescript
// apps/web/src/lib/podcast/generator.ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { fetchTopStories, fetchComments } from '../hn/client'
import { summarizeArticle } from './summarizer'
import { compileScript } from './compiler'
import { createTTSProvider } from '../tts'

export async function generateEpisode() {
  const payload = await getPayload({ config })

  // 1. Fetch and filter stories
  const stories = await fetchTopStories(30)
  const filtered = stories.filter(s => s.score > 100 && s.descendants > 20)

  // 2. Dedupe against existing episodes
  const existing = await payload.find({
    collection: 'podcast',
    limit: 100,
    depth: 0,
  })
  const existingIds = new Set(
    existing.docs.flatMap(ep => ep.sources?.map(s => s.hnId) || [])
  )
  const newStories = filtered.filter(s => !existingIds.has(String(s.id))).slice(0, 5)

  if (newStories.length === 0) throw new Error('No new stories to process')

  // 3. Summarize each
  const summaries = await Promise.all(newStories.map(async story => {
    const comments = story.kids ? await fetchComments(story.kids, 3) : []
    const summary = await summarizeArticle(story.title, story.url || '', comments)
    return { title: story.title, summary, hnId: String(story.id), url: story.url || '' }
  }))

  // 4. Compile and synthesize
  const script = compileScript(summaries, new Date())
  const tts = createTTSProvider()
  const audioBuffer = await tts.synthesize(script)

  // 5. Upload audio
  const audioFile = await payload.create({
    collection: 'media',
    data: { alt: `Tech Digest ${new Date().toISOString().split('T')[0]}` },
    file: { data: audioBuffer, mimetype: 'audio/mpeg', name: `episode-${Date.now()}.mp3`, size: audioBuffer.length }
  })

  // 6. Create podcast entry
  const slug = `tech-digest-${new Date().toISOString().split('T')[0]}`
  const episode = await payload.create({
    collection: 'podcast',
    data: {
      title: `Tech Digest - ${new Date().toLocaleDateString('vi-VN')}`,
      slug,
      description: summaries.map(s => s.title).join(' | '),
      audio: audioFile.id,
      sources: summaries.map(s => ({ hnId: s.hnId, title: s.title, url: s.url })),
      publishedAt: new Date().toISOString(),
      status: 'published',
    }
  })

  return episode
}
```

---

## Related Code Files

### Existing (reference)
- `/apps/web/src/app/api/subscribe/route.ts` - API route pattern

### New (create)
- `/apps/web/src/lib/hn/client.ts` - HN API client
- `/apps/web/src/lib/podcast/summarizer.ts` - OpenAI integration
- `/apps/web/src/lib/podcast/compiler.ts` - Script compiler
- `/apps/web/src/lib/podcast/generator.ts` - Main generator
- `/apps/web/src/app/api/podcast/generate/route.ts` - API endpoint

---

## Implementation Steps

1. Create HN client with fetchTopStories and fetchComments
2. Create summarizer with OpenAI integration
3. Create script compiler with intro/outro templates
4. Create generator service orchestrating the pipeline
5. Create API route handler with auth check
6. Test end-to-end with mock TTS
7. Test with real FPT.AI TTS
8. Verify episode appears in Payload admin

---

## Todo

- [x] Create lib/hn/client.ts
- [x] Create lib/podcast/summarizer.ts
- [x] Create lib/podcast/compiler.ts
- [x] Create lib/podcast/generator.ts
- [x] Create api/podcast/generate/route.ts
- [x] Add OPENAI_API_KEY to env
- [x] Test with mock TTS
- [x] Test with real TTS
- [x] Verify full pipeline

---

## Success Criteria

- [x] API endpoint accessible (requires auth)
- [x] Fetches and filters HN stories correctly
- [x] Summaries are quality Vietnamese text
- [x] Audio file uploaded to R2
- [x] Podcast entry created with sources linked
- [x] Episode playable in browser

---

## Completion Notes

- **Date completed:** 2026-02-05
- **Implementation:** All 5 core files created successfully
- **Validation:** TypeScript compilation PASS, Code review APPROVED
- **Improvements:** Applied high-priority fixes including retry logic, fetch timeouts, and parallel summarization


---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| HN API slow/unavailable | Medium | Cache responses, retry logic |
| OpenAI rate limits | Medium | Batch requests, exponential backoff |
| FPT.AI long text timeout | High | Chunk text, use async mode |
| Large audio files | Low | Compress, limit episode length |

---

## Security Considerations

- API endpoint requires authentication (internal only)
- Store API keys in environment variables
- Validate HN response data before processing
- Sanitize text before TTS (remove HTML, special chars)

---

## Next Steps

After completion, proceed to [Phase 03: Automation](./phase-03-automation.md)
