# System Architecture

**Project**: VN AI Weekly
**Last Updated**: 2026-02-05
**Architecture Style**: Serverless Edge Computing with Headless CMS

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Browser    │  │   Mobile     │  │  Search Bots │             │
│  │  (Desktop)   │  │   Devices    │  │  (Crawlers)  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└──────────────┬──────────────┬──────────────┬──────────────────────┘
               │              │              │
               │ HTTPS        │ HTTPS        │ HTTPS
               ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Cloudflare Global CDN                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Edge Locations (300+ cities)                                 │  │
│  │  - TLS Termination                                            │  │
│  │  - DDoS Protection                                            │  │
│  │  - Static Asset Caching                                       │  │
│  │  - Geographic Routing                                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (Edge Runtime)                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Next.js App (OpenNext Adapter)                               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │   Server    │  │    API      │  │   Static    │          │  │
│  │  │ Components  │  │   Routes    │  │    Pages    │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  │                                                                │  │
│  │  Payload CMS (Local API Mode)                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │ Collections │  │   Globals   │  │   Hooks     │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────┬───────────────┬───────────────┬───────────────┬─────────────┘
       │               │               │               │
       │ D1 API        │ R2 API        │ KV API        │ Origin
       ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Cloudflare  │ │ Cloudflare  │ │ Cloudflare  │ │   Supabase  │
│  D1 (SQLite)│ │  R2 (S3)    │ │     KV      │ │ (PostgreSQL)│
│             │ │             │ │             │ │             │
│  - weekly   │ │  - Media    │ │  - Cache    │ │  - Dev DB   │
│  - users    │ │  - Images   │ │  - Sessions │ │  - Subs     │
│  - media    │ │  - Files    │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
       │                                               │
       │                                               │
       └───────────────── Replication ────────────────┘
                     (Development → Production)

┌─────────────────────────────────────────────────────────────────────┐
│                     External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Resend     │  │  Anthropic   │  │  Firecrawl   │             │
│  │   (Email)    │  │    (AI)      │  │  (Scraper)   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

## Architecture Layers

### 1. Client Layer

**Components**
- Web browsers (Desktop, Mobile)
- Search engine crawlers (Google, Bing)
- Social media link previews (Twitter, Facebook, LinkedIn)

**Responsibilities**
- Render UI
- Execute client-side JavaScript
- Handle user interactions
- Cache static assets

**Technologies**
- HTML5, CSS3, JavaScript (ES2022+)
- React 19 (hydration)
- Service Workers (future consideration)

### 2. CDN Layer (Cloudflare)

**Components**
- Edge locations in 300+ cities
- Anycast network
- DDoS protection

**Responsibilities**
- TLS termination
- Static asset caching
- Request routing
- Security (WAF, rate limiting)
- HTTP/3 support

**Cache Strategy**
- Static assets: 1 year (immutable)
- HTML pages: Stale-while-revalidate
- API responses: No cache (dynamic)

### 3. Application Layer (Edge Runtime)

**Components**
- Cloudflare Workers (V8 isolates)
- Next.js App Router
- Payload CMS (local API mode)

**Responsibilities**
- Server-side rendering (SSR)
- Static generation (SSG)
- API request handling
- Authentication & authorization
- Content management

**Technologies**
- Next.js 15.4.0
- Payload CMS 3.74.0
- React Server Components
- OpenNext Cloudflare adapter

**Runtime Constraints**
- V8 isolate environment
- No Node.js fs, child_process
- 50ms CPU time limit (free tier)
- 1MB bundle size limit
- Edge-compatible code only

### 4. Data Layer

#### Primary Database: Cloudflare D1

**Type**: SQLite (distributed)
**Usage**: Production content storage

**Tables**
- `users` - CMS admin users
- `users_sessions` - Authentication sessions
- `weekly` - Blog post content
- `media` - File metadata
- `payload_preferences` - Admin UI preferences
- `payload_migrations` - Schema version tracking

**Access Pattern**
- Read-heavy (blog posts)
- Write-light (admin only)
- Global replication
- Eventual consistency

#### Development Database: Supabase PostgreSQL

**Type**: PostgreSQL 15+
**Usage**: Development, migrations, subscriber data

**Tables**
- All Payload CMS tables (schema source)
- `subscribers` - Newsletter subscriptions

**Migration Flow**
```
1. Develop schema in PostgreSQL
2. Generate migration files
3. Test migrations locally
4. Deploy migrations to D1
```

### 5. Storage Layer

