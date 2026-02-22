# Codebase Summary

Generated from repomix analysis on 2026-02-05

## Project Overview

**VN AI Weekly** - A dual-architecture portfolio and blog platform currently in migration from a Vite/React SPA to a Next.js application with Payload CMS.

## Tech Stack

### Core Technologies

#### Next.js Application (apps/web/) - Primary
- **Framework**: Next.js 15.4.0 with App Router
- **Runtime**: React 19.0.0
- **Language**: TypeScript 5.6.3
- **CMS**: Payload CMS 3.74.0
- **Database**: PostgreSQL (via @payloadcms/db-postgres)
- **Rich Text**: Lexical Editor (@payloadcms/richtext-lexical)
- **Build Target**: Standalone deployment via @opennextjs/cloudflare

#### Legacy Vite Application (src/) - Deprecated
- **Framework**: Vite 5.4.19 + React 18.3.1
- **Router**: React Router DOM 6.30.1
- **State**: TanStack Query 5.83.0
- **Backend**: Supabase Client 2.93.3

### UI & Styling
- **Component Library**: Radix UI (comprehensive collection of 30+ primitives)
- **Design System**: shadcn/ui pattern
- **Styling**: Tailwind CSS 4.0.0 + @tailwindcss/postcss
- **Typography**: @tailwindcss/typography
- **Animations**: Framer Motion 12.31.0, tailwindcss-animate
- **Theme**: next-themes (dark/light mode)

### Data & State Management
- **Forms**: react-hook-form 7.71.1 + @hookform/resolvers + zod 4.3.6
- **Date**: date-fns 4.1.0, react-day-picker 9.13.0
- **Charts**: recharts 3.7.0
- **Carousel**: embla-carousel-react 8.6.0

### Infrastructure & Deployment

#### Cloudflare Workers Platform
- **Adapter**: @opennextjs/cloudflare 1.14.9
- **Database**: Cloudflare D1 (SQLite)
  - Binding: `DB`
  - Database ID: ce083859-07d4-4641-bf3a-6fa49fcbc88d
  - Database Name: vn-ai-weekly-db
- **Storage**: Cloudflare R2
  - Binding: `R2`
  - Bucket: vn-ai-weekly-media
- **Assets**: Static asset serving via Workers Assets
- **Compatibility**: nodejs_compat, global_fetch_strictly_public

#### Alternative Configuration (Development)
- **Database**: Supabase PostgreSQL
  - Connection via DATABASE_URL
  - Used for development and Payload migrations
- **Storage**: S3-compatible (Supabase Storage)
  - Bucket configured via env vars
  - Endpoint: Supabase S3 API

### External Services
- **Email**: Resend (newsletter subscriptions)
- **AI Integration**: Anthropic API, OpenAI API (for content generation features)
- **Content Scraping**: Firecrawl API

## Directory Structure

```
my-portfolio/
├── apps/
│   └── web/                    # Next.js 15 application (PRIMARY)
│       ├── src/
│       │   ├── app/            # Next.js App Router
│       │   │   ├── (payload)/  # Payload CMS admin routes
│       │   │   ├── api/        # API routes
│       │   │   ├── blog/       # Blog pages
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx    # Home page (LinkInBio component)
│       │   │   └── sitemap.ts
│       │   ├── collections/    # Payload CMS collections
│       │   │   ├── Users.ts
│       │   │   ├── Weekly.ts   # Blog posts
│       │   │   └── Media.ts
│       │   ├── components/     # React components
│       │   │   ├── blog/       # Blog-specific components
│       │   │   └── ui/         # shadcn/ui components
│       │   ├── globals/        # Payload globals
│       │   │   └── SiteConfig.ts
│       │   ├── hooks/          # React hooks
│       │   ├── lib/            # Utility functions
│       │   ├── migrations/     # Database migrations
│       │   └── payload.config.ts
│       ├── .env.example
│       ├── next.config.mjs
│       ├── package.json
│       ├── tsconfig.json
│       └── wrangler.json       # Cloudflare Workers config
│
├── src/                        # Legacy Vite application (DEPRECATED)
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/
│   │   ├── Index.tsx           # Blog list
│   │   ├── About.tsx           # About/home page
│   │   ├── BlogPost.tsx        # Blog post detail
│   │   └── NotFound.tsx
│   ├── hooks/
│   ├── integrations/
│   │   └── supabase/
│   ├── lib/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/                     # Static assets (legacy)
├── dist/                       # Build output (legacy)
├── docs/                       # Project documentation
├── plans/                      # Planning documents
├── .claude/                    # Claude Code AI configuration
│   ├── agents/                 # AI agent definitions
│   ├── commands/               # Custom commands
│   ├── hooks/                  # Git hooks
│   └── skills/                 # AI skills library
│
├── package.json                # Root package.json (legacy)
├── vite.config.ts              # Vite configuration (legacy)
└── README.md
```

## Key Modules & Responsibilities

### Next.js App (apps/web/)

#### Payload CMS Collections

**Users Collection** (`src/collections/Users.ts`)
- Admin authentication and authorization
- User management for CMS

