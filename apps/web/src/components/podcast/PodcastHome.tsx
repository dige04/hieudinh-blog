'use client'

import { useState, useMemo } from 'react'
import { Search, Podcast, Rss } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { EpisodeCard } from './EpisodeCard'
import type { Podcast as PodcastType } from '@/payload-types'

interface PodcastHomeProps {
  episodes: PodcastType[]
}

const profile = {
  name: 'Tech Digest',
  bio: 'Bản tin công nghệ hàng ngày từ Hacker News',
}

export function PodcastHome({ episodes }: PodcastHomeProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEpisodes = useMemo(() => {
    if (!searchQuery) return episodes
    return episodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [episodes, searchQuery])

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-8 md:py-12 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Podcast className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">{profile.name}</h1>
              <p className="text-sm md:text-base text-muted-foreground truncate">{profile.bio}</p>
            </div>
          </Link>

          {/* RSS Link */}
          <a
            href="/podcast/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Rss className="w-4 h-4" />
            RSS Feed
          </a>
        </div>

        {/* Search */}
        <div className="py-4 md:py-6 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm tập podcast..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted rounded-lg border-0 focus:ring-1 focus:ring-primary text-sm"
            />
          </div>
        </div>

        {/* Episode List */}
        <div className="py-4 md:py-6">
          {filteredEpisodes.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredEpisodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {episodes.length === 0
                  ? 'Chưa có tập podcast nào.'
                  : 'Không tìm thấy tập podcast nào.'}
              </p>
              {episodes.length === 0 && (
                <p className="text-sm mt-2 text-muted-foreground">
                  Podcast sẽ được tự động tạo hàng ngày từ tin tức Hacker News.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Subscribe CTA */}
        <div className="py-8 border-t border-border">
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">Theo dõi Tech Digest</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Thêm RSS feed vào ứng dụng podcast yêu thích của bạn
            </p>
            <a
              href="/podcast/rss.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              <Rss className="w-4 h-4" />
              Lấy RSS Feed
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