#### Cloudflare R2 (Production)

**Type**: S3-compatible object storage
**Usage**: Media files, images, uploads

**Buckets**
- `vn-ai-weekly-media` - All uploaded content

**Configuration**
- Public access via CDN
- CORS enabled for admin uploads
- Automatic image transformations

**Access Pattern**
- Write: Admin only (via Payload CMS)
- Read: Public (cached via CDN)

#### Supabase Storage (Development)

**Type**: S3-compatible (backed by Cloudflare R2)
**Usage**: Development media storage

### 6. External Services

#### Resend (Email Service)

**Purpose**: Newsletter confirmation emails

**Integration**
- REST API
- Transactional emails only
- Email templates in code

**Flow**
```
User subscribes → API validates → Resend sends → User confirms
```

#### Anthropic & OpenAI (AI Services)

**Purpose**: Future AI-assisted content features

**Planned Features**
- Content summarization
- Draft assistance
- Related post suggestions

#### Firecrawl (Web Scraping)

**Purpose**: Content research and curation

**Planned Features**
- Article extraction
- Content aggregation
- Research automation

## Data Flow Diagrams

### Blog Post Rendering Flow

```
Client Request
      │
      ▼
Cloudflare CDN
      │
      ├──[Cache Hit]──→ Return Cached HTML
      │
      └──[Cache Miss]─→ Cloudflare Workers
                             │
                             ▼
                        Next.js Server Component
                             │
                             ▼
                        Payload Local API
                             │
                             ▼
                        Cloudflare D1 Query
                        SELECT * FROM weekly
                        WHERE slug = ? AND status = 'published'
                             │
                             ▼
                        Fetch Media URLs (R2)
                             │
                             ▼
                        Render HTML (RSC)
                             │
                             ▼
                        Cache Response (CDN)
                             │
                             ▼
                        Return to Client
```

### Newsletter Subscription Flow

```
User Submits Form (email)
         │
         ▼
POST /api/subscribe
         │
         ├──[Validation]──→ Check email format
         │                   └─[Invalid]─→ 400 Error
         │
         ├──[Duplicate Check]─→ Query Supabase
         │                       └─[Exists]─→ 409 Conflict
         │
         ├──[Insert Record]──→ Supabase INSERT
         │                     (confirmed: false)
         │
         ├──[Generate Token]─→ JWT with email + expiry
         │
         ├──[Send Email]────→ Resend API
         │                     Subject: Confirm subscription
         │                     Body: Click link to confirm
         │                     Link: /api/confirm?token=xxx
         │
         └──[Success]────────→ 200 OK
                               { message: "Check your email" }

User Clicks Confirmation Link
         │
         ▼
GET /api/confirm?token=xxx
         │
         ├──[Verify Token]──→ JWT validation
         │                    └─[Invalid]─→ 401 Error
         │
         ├──[Update Record]─→ Supabase UPDATE
         │                    SET confirmed = true
         │
         └──[Redirect]──────→ 302 to /blog
                              with success message
```

### Content Publishing Flow (Admin)

```
Admin Opens /admin
         │
         ▼
Payload CMS Admin UI (Server-Rendered)
         │
         ├─[Create Post]────→ Rich Text Editor (Lexical)
         │                    │
         │                    ├─ Add title, excerpt
         │                    ├─ Write content
         │                    ├─ Upload thumbnail → R2
         │                    ├─ Select tag & color
         │                    └─ Set publish date
         │
         ├─[Save Draft]─────→ POST /api/weekly
         │                    │
         │                    └─ D1 INSERT (status: draft)
         │
         ├─[Preview]────────→ GET /api/preview?slug=xxx&secret=xxx
         │                    │
         │                    ├─ Set preview cookie
         │                    └─ 302 to /blog/[slug]
         │
         └─[Publish]────────→ PATCH /api/weekly/[id]
                              │
                              ├─ D1 UPDATE (status: published)
                              ├─ Invalidate CDN cache
                              └─ Regenerate sitemap
```

### Static Generation & Caching Strategy

```
Build Time (Deployment)
         │
         ├──[Static Pages]──→ Generate at build:
         │                    - / (homepage)
         │                    - /blog (list page)
         │                    - sitemap.xml
         │
         ├──[Dynamic Routes]→ On-demand ISR:
         │                    - /blog/[slug]
         │                    - OpenGraph images
         │
         └──[API Routes]────→ Runtime only:
                              - /api/subscribe
                              - /api/preview

Runtime (First Request)
         │
         ▼
Dynamic Page Request (/blog/new-post)
         │
         ├──[Not in cache]──→ Server Component renders
         │                    │
         │                    ├─ Fetch from D1
         │                    ├─ Render HTML
         │                    ├─ Cache in CDN (stale-while-revalidate)
         │                    └─ Return HTML
         │
         └──[In cache]──────→ Return cached HTML
                              (Revalidate in background)
```

