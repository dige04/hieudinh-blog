# Phase 04: Frontend

**Parent:** [plan.md](./plan.md)
**Dependencies:** [Phase 02](./phase-02-generation-pipeline.md)
**Date:** 2026-02-05 | **Priority:** P1 | **Status:** Completed

---

## Overview

Build podcast frontend: listing page, episode page, persistent audio player, and RSS feed. Follow existing blog patterns.

---

## Key Insights

- Follow `/blog` page patterns exactly (Server Components + Payload)
- AudioPlayer must persist across navigation (global state)
- RSS feed requires iTunes namespace for podcast apps
- Reuse existing components where possible (RichText, SocialShare)

---

## Requirements

1. `/podcast` - Episode listing with filters
2. `/podcast/[slug]` - Episode detail with player + transcript
3. `/podcast/rss.xml` - Valid podcast RSS feed
4. Persistent AudioPlayer component
5. SEO metadata for all pages

---

## Architecture

### Route Structure

```
apps/web/src/app/podcast/
├── page.tsx           # Listing page
├── [slug]/
│   └── page.tsx       # Episode page
└── rss.xml/
    └── route.ts       # RSS feed handler
```

### Podcast List Page

```typescript
// apps/web/src/app/podcast/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { PodcastHome } from '@/components/podcast/PodcastHome'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tech Digest Podcast | VN AI Weekly',
  description: 'Bản tin công nghệ hàng ngày từ Hacker News, bằng tiếng Việt',
}

export default async function PodcastPage() {
  const payload = await getPayload({ config })

  const episodes = await payload.find({
    collection: 'podcast',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
  })

  return <PodcastHome episodes={episodes.docs} />
}
```

### Episode Detail Page

```typescript
// apps/web/src/app/podcast/[slug]/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PodcastEpisode } from '@/components/podcast/PodcastEpisode'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'podcast',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const episode = result.docs[0]
  if (!episode) return { title: 'Not Found' }

  return {
    title: `${episode.title} | Tech Digest`,
    description: episode.description,
    openGraph: {
      title: episode.title,
      description: episode.description,
      type: 'music.song',  // or article
    },
  }
}

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'podcast',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const episode = result.docs[0]
  if (!episode || episode.status !== 'published') notFound()

  return <PodcastEpisode episode={episode} />
}
```

### AudioPlayer Component

```typescript
// apps/web/src/components/podcast/AudioPlayer.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  title: string
  onTimeUpdate?: (time: number) => void
}

export function AudioPlayer({ src, title, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) audioRef.current.pause()
    else audioRef.current.play()
    setIsPlaying(!isPlaying)
  }

  const skip = (seconds: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime += seconds
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-card border rounded-xl p-4">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => {
          setCurrentTime(audioRef.current?.currentTime || 0)
          onTimeUpdate?.(audioRef.current?.currentTime || 0)
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-4">
        <button onClick={() => skip(-15)} className="p-2 hover:bg-muted rounded">
          <SkipBack className="w-5 h-5" />
        </button>

        <button onClick={togglePlay} className="p-3 bg-primary text-primary-foreground rounded-full">
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>

        <button onClick={() => skip(15)} className="p-2 hover:bg-muted rounded">
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value) }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <select
          value={playbackRate}
          onChange={e => {
            const rate = Number(e.target.value)
            setPlaybackRate(rate)
            if (audioRef.current) audioRef.current.playbackRate = rate
          }}
          className="text-sm bg-muted rounded px-2 py-1"
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>

      <p className="text-sm font-medium mt-2 truncate">{title}</p>
    </div>
  )
}
```

### RSS Feed

```typescript
// apps/web/src/app/podcast/rss.xml/route.ts
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hieudinh.com'

  const episodes = await payload.find({
    collection: 'podcast',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 100,
  })

  const items = episodes.docs.map(ep => {
    const audio = typeof ep.audio === 'object' ? ep.audio : null
    const audioUrl = audio?.url || ''
    const audioSize = audio?.filesize || 0
    const duration = ep.duration ? formatDuration(ep.duration) : '10:00'

    return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description)}</description>
      <link>${siteUrl}/podcast/${ep.slug}</link>
      <guid isPermaLink="false">${ep.id}</guid>
      <pubDate>${new Date(ep.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${audioUrl}" length="${audioSize}" type="audio/mpeg"/>
      <itunes:duration>${duration}</itunes:duration>
    </item>`
  }).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Tech Digest - Ban tin Cong nghe</title>
    <link>${siteUrl}/podcast</link>
    <description>Ban tin cong nghe hang ngay tu Hacker News</description>
    <language>vi</language>
    <itunes:author>Hieu Dinh</itunes:author>
    <itunes:category text="Technology"/>
    <itunes:image href="${siteUrl}/podcast-cover.jpg"/>
    <itunes:explicit>false</itunes:explicit>
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}

function escapeXml(str: string) {
  return str.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c))
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`
}
```

---

## Related Code Files

### Existing (reference)
- `/apps/web/src/app/blog/page.tsx` - List page pattern
- `/apps/web/src/app/blog/[slug]/page.tsx` - Detail page pattern
- `/apps/web/src/components/blog/BlogHome.tsx` - List component

### New (create)
- `/apps/web/src/app/podcast/page.tsx`
- `/apps/web/src/app/podcast/[slug]/page.tsx`
- `/apps/web/src/app/podcast/rss.xml/route.ts`
- `/apps/web/src/components/podcast/PodcastHome.tsx`
- `/apps/web/src/components/podcast/PodcastEpisode.tsx`
- `/apps/web/src/components/podcast/AudioPlayer.tsx`
- `/apps/web/src/components/podcast/EpisodeCard.tsx`

---

## Implementation Steps

1. Create podcast route structure
2. Create PodcastHome component (episode cards)
3. Create EpisodeCard component
4. Create podcast listing page
5. Create AudioPlayer component
6. Create PodcastEpisode component
7. Create episode detail page
8. Create RSS feed route
9. Test RSS with podcast validator
10. Add navigation link to header

---

## Todo

- [x] Create podcast/page.tsx
- [x] Create podcast/[slug]/page.tsx
- [x] Create podcast/rss.xml/route.ts
- [x] Create PodcastHome component
- [x] Create EpisodeCard component
- [x] Create AudioPlayer component
- [x] Create PodcastEpisode component
- [x] Validate RSS feed
- [x] Add podcast to site navigation

---

## Success Criteria

- [x] /podcast shows episode list
- [x] Episode cards link to detail pages
- [x] AudioPlayer works with play/pause/seek
- [x] Playback speed control works
- [x] RSS feed validates (podba.se validator)
- [x] RSS enclosure URLs resolve to audio

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Audio CORS issues | Medium | Ensure R2 CORS config correct |
| RSS validation fails | Medium | Test with multiple validators |
| Player state lost on nav | Medium | Consider global player context |

---

## Security Considerations

- No user input in RSS (XSS via XML injection)
- Audio URLs should be HTTPS only
- Validate audio file types on upload

---

## Next Steps

After completion, proceed to [Phase 05: Polish](./phase-05-polish.md)
