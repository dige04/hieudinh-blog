import Link from 'next/link'
import type { Weekly, Media } from '@/payload-types'
import Image from 'next/image'

interface BlogCardProps {
  post: Weekly
}

export function BlogCard({ post }: BlogCardProps) {
  const thumbnail = post.thumbnail as Media | undefined

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group cursor-pointer py-4 flex gap-4">
        {/* Thumbnail - Left side, horizontal & rounded */}
        <div className="flex-shrink-0">
          {thumbnail?.url ? (
            <Image
              src={thumbnail.url}
              alt={thumbnail.alt || post.title}
              width={160}
              height={112}
              className="w-28 h-20 md:w-40 md:h-28 object-cover rounded-lg"
            />
          ) : (
            <div className="w-28 h-20 md:w-40 md:h-28 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h2 className="text-base md:text-lg font-semibold text-foreground group-hover:underline transition-colors mb-1 md:mb-2 line-clamp-2">
            {post.title}
          </h2>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-2 hidden sm:block">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
            </span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
