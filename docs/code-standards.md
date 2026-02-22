# Code Standards & Codebase Structure

**Project**: VN AI Weekly
**Last Updated**: 2026-02-05

## Codebase Structure

### Monorepo Organization

```
my-portfolio/
├── apps/
│   └── web/                    # Primary Next.js application
│       ├── src/
│       │   ├── app/            # Next.js App Router (routes)
│       │   ├── collections/    # Payload CMS collections
│       │   ├── components/     # React components
│       │   ├── globals/        # Payload global configs
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities and helpers
│       │   └── migrations/     # Database migrations
│       ├── public/             # Static assets
│       ├── .env.example        # Environment template
│       ├── next.config.mjs     # Next.js configuration
│       ├── package.json        # Dependencies
│       ├── tsconfig.json       # TypeScript config
│       └── wrangler.json       # Cloudflare Workers config
│
├── src/                        # Legacy Vite app (to be removed)
├── docs/                       # Project documentation
├── plans/                      # Planning and design docs
└── .claude/                    # AI tooling configuration
```

### Directory Naming Conventions

#### File System
- **Lowercase with hyphens**: Directory names use kebab-case (`blog-post`, `api-routes`)
- **Component directories**: Match component name (`LinkInBio/`, `RichText/`)
- **Feature grouping**: Related features in subdirectories (`components/blog/`, `components/ui/`)

