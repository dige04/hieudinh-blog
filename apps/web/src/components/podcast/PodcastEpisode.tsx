'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Clock, Calendar, Share2 } from 'lucide-react'
import { AudioPlayer } from './AudioPlayer'
import { PodcastJsonLd } from './PodcastJsonLd'
import type { Podcast, Media } from '@/payload-types'

interface PodcastEpisodeProps {
  episode: Podcast
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PodcastEpisode({ episode }: PodcastEpisodeProps) {
  const audio = episode.audio as Media
  const hasTracked = useRef(false)

  const trackPlay = async () => {
    if (hasTracked.current) return
    hasTracked.current = true
    try {
      await fetch('/api/podcast/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId: episode.id }),
      })
    } catch {
      // Silent fail - analytics are non-critical
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: episode.title,
        text: episode.description,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert('Đã sao chép link!')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PodcastJsonLd
        episode={{
          title: episode.title,
          description: episode.description,
          slug: episode.slug,
          publishedAt: episode.publishedAt,
          audio: audio?.url ? { url: audio.url } : undefined,
          duration: episode.duration,
        }}
      />
      <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/podcast"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        {/* Episode Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{episode.title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {new Date(episode.publishedAt).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            {episode.duration && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {formatDuration(episode.duration)}
              </span>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Chia sẻ
            </button>
          </div>

          <p className="text-muted-foreground">{episode.description}</p>
        </div>

        {/* Audio Player */}
        {audio?.url && (
          <div className="mb-8">
            <AudioPlayer
              src={audio.url}
              title={episode.title}
              onTimeUpdate={(time) => {
                if (time > 10) trackPlay()
              }}
            />
          </div>
        )}

        {/* Sources */}
        {episode.sources && episode.sources.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Nguồn tham khảo</h2>
            <ul className="space-y-3">
              {episode.sources.map((source, index) => (
                <li key={source.id || index}>
                  <a
                    href={source.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground group-hover:underline line-clamp-2">
                        {source.title || 'Untitled'}
                      </p>
                      {source.hnId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Hacker News #{source.hnId}
                        </p>
                      )}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Transcript (if available) */}
        {episode.transcript && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Nội dung</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* RichText would go here - simplified for now */}
              <p className="text-muted-foreground text-sm">
                Nội dung chi tiết của tập podcast...
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="pt-8 border-t border-border">
          <Link
            href="/podcast"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Xem tất cả tập podcast
          </Link>
        </div>
      </main>
    </div>
  )
}