## Database Schema

### Payload CMS Schema (PostgreSQL/D1)

#### `users` Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  salt VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expiration TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  lock_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

#### `weekly` Table
```sql
CREATE TABLE weekly (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content JSONB NOT NULL,           -- Lexical JSON structure
  thumbnail_id INTEGER REFERENCES media(id),
  tag VARCHAR(50) DEFAULT 'ai-weekly',
  tag_color VARCHAR(50) DEFAULT 'blue',
  published_at DATE NOT NULL,
  read_time VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_weekly_slug ON weekly(slug);
CREATE INDEX idx_weekly_status ON weekly(status);
CREATE INDEX idx_weekly_published_at ON weekly(published_at DESC);
CREATE INDEX idx_weekly_tag ON weekly(tag);
```

**Enum Types**
- `tag`: 'ai-weekly', 'tech', 'tutorial'
- `tag_color`: 'pink', 'orange', 'green', 'blue', 'purple', 'yellow'
- `status`: 'draft', 'review', 'published'

#### `media` Table
```sql
CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255),
  filesize INTEGER,
  width INTEGER,
  height INTEGER,
  alt TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  sizes JSONB,                      -- Responsive image sizes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_filename ON media(filename);
```

#### Supabase `subscribers` Table
```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

CREATE INDEX idx_subscribers_email ON subscribers(email);
CREATE INDEX idx_subscribers_confirmed ON subscribers(confirmed);
```

## API Structure

### Public API Routes

#### `POST /api/subscribe`
**Purpose**: Newsletter subscription
**Request**:
```json
{
  "email": "user@example.com"
}
```
**Response**:
```json
{
  "message": "Please check your email to confirm"
}
```
**Errors**: 400 (invalid email), 409 (already subscribed), 500 (server error)

#### `GET /api/confirm?token=xxx`
**Purpose**: Confirm email subscription
**Response**: 302 redirect to /blog with success message
**Errors**: 401 (invalid/expired token)

#### `GET /api/preview?slug=xxx&secret=xxx`
**Purpose**: Enable draft preview mode
**Response**: 302 redirect to /blog/[slug] with preview cookie
**Errors**: 401 (invalid secret), 404 (post not found)

#### `GET /api/exit-preview`
**Purpose**: Disable preview mode
**Response**: 302 redirect to referer with cleared cookie

### Payload CMS API Routes

#### `GET /api/weekly`
**Purpose**: List blog posts
**Query Params**: `where`, `sort`, `limit`, `page`
**Response**:
```json
{
  "docs": [...],
  "totalDocs": 50,
  "page": 1,
  "totalPages": 5
}
```

#### `GET /api/weekly/:id`
**Purpose**: Get single post
**Response**: Post object

#### `POST /api/weekly`
**Purpose**: Create post (admin only)
**Auth**: Required

#### `PATCH /api/weekly/:id`
**Purpose**: Update post (admin only)
**Auth**: Required

#### `DELETE /api/weekly/:id`
**Purpose**: Delete post (admin only)
**Auth**: Required

### GraphQL API

**Endpoint**: `/api/graphql`
**Schema**: Auto-generated from Payload collections
**Features**: Queries, mutations, relationships

## Deployment Architecture

### Development Environment

```
Local Machine
├── Next.js Dev Server (localhost:3000)
├── PostgreSQL (Supabase)
├── S3 Storage (Supabase)
└── Hot Module Replacement
```

### Production Environment

```
Cloudflare Workers
├── Next.js (Standalone Build)
├── Cloudflare D1 (SQLite)
├── Cloudflare R2 (Object Storage)
└── Global Edge Network
```

### CI/CD Pipeline

```
GitHub Push (feat/lovable-ui-migration)
         │
         ▼
GitHub Actions (Optional)
         │
         ├─[Lint]────────→ ESLint check
         ├─[Type Check]──→ tsc --noEmit
         ├─[Build Test]──→ Next.js build
         │
         └─[Manual Trigger]
                   │
                   ▼
              Deployment Script
                   │
                   ├─[1. Migrate Database]
                   │   └─→ pnpm deploy:database
                   │       └─→ payload migrate --env production
                   │
                   ├─[2. Build Application]
                   │   └─→ opennextjs-cloudflare build
                   │       └─→ .open-next/ directory
                   │
                   └─[3. Deploy to Workers]
                       └─→ opennextjs-cloudflare deploy
                           ├─→ Upload worker.js
                           ├─→ Upload assets/
                           ├─→ Configure bindings (D1, R2)
                           └─→ Publish to production
```

