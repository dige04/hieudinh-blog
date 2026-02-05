import { getPayload } from 'payload'
import config from '@payload-config'
import type { Podcast, Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = await getPayload({ config })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hieudinh.com'

  const episodes = await payload.find({
    collection: 'podcast',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 100,
  })

  let episodeNumber = episodes.docs.length

  const items = episodes.docs
    .map((ep) => {
      const audio = typeof ep.audio === 'object' ? (ep.audio as Media) : null
      const audioUrl = audio?.url || ''
      const audioSize = audio?.filesize || 0
      const duration = ep.duration ? formatDuration(ep.duration) : '10:00'
      const epNum = episodeNumber--

      return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${escapeXml(ep.description)}</description>
      <link>${siteUrl}/podcast/${ep.slug}</link>
      <guid isPermaLink="false">${ep.id}</guid>
      <pubDate>${new Date(ep.publishedAt).toUTCString()}</pubDate>
      <enclosure url="${audioUrl}" length="${audioSize}" type="audio/mpeg"/>
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:episode>${epNum}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:summary>${escapeXml(ep.description)}</itunes:summary>
      <itunes:duration>${duration}</itunes:duration>
    </item>`
    })
    .join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Tech Digest - Bản tin Công nghệ</title>
    <link>${siteUrl}/podcast</link>
    <description>Bản tin công nghệ hàng ngày từ Hacker News, bằng tiếng Việt</description>
    <language>vi</language>
    <atom:link href="${siteUrl}/podcast/rss.xml" rel="self" type="application/rss+xml"/>
    <itunes:author>Hieu Dinh</itunes:author>
    <itunes:owner>
      <itunes:name>Hieu Dinh</itunes:name>
      <itunes:email>hi@hieudinh.dev</itunes:email>
    </itunes:owner>
    <itunes:category text="Technology"/>
    <itunes:image href="${siteUrl}/podcast-cover.jpg"/>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:complete>no</itunes:complete>
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}
