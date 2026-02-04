# Phase 04: Related Posts

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: Phase 01 (Blog Post Page)
- **Blocks**: None

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-05 |
| Priority | P2 |
| Status | Pending |
| Estimate | 1.5 hours |

Implement tag-based related posts recommendations displayed at the bottom of blog posts.

## Key Insights (from Research)

1. **MVP Approach**: Tag-based matching sufficient for small catalog
2. **Vector Search**: Deferred - use OpenAI embeddings + Supabase pgvector when catalog grows
3. **UI Pattern**: 3-card grid on desktop, single "Up Next" card on mobile
4. **Recency Weighting**: Prioritize newer posts for weekly news relevance

## Requirements

### Must Have
- Query posts with same tag, exclude current post
- Sort by publishedAt descending
- Display 3 related posts (or fewer if not available)
- Reuse BlogCard component styling

### Nice to Have
- "Because you read [Topic]" context label
- Infinite scroll through related posts
- Cross-tag recommendations when same-tag insufficient

## Architecture

```
RelatedPosts Flow:
1. Server fetches posts where tag = currentPost.tag AND slug != currentPost.slug
2. Limit to 3, sort by -publishedAt
3. Render using BlogCard-like components

Component Structure:
RelatedPosts (Server Component)
├── Section header ("Bài viết liên quan")
└── Grid
    ├── RelatedPostCard × 3
```

## Related Code Files

| File | Purpose |
|------|---------|
| `/src/app/blog/[slug]/page.tsx` | Will include RelatedPosts component |
| `/src/components/blog/BlogCard.tsx` | Reference for card styling |
| `/src/collections/Weekly.ts` | Has `tag` field for matching |

## Implementation Steps

### Step 1: Create RelatedPosts Component
```tsx
// src/components/RelatedPosts.tsx
import { getPayload } from 'payload'
import config from '@payload-config'
import Image from 'next/image'
import Link from 'next/link'
import type { Weekly, Media } from '@/payload-types'

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

  return (
    <section className="mt-16 pt-8 border-t border-border">
      <h2 className="text-xl font-bold mb-6">Bài viết liên quan</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.docs.map((post) => (
          <RelatedPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}

function RelatedPostCard({ post }: { post: Weekly }) {
  const thumbnail = post.thumbnail as Media | undefined

  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article className="space-y-3">
        {thumbnail?.url && (
          <Image
            src={thumbnail.url}
            alt={thumbnail.alt || post.title}
            width={400}
            height={225}
            className="rounded-lg object-cover aspect-video w-full"
          />
        )}
        <h3 className="font-semibold group-hover:underline line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
        </p>
      </article>
    </Link>
  )
}
```

### Step 2: Integrate into Blog Post Page
```tsx
// Update src/app/blog/[slug]/page.tsx
import { RelatedPosts } from '@/components/RelatedPosts'

export default async function BlogPostPage({ params }: Props) {
  // ... existing code ...

  return (
    <main>
      <article>
        {/* ... existing content ... */}
      </article>

      <RelatedPosts currentSlug={post.slug} tag={post.tag} />

      <SubscribeSection />
    </main>
  )
}
```

### Step 3: Mobile Optimization
Add responsive grid classes and consider "Up Next" single-card variant:
```tsx
// Responsive grid already handled by sm:grid-cols-2 lg:grid-cols-3
// For mobile, first card could be styled as "Up Next" with larger prominence
```

## Todo List

- [ ] Create `src/components/RelatedPosts.tsx` with Server Component fetching
- [ ] Create `RelatedPostCard` subcomponent with thumbnail + title + date
- [ ] Add RelatedPosts to blog post page before SubscribeSection
- [ ] Test with posts having same tag
- [ ] Handle case when no related posts exist (return null)
- [ ] Verify performance (should be single Payload query)

## Success Criteria

- [ ] Related posts appear below article content
- [ ] Only posts with same tag shown
- [ ] Current post excluded from recommendations
- [ ] Sorted by newest first
- [ ] Mobile displays responsively (stacked or carousel)
- [ ] Empty state handled gracefully (section hidden)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Not enough posts with same tag | Medium | Low | Section hidden when empty |
| Slow query with many posts | Low | Low | Indexed `tag` field, limit 3 |
| Stale recommendations | Very Low | Low | Revalidation handled by parent page |

## Security Considerations

- Only published posts queried (status filter)
- No user input in query (tag comes from trusted content)

## Next Steps

After completion:
1. Consider vector-based recommendations for larger catalogs
2. Add "Because you read X" contextual label
3. Analytics tracking for recommendation clicks
