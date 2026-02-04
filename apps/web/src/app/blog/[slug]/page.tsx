import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import { RichText } from '@/components/RichText'
import { ReadingProgress } from '@/components/ReadingProgress'
import { SocialShare } from '@/components/SocialShare'
import { SubscribeSection } from '@/components/blog/SubscribeSection'
import { BlogPostJsonLd } from '@/components/JsonLd'

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hieudinh.com'
  const url = `${siteUrl}/blog/${slug}`

  return {
    title: `${post.title} | VN AI Weekly`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      url,
      siteName: 'VN AI Weekly',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: url,
    },
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const postUrl = `${siteUrl}/blog/${post.slug}`

  // Get tag label
  const tagLabels: Record<string, string> = {
    'ai-weekly': 'AI Weekly',
    tech: 'Tech',
    tutorial: 'Tutorial',
  }
  const tagLabel = tagLabels[post.tag || 'ai-weekly'] || post.tag

  // Get tag color class
  const tagColors: Record<string, string> = {
    blue: 'bg-tag-blue/10 text-tag-blue',
    green: 'bg-tag-green/10 text-tag-green',
    pink: 'bg-tag-pink/10 text-tag-pink',
    orange: 'bg-tag-orange/10 text-tag-orange',
    purple: 'bg-tag-purple/10 text-tag-purple',
    yellow: 'bg-tag-yellow/10 text-tag-yellow',
  }
  const tagColorClass = tagColors[post.tagColor || 'blue'] || tagColors.blue

  return (
    <>
      <BlogPostJsonLd post={post} url={postUrl} />
      <ReadingProgress />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${tagColorClass}`}>
                {tagLabel}
              </span>
              <span>•</span>
              <span>{post.readTime}</span>
              <span>•</span>
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {post.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-4 leading-relaxed">
              {post.excerpt}
            </p>
          </header>

          {/* Thumbnail */}
          {post.thumbnail && typeof post.thumbnail === 'object' && post.thumbnail.url && (
            <div className="mb-8 -mx-4 md:mx-0">
              <Image
                src={post.thumbnail.url}
                alt={post.thumbnail.alt || post.title}
                width={800}
                height={450}
                className="w-full h-auto rounded-lg md:rounded-xl"
                priority
              />
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-neutral max-w-none prose-headings:font-serif prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-foreground prose-a:underline prose-a:underline-offset-4">
            <RichText content={post.content} />
          </div>

          {/* Personal Insight Section */}
          {post.personalInsight && (
            <aside className="mt-12 p-6 bg-muted/50 rounded-xl border border-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">💭</span>
                Góc nhìn của mình
              </h2>
              <div className="prose prose-neutral max-w-none prose-p:leading-relaxed prose-p:text-muted-foreground">
                <RichText content={post.personalInsight} />
              </div>
            </aside>
          )}

          {/* Social Share */}
          <SocialShare title={post.title} url={postUrl} />
        </article>

        {/* Subscribe Section */}
        <SubscribeSection />
      </main>
    </>
  )
}
