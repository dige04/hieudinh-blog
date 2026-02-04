import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

interface Props {
  currentSlug: string
  tag: string
}

export async function RelatedPosts({ currentSlug, tag }: Props) {
  const payload = await getPayload({ config })

  const related = await payload.find({
    collection: 'weekly',
    where: {
      and: [
        { tag: { equals: tag } },
        { slug: { not_equals: currentSlug } },
        { status: { equals: 'published' } },
      ],
    },
    sort: '-publishedAt',
    limit: 3,
  })

  if (related.docs.length === 0) return null

  const tagLabels: Record<string, string> = {
    'ai-weekly': 'AI Weekly',
    tech: 'Tech',
    tutorial: 'Tutorial',
  }

  return (
    <section className="mt-16 pt-8 border-t border-border">
      <h2 className="text-xl font-bold mb-6">Bài viết liên quan</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.docs.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group block p-4 rounded-xl border border-border hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <span className="px-2 py-0.5 rounded-full bg-muted">
                {tagLabels[post.tag || 'ai-weekly'] || post.tag}
              </span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>
            <h3 className="font-semibold group-hover:text-foreground/80 transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {post.excerpt}
            </p>
            <time
              dateTime={post.publishedAt}
              className="text-xs text-muted-foreground/60 mt-3 block"
            >
              {new Date(post.publishedAt).toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </time>
          </Link>
        ))}
      </div>
    </section>
  )
}