**Weekly Collection** (`src/collections/Weekly.ts`)
- Blog post content management
- Fields: title, slug, excerpt, content (richText), thumbnail, tag, tagColor, publishedAt, readTime, status
- Tags: ai-weekly, tech, tutorial
- Access control: public read

**Media Collection** (`src/collections/Media.ts`)
- Image and file uploads
- S3/R2 storage integration

#### Globals

**SiteConfig** (`src/globals/SiteConfig.ts`)
- Site-wide configuration
- Meta tags, social links, site settings

#### App Routes

**Public Routes**
- `/` - LinkInBio homepage
- `/blog` - Blog list page
- `/blog/[slug]` - Individual blog post
- `/sitemap.ts` - Dynamic sitemap generation

**API Routes**
- `/api/subscribe` - Newsletter subscription
- `/api/confirm` - Email confirmation
- `/api/preview` - Draft preview mode
- `/api/exit-preview` - Exit preview mode

**Payload Routes** (admin only)
- `/admin` - Payload CMS admin panel
- `/api/*` - Payload API endpoints

#### Components

**Blog Components** (`src/components/blog/`)
- `BlogHome.tsx` - Main blog listing
- `BlogCard.tsx` - Blog post card
- `SubscribeSection.tsx` - Newsletter subscription form
- `TagFilter.tsx` - Tag filtering
- `SearchOverlay.tsx` - Search functionality
- `SocialLinks.tsx` - Social media links

**Shared Components** (`src/components/`)
- `LinkInBio.tsx` - Homepage link aggregator
- `RichText.tsx` - Lexical rich text renderer
- `ReadingProgress.tsx` - Reading progress indicator
- `SocialShare.tsx` - Social sharing buttons
- `JsonLd.tsx` - SEO structured data
- `RelatedPosts.tsx` - Related content suggestions
- `PreviewBanner.tsx` - Draft preview notification
- `theme-provider.tsx` - Theme context

**UI Components** (`src/components/ui/`)
- 40+ shadcn/ui components (Button, Card, Dialog, Form, etc.)
- Radix UI primitives wrapped with Tailwind styling

### Legacy Vite App (src/)

**Pages**
- `About.tsx` - Homepage (mapped to `/`)
- `Index.tsx` - Blog list (mapped to `/blog`)
- `BlogPost.tsx` - Blog detail (mapped to `/blog/:slug`)
- `NotFound.tsx` - 404 page

**Features**
- React Router DOM for client-side routing
- Supabase integration for data fetching
- TanStack Query for state management
- Shadcn/ui components

## Dependencies

### Production Dependencies (apps/web)

**CMS & Database**
- payload@3.74.0
- @payloadcms/next@3.74.0
- @payloadcms/db-postgres@3.74.0
- @payloadcms/db-d1-sqlite@3.74.0
- @payloadcms/richtext-lexical@3.74.0
- @payloadcms/storage-r2@3.74.0
- @payloadcms/storage-s3@3.74.0
- pg@8.18.0
- graphql@16.12.0

**Framework**
- next@15.4.0
- react@19.0.0
- react-dom@19.0.0
- @opennextjs/cloudflare@1.14.9

