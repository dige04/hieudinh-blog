# Phase 03: SEO & OpenGraph

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: Phase 01 (Blog Post Page)
- **Blocks**: None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-05 |
| Priority | P1 |
| Status | Pending |
| Estimate | 2 hours |

Implement dynamic OpenGraph images, structured data (JSON-LD), and sitemap generation for improved SEO and social sharing.

## Key Insights (from Research)

1. **OG Images**: Use `opengraph-image.tsx` with `next/og` (Edge Runtime, ImageResponse)
2. **Metadata API**: `generateMetadata()` already in place, needs OG extension
3. **Structured Data**: `BlogPosting` schema via `<script type="application/ld+json">`
4. **Sitemap**: Native `sitemap.ts` in Next.js App Router

## Requirements

### Must Have
- Dynamic OG images for each blog post (title + branding)
- JSON-LD structured data for BlogPosting schema
- Dynamic sitemap including all published posts

### Nice to Have
- Twitter card metadata
- BreadcrumbList schema
- Article author schema

## Architecture

```
SEO Implementation:
├── opengraph-image.tsx (dynamic OG image per post)
├── generateMetadata() enhancement (OG properties)
├── JSON-LD component (structured data)
└── sitemap.ts (dynamic sitemap)

OG Image Design:
┌─────────────────────────────────┐
│  VN AI Weekly                   │
│                                 │
│  [Post Title Here]              │
│  ────────────────────           │
│  hieudinh.com                   │
└─────────────────────────────────┘
```

## Related Code Files

| File | Purpose |
|------|---------|
| `/src/app/blog/[slug]/page.tsx` | Has generateMetadata, needs OG extension |
| `/src/collections/Weekly.ts` | Post schema with title, excerpt, thumbnail |

## Implementation Steps

### Step 1: Create OpenGraph Image Route
```tsx
// src/app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'edge'
export const alt = 'VN AI Weekly'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: params.slug } },
    limit: 1,
  })
  const post = result.docs[0]

  return new ImageResponse(
    (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 60,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        width: '100%',
        height: '100%',
      }}>
        <div style={{ color: '#888', fontSize: 24, marginBottom: 20 }}>
          VN AI Weekly
        </div>
        <div style={{ color: '#fff', fontSize: 48, fontWeight: 'bold', lineHeight: 1.2 }}>
          {post?.title || 'Blog Post'}
        </div>
        <div style={{ color: '#666', fontSize: 20, marginTop: 40 }}>
          hieudinh.com
        </div>
      </div>
    ),
    { ...size }
  )
}
```

### Step 2: Enhance generateMetadata
```tsx
// Update src/app/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) return { title: 'Not Found' }

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`

  return {
    title: `${post.title} | VN AI Weekly`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}
```

### Step 3: Create JSON-LD Component
```tsx
// src/components/JsonLd.tsx
export function BlogPostJsonLd({ post, url }: { post: Weekly; url: string }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    url,
    author: {
      '@type': 'Person',
      name: 'Hieu Dinh',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
```

### Step 4: Create Sitemap
```tsx
// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })
  const posts = await payload.find({
    collection: 'weekly',
    where: { status: { equals: 'published' } },
    limit: 1000,
  })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hieudinh.com'

  const postUrls = posts.docs.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    { url: baseUrl, lastModified: new Date(), priority: 1 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), priority: 0.9 },
    ...postUrls,
  ]
}
```

## Todo List

- [ ] Create `src/app/blog/[slug]/opengraph-image.tsx`
- [ ] Update `generateMetadata` with OpenGraph properties
- [ ] Create `src/components/JsonLd.tsx` for structured data
- [ ] Add JsonLd component to blog post page
- [ ] Create `src/app/sitemap.ts`
- [ ] Add `NEXT_PUBLIC_SITE_URL` to environment
- [ ] Test OG images with social debuggers (Facebook, Twitter)
- [ ] Validate JSON-LD with Google's Rich Results Test

## Success Criteria

- [ ] OG image generated dynamically for each post
- [ ] Social share preview shows correct title, description, image
- [ ] JSON-LD validates in Google Rich Results Test
- [ ] Sitemap accessible at /sitemap.xml
- [ ] All published posts included in sitemap

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OG image generation slow | Low | Medium | Keep design simple, no external fonts |
| Edge runtime Payload incompatibility | Medium | High | Test with Cloudflare; may need separate fetch |
| Sitemap too large | Very Low | Low | Paginate if >50k URLs |

## Security Considerations

- No user input in OG images (server-side only)
- Sanitize post titles in JSON-LD (escape special chars)
- Sitemap only includes published posts

## Next Steps

After completion:
1. Submit sitemap to Google Search Console
2. Monitor Core Web Vitals for OG image impact
