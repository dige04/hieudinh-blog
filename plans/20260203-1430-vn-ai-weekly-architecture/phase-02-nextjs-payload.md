# Phase 02: Next.js + Payload CMS Setup

## Context
- [Cloudflare Infrastructure Research](./research/researcher-01-cloudflare-infrastructure.md)
- [Current Codebase Scout](./scout/scout-01-current-codebase.md)
- [Phase 01: Infrastructure](./phase-01-infrastructure.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-02-03 |
| Priority | P0 - Critical Path |
| Status | pending |
| Estimate | 6 hours |
| Depends On | Phase 01 |
| Description | Create fresh Next.js 15 project with Payload CMS 3.0, configured for Cloudflare |

## Key Insights
- Payload 3.0 is Next.js-native (no separate server)
- `@payloadcms/db-d1-sqlite` adapter uses Drizzle ORM
- OpenNext bridges Next.js server features to Workers
- Keep Shadcn UI components from current project (portable)
- Current `BlogPost` interface maps cleanly to Payload `Weekly` collection

## Requirements

### Functional
- Next.js 15 app with Payload CMS admin
- `Weekly` collection for newsletter posts
- `SiteConfig` global for profile data
- Shadcn UI components migrated
- Dark mode support

### Non-Functional
- Lighthouse score >90
- Admin panel accessible at `/admin`
- Type-safe content queries

## Architecture

```
apps/web/
├── app/
│   ├── (frontend)/          # Public routes
│   │   ├── page.tsx         # About page
│   │   ├── blog/
│   │   │   ├── page.tsx     # Blog listing
│   │   │   └── [slug]/
│   │   │       └── page.tsx # Blog post
│   │   └── layout.tsx
│   ├── (payload)/           # Payload admin
│   │   └── admin/
│   │       └── [[...segments]]/
│   │           └── page.tsx
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── collections/
│   ├── Weekly.ts            # Newsletter posts
│   └── Media.ts             # Media uploads
├── globals/
│   └── SiteConfig.ts        # Site settings
├── components/
│   ├── ui/                  # Shadcn (migrated)
│   └── blog/                # Blog components
└── payload.config.ts
```

## Related Code Files

### Current (to migrate)
| File | Action |
|------|--------|
| `src/components/ui/*` | Copy to `components/ui/` |
| `src/components/blog/*` | Migrate, update imports |
| `src/data/blogData.ts` | Convert to Payload seeds |
| `tailwind.config.ts` | Merge with Next.js config |
| `src/index.css` | Merge into `app/globals.css` |

### New Files
| File | Purpose |
|------|---------|
| `payload.config.ts` | Payload CMS configuration |
| `collections/Weekly.ts` | Newsletter collection schema |
| `globals/SiteConfig.ts` | Site configuration |
| `open-next.config.ts` | OpenNext for Cloudflare |

## Implementation Steps

### Step 1: Create Next.js + Payload Project
```bash
# Create new project directory
mkdir vn-ai-weekly && cd vn-ai-weekly

# Initialize with Payload
npx create-payload-app@latest . \
  --template blank \
  --db d1-sqlite \
  --no-git

# Install OpenNext
npm install @opennextjs/cloudflare
```

### Step 2: Configure Payload for D1
**payload.config.ts**:
```typescript
import { buildConfig } from 'payload'
import { d1SQLiteAdapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import { Weekly } from './collections/Weekly'
import { Media } from './collections/Media'
import { SiteConfig } from './globals/SiteConfig'

export default buildConfig({
  admin: {
    user: 'users',
  },
  collections: [Weekly, Media],
  globals: [SiteConfig],
  db: d1SQLiteAdapter({
    client: {
      // Binding injected by Cloudflare
      bindingName: 'DB',
    },
  }),
  editor: lexicalEditor(),
  plugins: [
    r2Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET!,
      config: {
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
        region: 'auto',
      },
    }),
  ],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: 'payload-types.ts',
  },
})
```

### Step 3: Define Weekly Collection
**collections/Weekly.ts**:
```typescript
import type { CollectionConfig } from 'payload'

export const Weekly: CollectionConfig = {
  slug: 'weekly',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', 'status'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'tag',
      type: 'select',
      options: [
        { label: 'AI Weekly', value: 'ai-weekly' },
        { label: 'Tech', value: 'tech' },
        { label: 'Tutorial', value: 'tutorial' },
      ],
      defaultValue: 'ai-weekly',
    },
    {
      name: 'tagColor',
      type: 'select',
      options: ['pink', 'orange', 'green', 'blue', 'purple', 'yellow'],
      defaultValue: 'blue',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'readTime',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Review', value: 'review' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'personalInsight',
      type: 'richText',
      label: 'Goc nhin cua minh',
      admin: {
        description: 'Personal commentary section',
      },
    },
  ],
}
```

### Step 4: Define SiteConfig Global
**globals/SiteConfig.ts**:
```typescript
import type { GlobalConfig } from 'payload'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'text',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'work',
      type: 'text',
    },
    {
      name: 'social',
      type: 'group',
      fields: [
        { name: 'threads', type: 'text' },
        { name: 'github', type: 'text' },
        { name: 'linkedin', type: 'text' },
        { name: 'instagram', type: 'text' },
      ],
    },
  ],
}
```

### Step 5: Configure OpenNext
**open-next.config.ts**:
```typescript
import { defineConfig } from '@opennextjs/cloudflare'

export default defineConfig({
  // Use Cloudflare's image optimization
  imageOptimization: {
    format: ['webp', 'avif'],
  },
})
```

### Step 6: Migrate Shadcn Components
```bash
# Copy UI components
cp -r ../my-portfolio/src/components/ui ./components/

# Update imports in all components
# Change: import { cn } from "@/lib/utils"
# To: import { cn } from "@/lib/utils"  (same, just verify path)
```

### Step 7: Setup App Routes
**app/(frontend)/blog/page.tsx**:
```typescript
import { getPayload } from 'payload'
import config from '@/payload.config'
import { BlogCard } from '@/components/blog/BlogCard'

export default async function BlogPage() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'weekly',
    where: {
      status: { equals: 'published' },
    },
    sort: '-publishedAt',
  })

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.docs.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
```

## Todo List
- [ ] Create fresh Next.js + Payload project
- [ ] Configure D1 adapter in `payload.config.ts`
- [ ] Configure R2 storage adapter
- [ ] Create `Weekly` collection schema
- [ ] Create `Media` collection
- [ ] Create `SiteConfig` global
- [ ] Setup OpenNext configuration
- [ ] Migrate Shadcn UI components
- [ ] Migrate blog components (update imports)
- [ ] Create app routes structure
- [ ] Setup Tailwind with existing theme
- [ ] Run initial Payload migration
- [ ] Test admin panel locally
- [ ] Generate Payload types

## Success Criteria
- [ ] `npm run dev` starts without errors
- [ ] `/admin` shows Payload login
- [ ] Can create/edit Weekly posts in admin
- [ ] Public `/blog` route renders
- [ ] `/blog/[slug]` renders post content
- [ ] R2 uploads working
- [ ] Types generated (`payload-types.ts`)

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| D1 adapter compatibility | Med | High | Pin adapter version, test locally |
| Lexical vs HTML content | Med | Med | Keep HTML in separate field for migration |
| OpenNext edge cases | Low | Med | Follow Cloudflare deployment guide |
| Component migration issues | Low | Low | Incremental migration, test each |

## Security Considerations
- Payload admin behind authentication
- API routes use Payload access control
- No secrets in client components
- CORS configured for production domain only

## Next Steps
After completion:
1. Proceed to [Phase 03: Content Migration](./phase-03-content-migration.md)
2. Migrate existing 4 posts to Payload
3. Setup profile data in SiteConfig