## Security Architecture

### Authentication & Authorization

**Admin Access**
- Payload CMS handles auth
- Password hashing (bcrypt)
- Session-based authentication
- HTTP-only cookies

**API Security**
- Rate limiting (Cloudflare)
- CORS configuration
- Input validation (Zod)
- SQL injection prevention (prepared statements)

### Data Security

**In Transit**
- TLS 1.3 (all connections)
- HTTP Strict Transport Security (HSTS)
- Certificate pinning (Cloudflare)

**At Rest**
- Database encryption (D1/PostgreSQL)
- Object storage encryption (R2/S3)
- Secret management (Cloudflare env vars)

### Content Security

**Headers**
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

## Performance Optimizations

### Edge Computing Benefits
- Sub-100ms latency globally
- No cold starts (V8 isolates)
- Automatic scaling
- Regional data replication

### Caching Strategy
- Static assets: 1 year
- HTML pages: Stale-while-revalidate (60s)
- API responses: No cache
- Database queries: In-memory (single request)

### Image Optimization
- Next.js Image component
- Automatic WebP/AVIF conversion
- Responsive image srcsets
- Lazy loading

### Code Splitting
- Route-based splitting (automatic)
- Dynamic imports for heavy components
- Tree shaking unused code
- Minification and compression

## Monitoring & Observability

### Metrics (Planned)
- Request rate (Cloudflare Analytics)
- Error rate (Cloudflare Workers Logs)
- Latency (P50, P95, P99)
- Database query performance

### Logging
- Console logs → Cloudflare Workers Logs
- Error tracking → Sentry (future)
- Access logs → Cloudflare Analytics

### Alerting
- Uptime monitoring (future)
- Error rate thresholds
- Performance degradation

## Scalability Considerations

### Current Capacity
- Workers: Unlimited concurrent requests
- D1: 100k reads/day (free), unlimited (paid)
- R2: 10M reads/month (free), unlimited (paid)
- Bandwidth: 100 GB/month (free)

### Scaling Path
1. **Vertical**: Upgrade Cloudflare plan (more D1/R2 usage)
2. **Horizontal**: Already distributed globally
3. **Database**: D1 auto-scales, add read replicas if needed
4. **Storage**: R2 scales infinitely

### Performance Targets
- Time to First Byte (TTFB): < 200ms
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3s

## Disaster Recovery

### Backup Strategy
- Database: Daily automated backups (Supabase)
- Media: S3 versioning enabled
- Code: Git version control

### Recovery Procedures
1. Database corruption → Restore from Supabase backup
2. Worker failure → Automatic failover (Cloudflare)
3. Data loss → Restore from nightly backup

### RTO/RPO
- Recovery Time Objective: < 1 hour
- Recovery Point Objective: < 24 hours

## Technology Stack Summary

### Frontend
- Next.js 15.4.0 (App Router, Server Components)
- React 19.0.0
- TypeScript 5.6.3
- Tailwind CSS 4.0.0
- Radix UI + shadcn/ui

### Backend
- Cloudflare Workers (V8 Runtime)
- Payload CMS 3.74.0
- OpenNext Cloudflare Adapter

### Data
- PostgreSQL (Development - Supabase)
- Cloudflare D1 (Production - SQLite)
- Cloudflare R2 (Storage)

### External Services
- Resend (Email)
- Cloudflare (CDN, Workers, D1, R2)
- Supabase (Dev DB, Storage)

### DevOps
- pnpm (Package Manager)
- Wrangler (Cloudflare CLI)
- Git (Version Control)
- GitHub (Repository)

## Future Architecture Improvements

1. **Edge Caching Layer**: Add KV for hot data
2. **Search**: Integrate Algolia or Typesense
3. **Analytics**: Add privacy-focused analytics (Plausible)
4. **Comments**: Add comment system (TBD)
5. **Internationalization**: Add i18n support
6. **Progressive Web App**: Add PWA capabilities
7. **Real-time Updates**: WebSocket support for live drafts
8. **Multi-tenancy**: Support multiple blogs (future)
