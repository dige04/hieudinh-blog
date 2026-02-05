interface Episode {
  title: string
  description: string
  slug: string
  publishedAt: string
  audio?: { url: string }
  duration?: number | null
}

interface PodcastJsonLdProps {
  episode: Episode
  siteUrl?: string
}

export function PodcastJsonLd({ episode, siteUrl = 'https://hieudinh.com' }: PodcastJsonLdProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `PT${m}M${s}S`
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    name: episode.title,
    description: episode.description,
    url: `${siteUrl}/podcast/${episode.slug}`,
    datePublished: episode.publishedAt,
    duration: episode.duration ? formatDuration(episode.duration) : undefined,
    associatedMedia: episode.audio?.url
      ? {
          '@type': 'MediaObject',
          contentUrl: episode.audio.url,
          encodingFormat: 'audio/mpeg',
        }
      : undefined,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'Tech Digest - Bản tin Công nghệ',
      description: 'Bản tin công nghệ hàng ngày từ Hacker News, bằng tiếng Việt',
      url: `${siteUrl}/podcast`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
