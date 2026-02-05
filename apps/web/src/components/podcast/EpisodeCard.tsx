import Link from 'next/link'
import { Play, Clock, ExternalLink } from 'lucide-react'
import type { Podcast, Media } from '@/payload-types'

interface EpisodeCardProps {
  episode: Podcast
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const coverImage = episode.coverImage as Media | undefined

  return (
    <Link href={`/podcast/${episode.slug}`}>
      <article className="group cursor-pointer py-4 flex gap-4">
        {/* Cover Image / Play Icon */}
        <div className="flex-shrink-0 relative">
          {coverImage?.url ? (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden">
              <img
                src={coverImage.url}
                alt={coverImage.alt || episode.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Play className="w-8 h-8 text-primary" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-base md:text-lg font-semibold text-foreground group-hover:underline transition-colors mb-1 line-clamp-2">
            {episode.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2 hidden sm:block">
            {episode.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{new Date(episode.publishedAt).toLocaleDateString('vi-VN')}</span>
            {episode.duration && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(episode.duration)}
                </span>
              </>
            )}
            {episode.sources && episode.sources.length > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  {episode.sources.length} nguồn
                </span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
