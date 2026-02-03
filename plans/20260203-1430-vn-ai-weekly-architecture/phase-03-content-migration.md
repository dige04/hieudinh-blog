# Phase 03: Content Migration

## Context
- [Current Codebase Scout](./scout/scout-01-current-codebase.md)
- [Phase 02: Next.js + Payload](./phase-02-nextjs-payload.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-03 |
| Priority | P1 - Required |
| Status | pending |
| Estimate | 2 hours |
| Depends On | Phase 02 |
| Description | Migrate 4 existing posts and profile data to Payload CMS |

## Key Insights
- Current posts are in `src/data/blogData.ts` with raw HTML content
- Decision: Keep HTML content as-is for initial migration (avoid Lexical conversion complexity)
- Profile data maps directly to SiteConfig global
- Thumbnails are external Unsplash URLs - download to R2

## Requirements

### Functional
- All 4 posts (W01-W04 2026) migrated to Payload
- Profile data in SiteConfig
- Thumbnails stored in R2
- Existing slugs preserved for URL consistency

### Non-Functional
- Zero content loss
- Preserve formatting and links
- Idempotent migration script

## Architecture

```
Migration Flow:
src/data/blogData.ts
        │
        ▼
scripts/migrate-content.ts
        │
        ├──► Payload Weekly collection
        │
        └──► R2 bucket (thumbnails)
```

## Related Code Files

### Source Files
| File | Content |
|------|---------|
| `src/data/blogData.ts` | 4 BlogPost objects + profile |

### Target Files
| File | Purpose |
|------|---------|
| `scripts/migrate-content.ts` | Migration script |
| `scripts/seed.ts` | Reusable seed for dev |

## Implementation Steps

### Step 1: Create Migration Script
**scripts/migrate-content.ts**:
```typescript
import { getPayload } from 'payload'
import config from '../payload.config'
import { blogPosts, profile } from '../src/data/blogData'

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  return Buffer.from(await response.arrayBuffer())
}

async function migrate() {
  const payload = await getPayload({ config })

  console.log('Starting migration...')

  // Migrate SiteConfig
  console.log('Migrating site config...')
  await payload.updateGlobal({
    slug: 'site-config',
    data: {
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      work: profile.work,
      social: {
        threads: profile.social.threads,
        github: profile.social.github,
        linkedin: profile.social.linkedin,
        instagram: profile.social.instagram,
      },
    },
  })

  // Migrate posts
  for (const post of blogPosts) {
    console.log(`Migrating: ${post.title}`)

    // Check if already exists
    const existing = await payload.find({
      collection: 'weekly',
      where: { slug: { equals: post.slug } },
    })

    if (existing.docs.length > 0) {
      console.log(`  Skipping (exists): ${post.slug}`)
      continue
    }

    // Download and upload thumbnail
    let thumbnailId: string | undefined
    try {
      const imageBuffer = await downloadImage(post.thumbnail)
      const uploaded = await payload.create({
        collection: 'media',
        data: {
          alt: post.title,
        },
        file: {
          data: imageBuffer,
          mimetype: 'image/jpeg',
          name: `${post.slug}-thumbnail.jpg`,
          size: imageBuffer.length,
        },
      })
      thumbnailId = uploaded.id
    } catch (e) {
      console.warn(`  Failed to upload thumbnail: ${e}`)
    }

    // Parse date
    const publishedAt = new Date(post.date).toISOString()

    // Create post
    await payload.create({
      collection: 'weekly',
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'HTML_PLACEHOLDER',
                  },
                ],
              },
            ],
          },
        },
        // Store raw HTML in a separate field for display
        // Or use Lexical HTML import if available
        thumbnail: thumbnailId,
        tag: 'ai-weekly',
        tagColor: post.tagColor,
        publishedAt,
        readTime: post.readTime,
        status: 'published',
      },
    })

    console.log(`  Created: ${post.slug}`)
  }

  console.log('Migration complete!')
  process.exit(0)
}

migrate().catch((e) => {
  console.error('Migration failed:', e)
  process.exit(1)
})
```

### Step 2: Handle HTML Content
Current posts have raw HTML. Options:
1. **Convert to Lexical** - Complex, may lose formatting
2. **Store as raw HTML field** - Simple, display with dangerouslySetInnerHTML
3. **Hybrid** - Lexical for new, HTML for legacy

**Recommended: Option 2 for migration, Option 1 for new content**

Add HTML field to Weekly collection:
```typescript
// In collections/Weekly.ts, add:
{
  name: 'legacyHtmlContent',
  type: 'textarea',
  admin: {
    description: 'Raw HTML from migration (read-only)',
    readOnly: true,
  },
}
```

Update migration to use this field:
```typescript
// In migrate script
data: {
  ...
  legacyHtmlContent: post.content,
}
```

### Step 3: Frontend HTML Rendering
**components/blog/PostContent.tsx**:
```typescript
'use client'

import DOMPurify from 'dompurify'

interface PostContentProps {
  content?: any // Lexical content
  legacyHtml?: string
}

export function PostContent({ content, legacyHtml }: PostContentProps) {
  if (legacyHtml) {
    // Render legacy HTML (sanitized)
    const sanitized = DOMPurify.sanitize(legacyHtml)
    return (
      <div
        className="prose prose-lg dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    )
  }

  // Render Lexical content
  // Use @payloadcms/richtext-lexical/react for Lexical
  return <LexicalRenderer content={content} />
}
```

### Step 4: Migrate Avatar
```bash
# Download avatar from current location
# Upload to R2 via Payload media

# Or use external URL temporarily
```

### Step 5: Run Migration
```bash
# Ensure Payload is configured
npm run payload migrate

# Run migration script
npx tsx scripts/migrate-content.ts

# Verify in admin panel
npm run dev
# Visit /admin -> Weekly collection
```

### Step 6: Create Seed Script for Dev
**scripts/seed.ts**:
```typescript
// Reusable for local dev environment reset
// Same logic as migrate but also resets data

async function seed() {
  const payload = await getPayload({ config })

  // Clear existing data (dev only!)
  if (process.env.NODE_ENV === 'development') {
    await payload.delete({
      collection: 'weekly',
      where: { id: { exists: true } },
    })
  }

  // Run migration logic
  await migrate()
}
```

## Todo List
- [ ] Add `legacyHtmlContent` field to Weekly collection
- [ ] Create `scripts/migrate-content.ts`
- [ ] Handle date parsing (current format: "01 Feb 2026")
- [ ] Download thumbnails from Unsplash URLs
- [ ] Upload thumbnails to R2 via Payload
- [ ] Create PostContent component for HTML rendering
- [ ] Install DOMPurify for HTML sanitization
- [ ] Run migration script
- [ ] Verify 4 posts in admin
- [ ] Verify SiteConfig populated
- [ ] Test public blog routes with migrated content
- [ ] Create seed script for dev

## Success Criteria
- [ ] 4 posts visible in Payload admin
- [ ] All post content renders correctly
- [ ] Thumbnails display from R2
- [ ] SiteConfig shows profile data
- [ ] Public `/blog` lists all posts
- [ ] `/blog/2026-w01` etc. render correctly
- [ ] Links in content are clickable
- [ ] "Goc nhin" sections styled correctly

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| HTML formatting loss | Low | Med | Keep original HTML, render with DOMPurify |
| Date parsing errors | Low | Low | Normalize to ISO format during migration |
| Image download failures | Med | Low | Fallback to external URL |
| Duplicate migrations | Low | Low | Check slug existence before create |

## Security Considerations
- Sanitize all HTML with DOMPurify before rendering
- No user-submitted content in this migration
- Media URLs served from R2 (trusted source)

## Next Steps
After completion:
1. Proceed to [Phase 04: Agent System](./phase-04-agent-system.md)
2. Agents will create new content via Payload API
3. New content uses Lexical (not legacy HTML)
