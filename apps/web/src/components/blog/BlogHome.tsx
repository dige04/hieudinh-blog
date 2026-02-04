'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { BlogCard } from './BlogCard'
import { TagFilter, type Tag } from './TagFilter'
import { SocialLinks } from './SocialLinks'
import { SearchOverlay } from './SearchOverlay'
import { SubscribeSection } from './SubscribeSection'
import type { Weekly } from '@/payload-types'

interface BlogHomeProps {
  posts: Weekly[]
}

const profile = {
  name: 'Hieu Dinh',
  bio: 'Solopreneur | AI Enthusiast',
  social: {
    threads: 'https://threads.net/@to.hieuuu',
    github: 'https://github.com/dige04',
    linkedin: 'https://www.linkedin.com/in/dinhthanhhieu/',
    instagram: 'https://instagram.com/to.hieuuu',
  },
}

const tags: Tag[] = [
  { name: 'All', value: 'all', color: 'default' },
  { name: 'AI & GenAI', value: 'ai-weekly', color: 'green' },
  { name: 'Tech', value: 'tech', color: 'blue' },
  { name: 'Tutorial', value: 'tutorial', color: 'purple' },
]

export function BlogHome({ posts }: BlogHomeProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState('all')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTag = selectedTag === 'all' || post.tag === selectedTag
      return matchesSearch && matchesTag
    })
  }, [posts, searchQuery, selectedTag])

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-8 md:py-12 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/avatar.jpg"
              alt={profile.name}
              width={64}
              height={64}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {profile.name}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground truncate">
                {profile.bio}
              </p>
            </div>
          </Link>
          <SocialLinks links={profile.social} size="sm" />
        </div>

        {/* Search & Categories */}
        <div className="py-4 md:py-6 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-secondary rounded-full transition-colors flex-shrink-0"
              aria-label="Tìm kiếm"
            >
              <Search className="h-5 w-5 stroke-[2.5] text-foreground" />
            </button>
            <div className="flex-1 overflow-x-auto no-scrollbar">
              <TagFilter
                tags={tags}
                selectedTag={selectedTag}
                onTagSelect={setSelectedTag}
              />
            </div>
          </div>
        </div>

        {/* Blog Posts */}
        <div className="py-4 md:py-6">
          {filteredPosts.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {posts.length === 0
                  ? 'Chưa có bài viết nào.'
                  : 'Không tìm thấy bài viết nào.'}
              </p>
              {posts.length === 0 && (
                <p className="text-sm mt-2 text-muted-foreground">
                  <Link href="/admin" className="underline hover:text-foreground">
                    Đăng nhập Admin
                  </Link>{' '}
                  để tạo bài viết đầu tiên.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Subscribe */}
        <SubscribeSection />
      </main>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tags={tags}
        selectedTag={selectedTag}
        onTagSelect={setSelectedTag}
        results={filteredPosts}
      />
    </div>
  )
}