#### Special Next.js Conventions
- `(payload)` - Route groups (doesn't affect URL)
- `[slug]` - Dynamic route segments
- `[[...segments]]` - Catch-all routes

## File Naming Conventions

### TypeScript Files

#### React Components
- **PascalCase**: `BlogCard.tsx`, `LinkInBio.tsx`, `SocialShare.tsx`
- **Pattern**: `ComponentName.tsx` for default export components

#### Utility Files
- **camelCase**: `utils.ts`, `cn.ts`
- **kebab-case**: `api-helpers.ts`, `date-utils.ts` (when multiple words)

#### Configuration Files
- **kebab-case**: `payload.config.ts`, `next.config.mjs`
- **Special names**: `middleware.ts`, `layout.tsx`, `page.tsx` (Next.js conventions)

#### Payload CMS Files
- **PascalCase**: Collections (`Users.ts`, `Weekly.ts`, `Media.ts`)
- **PascalCase**: Globals (`SiteConfig.ts`)

#### Migration Files
- **Timestamp prefix**: `20260204_122350_initial.ts`
- **Pattern**: `YYYYMMDD_HHMMSS_description.ts`

### Directory Organization Patterns

#### Components Structure
```
components/
├── ui/                         # shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   └── dialog.tsx
├── blog/                       # Blog-specific components
│   ├── BlogCard.tsx
│   ├── BlogHome.tsx
│   └── SubscribeSection.tsx
├── LinkInBio.tsx               # Standalone components
├── RichText.tsx
└── theme-provider.tsx          # Context providers
```

#### App Router Structure
```
app/
├── (payload)/                  # Admin routes (grouped)
│   ├── admin/
│   │   └── [[...segments]]/
│   │       └── page.tsx
│   ├── api/
│   │   └── [...slug]/
│   │       └── route.ts
│   └── layout.tsx
├── api/                        # Public API routes
│   ├── subscribe/
│   │   └── route.ts
│   ├── confirm/
│   │   └── route.ts
│   └── preview/
│       └── route.ts
├── blog/                       # Blog routes
│   ├── [slug]/
│   │   ├── page.tsx
│   │   └── opengraph-image.tsx
│   └── page.tsx
├── layout.tsx                  # Root layout
├── page.tsx                    # Homepage
└── sitemap.ts                  # Dynamic sitemap
```

## Coding Conventions

### TypeScript Standards

#### Strict Mode
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler"
  }
}
```

#### Type Definitions
- **Explicit return types**: For public functions and components
- **Interface over type**: For object shapes (where applicable)
- **Type imports**: Use `import type` for type-only imports

```typescript
// Good
import type { CollectionConfig } from 'payload'
import type { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Avoid
import { CollectionConfig } from 'payload'
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

#### Async/Await
- **Prefer async/await**: Over promises for better readability
- **Error handling**: Use try/catch for async operations

```typescript
// Good
export default async function BlogPage() {
  const payload = await getPayload({ config })
  const posts = await payload.find({
    collection: 'weekly',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
  })
  return <BlogHome posts={posts.docs} />
}
```

### React/Next.js Conventions

#### Component Patterns

**Server Components (Default)**
```typescript
// app/blog/page.tsx
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const payload = await getPayload({ config })
  // Data fetching in component
  return <BlogHome posts={posts.docs} />
}
```

**Client Components**
```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SubscribeSection() {
  const [email, setEmail] = useState('')
  // Interactive logic
  return <form>...</form>
}
```

**Component Props**
```typescript
interface BlogCardProps {
  title: string
  excerpt: string
  slug: string
  publishedAt: string
  tag?: string
  thumbnail?: Media
}

export function BlogCard({ title, excerpt, slug }: BlogCardProps) {
  return <div>...</div>
}
```

#### Export Patterns

**Default Exports**: For pages, layouts, and primary components
```typescript
export default function HomePage() { ... }
```

**Named Exports**: For utilities, hooks, and reusable components
```typescript
export function cn(...inputs: ClassValue[]) { ... }
export { Button, ButtonProps }
```

#### Import Organization

```typescript
// 1. External dependencies
import { getPayload } from 'payload'
import type { CollectionConfig } from 'payload'

// 2. Internal components/utils (alphabetical)
import { BlogHome } from '@/components/blog/BlogHome'
import { cn } from '@/lib/utils'
import config from '@payload-config'

// 3. Types/interfaces
import type { Weekly } from '@/payload-types'

// 4. Styles (if any)
import './styles.css'
```

### CSS/Styling Conventions

#### Tailwind CSS Classes

**Class Ordering** (recommended)
1. Layout (display, position, flex, grid)
2. Box model (width, height, padding, margin)
3. Typography (font, text)
4. Visual (color, background, border)
5. Effects (shadow, opacity, transition)

```typescript
<div className="flex items-center justify-between w-full px-4 py-2 text-lg font-semibold text-gray-900 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
  Content
</div>
```

#### Using `cn()` Helper
```typescript
import { cn } from '@/lib/utils'

// Conditional classes
<Button className={cn(
  "px-4 py-2 rounded-md",
  isActive && "bg-blue-500 text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
  Click me
</Button>

// Merging props
<div className={cn("default-classes", className)} {...props}>
  Content
</div>
```

#### Component Variants (CVA Pattern)
```typescript
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Payload CMS Patterns

#### Collection Definitions
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
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
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
    // More fields...
  ],
}
```

#### Global Configurations
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
      defaultValue: 'Hieu Dinh',
    },
    // More fields...
  ],
}
```

#### Data Fetching
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

// Server Component or API Route
const payload = await getPayload({ config })

// Find with filters
const posts = await payload.find({
  collection: 'weekly',
  where: {
    status: { equals: 'published' },
  },
  sort: '-publishedAt',
  limit: 50,
})

// Find by slug
const result = await payload.find({
  collection: 'weekly',
  where: { slug: { equals: slug } },
  limit: 1,
})
const post = result.docs[0]
```

### API Route Patterns

#### Route Handlers
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    if (!body.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Process request
    // ...

    return NextResponse.json({ message: 'Success' })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

#### Dynamic Routes
```typescript
// app/api/posts/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ...
}
```

## Testing Patterns

### Component Testing
- **Location**: Co-located `*.test.tsx` files
- **Framework**: Jest + React Testing Library (if added)
- **Pattern**: Test user interactions, not implementation

### API Testing
- **Location**: `__tests__/` directories
- **Pattern**: Test request/response contracts
- **Tools**: Supertest (if added)

## Error Handling

### Server Components
```typescript
export default async function Page() {
  try {
    const data = await fetchData()
    return <Component data={data} />
  } catch (error) {
    console.error('Failed to fetch data:', error)
    return <ErrorState />
  }
}
```

### Client Components
```typescript
'use client'

export function Component() {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    try {
      await api.post('/endpoint')
    } catch (err) {
      setError('Something went wrong')
      console.error(err)
    }
  }

  if (error) return <ErrorMessage message={error} />
  return <Form onSubmit={handleSubmit} />
}
```

### API Routes
```typescript
export async function POST(request: NextRequest) {
  try {
    // Logic
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Environment Variables

### Naming Convention
- **UPPERCASE_WITH_UNDERSCORES**: All environment variables
- **NEXT_PUBLIC_** prefix: Client-side accessible variables
- **No prefix**: Server-side only variables

### Organization
```env
# Database
DATABASE_URL=postgresql://...

# Payload CMS
PAYLOAD_SECRET=xxx

# Storage
S3_BUCKET=xxx
S3_ENDPOINT=xxx
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx

# External Services
RESEND_API_KEY=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Site Config
NEXT_PUBLIC_SITE_URL=https://...
PREVIEW_SECRET=xxx
```

## Performance Best Practices

### Image Optimization
```typescript
import Image from 'next/image'

// Always use Next.js Image component
<Image
  src={thumbnail.url}
  alt={title}
  width={800}
  height={450}
  className="rounded-lg"
/>
```

### Dynamic Imports
```typescript
// Heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
})
```

### Font Optimization
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## Security Best Practices

### Input Validation
```typescript
import { z } from 'zod'

const subscribeSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validation = subscribeSchema.safeParse(body)

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors },
      { status: 400 }
    )
  }

  const { email } = validation.data
  // Process...
}
```

### Environment Secret Access
```typescript
// Server-side only
const secret = process.env.PAYLOAD_SECRET
if (!secret) {
  throw new Error('PAYLOAD_SECRET is required')
}
```

### Authentication
```typescript
// Payload CMS access control
access: {
  read: () => true,
  create: ({ req: { user } }) => !!user,
  update: ({ req: { user } }) => !!user,
  delete: ({ req: { user } }) => !!user,
}
```

## Code Quality Tools

### ESLint Configuration
- **Extends**: `eslint-config-next`
- **Rules**: Next.js best practices
- **Auto-fix**: On save (recommended)

### TypeScript
- **Strict mode**: Enabled
- **No implicit any**: Enforced
- **Type generation**: Payload types auto-generated

### Prettier (Recommended)
- **Config**: Default with Tailwind plugin
- **Format on save**: Enabled

## Documentation Standards

### JSDoc Comments
```typescript
/**
 * Combines class names with Tailwind CSS class merging
 * @param inputs - Class names to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

### Component Documentation
```typescript
/**
 * Blog post card component
 *
 * @param {string} title - Post title
 * @param {string} excerpt - Post excerpt
 * @param {string} slug - URL slug
 * @param {string} publishedAt - Publication date
 * @param {string} [tag] - Optional category tag
 *
 * @example
 * <BlogCard
 *   title="My Post"
 *   excerpt="Post excerpt"
 *   slug="my-post"
 *   publishedAt="2024-01-01"
 * />
 */
export function BlogCard({ title, excerpt, slug }: BlogCardProps) {
  // ...
}
```

## Version Control Patterns

### Commit Messages
- **Format**: `type(scope): description`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Scope**: module/feature affected
- **Examples**:
  - `feat(blog): add related posts component`
  - `fix(api): validate email before subscription`
  - `docs: update code standards`

### Branch Naming
- **Feature**: `feat/feature-name`
- **Bug fix**: `fix/bug-description`
- **Hotfix**: `hotfix/critical-issue`
- **Release**: `release/v1.0.0`

## Migration from Legacy Code

### Deprecation Pattern
- Mark files with comments: `// TODO: Remove after Next.js migration`
- Keep legacy code functional during transition
- Document migration path in `/docs/migration.md` (if needed)

### Dual Maintenance
- Both apps/web/ and src/ currently maintained
- Priority: Next.js app (apps/web/)
- Legacy: Minimal changes only

## Anti-Patterns to Avoid

### Don't
- ❌ Mix server and client logic without `'use client'`
- ❌ Import server-only code in client components
- ❌ Use `any` type without justification
- ❌ Hardcode URLs or secrets
- ❌ Ignore TypeScript errors
- ❌ Skip error handling in async operations
- ❌ Use inline styles (use Tailwind classes)
- ❌ Create deeply nested component trees (flatten when possible)

### Do
- ✅ Use TypeScript strictly
- ✅ Leverage Next.js App Router features (Server Components, Server Actions)
- ✅ Keep components small and focused
- ✅ Extract reusable logic to hooks
- ✅ Use environment variables for configuration
- ✅ Write semantic HTML
- ✅ Follow accessibility best practices
- ✅ Optimize images and fonts

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