**UI Libraries**
- 30+ @radix-ui/* packages (1.x - 2.x)
- lucide-react@0.462.0
- framer-motion@12.31.0

**Forms & Validation**
- react-hook-form@7.71.1
- @hookform/resolvers@5.2.2
- zod@4.3.6

**Utilities**
- clsx@2.1.1
- class-variance-authority@0.7.1
- tailwind-merge@2.6.0
- date-fns@4.1.0

**External Services**
- @supabase/supabase-js@2.94.1
- resend@6.9.1

### Development Dependencies

**Build Tools**
- typescript@5.6.3
- @tailwindcss/postcss@4.1.18
- tailwindcss@4.0.0
- @tailwindcss/typography@0.5.16

**Cloudflare**
- wrangler@4.6.0
- @cloudflare/workers-types@4.20250128.0

**Code Quality**
- eslint@9
- eslint-config-next@15.4.0

**Utilities**
- cross-env@7.0.3

## Data Flow

### Content Management Flow
1. Admin creates/edits content in Payload CMS (`/admin`)
2. Content stored in PostgreSQL database
3. Media files uploaded to S3/R2 storage
4. Payload API generates types (`payload-types.ts`)
5. Next.js pages fetch content via Payload Local API
6. Static generation (ISR) for blog posts

### Newsletter Subscription Flow
1. User submits email via `SubscribeSection` component
2. POST to `/api/subscribe`
3. Stores subscriber in Supabase database
4. Sends confirmation email via Resend
5. User clicks confirmation link
6. GET to `/api/confirm` validates and activates subscription

### Preview/Draft Flow
1. Admin clicks "Preview" in Payload CMS
2. Redirects to `/api/preview?slug=xxx&secret=xxx`
3. Sets preview cookie
4. Blog page renders draft content
5. `PreviewBanner` displays exit option
6. GET to `/api/exit-preview` clears preview mode

## Database Schema

### Payload Collections (PostgreSQL)

**users**
- id, email, password (hashed)
- roles, permissions
- createdAt, updatedAt

**weekly**
- id, title, slug (unique)
- excerpt, content (JSON - Lexical)
- thumbnail (relation to media)
- tag (enum: ai-weekly, tech, tutorial)
- tagColor (enum: pink, orange, green, blue, purple, yellow)
- publishedAt (date)
- readTime (string)
- status (enum: draft, published)
- createdAt, updatedAt

**media**
- id, filename, mimeType
- filesize, width, height
- s3Key, url
- createdAt, updatedAt

**site_config** (global)
- siteName, siteDescription
- socialLinks (array)
- contactEmail
- updatedAt

### Supabase Tables (Legacy)

**subscribers**
- id, email
- confirmed (boolean)
- created_at

## API Structure

### Payload API (`/api/...`)
- Auto-generated REST and GraphQL APIs
- `/api/weekly` - Blog posts CRUD
- `/api/media` - Media uploads
- `/api/users` - User management
- `/api/globals/site-config` - Site configuration

### Custom API Routes

**POST /api/subscribe**
- Body: `{ email: string }`
- Creates subscriber record
- Sends confirmation email
- Returns: `{ message: string }`

**GET /api/confirm**
- Query: `token` (JWT with email)
- Validates and confirms subscriber
- Returns: Redirect to blog

**GET /api/preview**
- Query: `slug`, `secret`
- Validates preview secret
- Sets preview cookie
- Returns: Redirect to `/blog/[slug]`

**GET /api/exit-preview**
- Clears preview cookie
- Returns: Redirect to previous page

## Build & Deployment

### Development
```bash
cd apps/web
pnpm dev          # Next.js dev server on http://localhost:3000
pnpm payload      # Payload CMS commands
pnpm generate:types  # Generate TypeScript types from Payload schema
```

### Production Build
```bash
pnpm build        # Next.js standalone build
pnpm deploy       # Full deployment (DB + app)
```

### Deployment Steps
1. **Database Migration**: `pnpm deploy:database`
   - Runs Payload migrations against production PostgreSQL
   - Optimizes D1 database (PRAGMA optimize)
2. **Application Deploy**: `pnpm deploy:app`
   - Builds Next.js with OpenNext adapter
   - Deploys to Cloudflare Workers
   - Configures D1, R2 bindings

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `PAYLOAD_SECRET` - Payload CMS secret (32+ chars)
- `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` - Storage config
- `RESEND_API_KEY` - Email service
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` - Supabase (legacy)
- `NEXT_PUBLIC_SITE_URL` - Site base URL
- `PREVIEW_SECRET` - Draft preview authentication
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` - AI features (optional)
- `FIRECRAWL_API_KEY` - Content scraping (optional)

## Integration Points

### Payload CMS Integration
- Configuration: `src/payload.config.ts`
- Next.js plugin: `@payloadcms/next/withPayload`
- Admin UI: Server-rendered at `/admin`
- API: Auto-generated endpoints
- Storage: S3-compatible (Supabase or R2)

### Supabase Integration
- Client initialization in `src/integrations/supabase/`
- Used for subscribers table
- Legacy data fetching for Vite app
- S3-compatible storage backend

### Cloudflare Workers
- OpenNext adapter transforms Next.js app
- Worker script: `.open-next/worker.js`
- Assets served from `.open-next/assets/`
- Bindings: DB (D1), R2, ASSETS

## Migration Status

### Completed
- ✅ Next.js 15 + App Router setup
- ✅ Payload CMS integration
- ✅ Blog post collection + admin
- ✅ PostgreSQL database adapter
- ✅ S3 storage plugin
- ✅ Blog listing page
- ✅ Blog detail page with rich text
- ✅ Newsletter subscription
- ✅ SEO & OpenGraph
- ✅ Related posts
- ✅ Draft preview mode
- ✅ Cloudflare Workers deployment config

### In Progress / Pending
- 🔄 Complete migration from Vite to Next.js
- 🔄 Remove legacy src/ directory
- 🔄 Migrate all routes to App Router
- 🔄 AI content features (Anthropic/OpenAI integration)
- 🔄 Content scraping with Firecrawl

### Legacy (To Be Deprecated)
- ⚠️ Vite app in `src/`
- ⚠️ Root `package.json` dependencies
- ⚠️ `vite.config.ts`
- ⚠️ `public/` directory (move to `apps/web/public/`)

## Notes

- **Monorepo Structure**: Project uses `apps/` pattern but currently only has one app (web)
- **Dual Package Managers**: Root uses pnpm, maintains compatibility with npm scripts
- **Type Safety**: Full TypeScript with strict mode, auto-generated Payload types
- **Database Strategy**: PostgreSQL for development/CMS, D1 for production edge deployment
- **Storage Strategy**: Supabase S3 for development, Cloudflare R2 for production
- **AI Tooling**: Extensive `.claude/` configuration with 50+ skills, agents, and hooks
- **Code Quality**: ESLint, TypeScript, Next.js best practices
