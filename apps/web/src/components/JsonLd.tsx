import type { Weekly } from '@/payload-types'

interface Props {
  post: Weekly
  url: string
}

export function BlogPostJsonLd({ post, url }: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    author: {
      '@type': 'Person',
      name: 'Hieu Dinh',
      url: 'https://hieudinh.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'VN AI Weekly',
      url: 'https://hieudinh.com',
    },
    ...(post.thumbnail && typeof post.thumbnail === 'object' && post.thumbnail.url
      ? {
          image: {
            '@type': 'ImageObject',
            url: post.thumbnail.url,
          },
        }
      : {}),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
