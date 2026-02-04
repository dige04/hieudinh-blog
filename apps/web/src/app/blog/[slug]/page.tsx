import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

// Force dynamic rendering - D1 database requires runtime
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const post = result.docs[0]

  if (!post) {
    return { title: 'Not Found' }
  }

  return {
    title: `${post.title} | VN AI Weekly`,
    description: post.excerpt,
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const post = result.docs[0]

  if (!post) {
    notFound()
  }

  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <article>
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <span className="px-2 py-1 rounded bg-accent text-accent-foreground">
              {post.tag}
            </span>
            <span>•</span>
            <span>{post.readTime}</span>
            <span>•</span>
            <span>
              {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <h1 className="text-4xl font-bold">{post.title}</h1>
          <p className="text-xl text-muted-foreground mt-4">{post.excerpt}</p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {/* Rich text content will be rendered here */}
          <p className="text-muted-foreground">
            [Content rendering requires Lexical serializer setup]
          </p>
        </div>
      </article>
    </main>
  )
}
