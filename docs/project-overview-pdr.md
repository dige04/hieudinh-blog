# Project Overview & Product Development Requirements

**Project Name**: VN AI Weekly
**Version**: 0.1.0
**Status**: Active Development - Migration Phase
**Last Updated**: 2026-02-05

## Executive Summary

VN AI Weekly is a personal portfolio and blog platform focused on AI and technology content, currently undergoing a strategic migration from a Vite/React SPA to a modern Next.js application with integrated headless CMS capabilities. The platform serves as both a content publication system and a link aggregator (link-in-bio) for the creator's online presence.

## Project Purpose

### Primary Goals
1. **Content Publishing**: Provide a platform for publishing weekly AI and technology insights
2. **Audience Engagement**: Build and maintain a newsletter subscriber base
3. **Professional Presence**: Serve as a central hub for professional online identity
4. **Technical Showcase**: Demonstrate modern web development practices and architecture

### Secondary Goals
- Explore AI-assisted content creation workflows
- Experiment with edge computing and serverless architectures
- Maintain SEO-optimized content delivery
- Provide excellent reading experience across devices

## Target Users

### Primary Audience
- **Technology Enthusiasts**: Developers and tech professionals interested in AI trends
- **Newsletter Subscribers**: Regular readers seeking curated AI/tech content
- **Professional Network**: Potential collaborators, employers, or clients

### Secondary Audience
- **Content Creators**: Others interested in the tech stack and architecture
- **AI Practitioners**: Professionals looking for practical AI insights

## Key Features

### Content Management (Phase 01-02) ✅
- **Payload CMS Integration**: Self-hosted headless CMS with PostgreSQL backend
- **Rich Text Editor**: Lexical-powered WYSIWYG editing with media support
- **Blog Post Management**:
  - Title, slug, excerpt, and rich content
  - Thumbnail images with S3/R2 storage
  - Tags and categories (ai-weekly, tech, tutorial)
  - Tag colors for visual organization
  - Publication dates and read time estimates
  - Draft/published status workflow
- **Media Library**: Centralized asset management with cloud storage
- **Admin Dashboard**: Secure admin interface at `/admin`

### Public-Facing Features (Phase 01-03) ✅
- **Blog Homepage**: Card-based blog post listing with filtering
- **Blog Post Pages**:
  - Clean, readable article layout
  - Reading progress indicator
  - Social sharing buttons
  - Rich text rendering with syntax highlighting
- **Link-in-Bio Homepage**: Centralized link aggregator
- **Newsletter Subscription**:
  - Email capture with double opt-in
  - Resend.com integration for email delivery
  - Supabase storage for subscriber data
- **SEO Optimization**:
  - Dynamic meta tags
  - OpenGraph images
  - Twitter Card support
  - Sitemap generation
  - JSON-LD structured data

### Advanced Features (Phase 04-05) ✅
- **Related Posts**: Intelligent content recommendations
- **Draft Preview Mode**: Secure preview URLs for unpublished content
- **Tag Filtering**: Client-side tag-based content filtering
- **Search Functionality**: Blog post search overlay

### Infrastructure Features ✅
- **Edge Deployment**: Cloudflare Workers with global CDN
- **Database**:
  - PostgreSQL (Supabase) for development and CMS
  - D1 (SQLite) for edge deployment
- **Storage**:
  - S3-compatible storage (Supabase or Cloudflare R2)
  - Optimized image delivery
- **Performance**:
  - Static generation with incremental regeneration
  - Optimized asset delivery
  - Minimal JavaScript footprint

## Product Requirements

### Functional Requirements

#### FR-001: Content Management
- **Priority**: P0 (Critical)
- **Status**: ✅ Implemented
- **Description**: Admin users must be able to create, edit, publish, and delete blog posts through a web interface
- **Acceptance Criteria**:
  - ✅ Rich text editor with formatting options
  - ✅ Image upload and embedding
  - ✅ Draft/publish workflow
  - ✅ SEO metadata input
  - ✅ Tag management

#### FR-002: Public Blog
- **Priority**: P0 (Critical)
- **Status**: ✅ Implemented
- **Description**: Visitors must be able to browse and read published blog posts
- **Acceptance Criteria**:
  - ✅ Blog listing page with pagination/filtering
  - ✅ Individual blog post pages
  - ✅ Responsive design
  - ✅ Fast page loads (<3s)
  - ✅ Social sharing capabilities

#### FR-003: Newsletter Subscription
- **Priority**: P1 (High)
- **Status**: ✅ Implemented
- **Description**: Visitors must be able to subscribe to newsletter updates
- **Acceptance Criteria**:
  - ✅ Email capture form
  - ✅ Double opt-in confirmation
  - ✅ Subscriber storage
  - ✅ Email validation
  - ✅ Privacy compliance (data handling)

#### FR-004: Link-in-Bio Homepage
- **Priority**: P1 (High)
- **Status**: ✅ Implemented
- **Description**: Centralized landing page with links to social profiles and content
- **Acceptance Criteria**:
  - ✅ Clean, mobile-first design
  - ✅ Quick access to blog and social profiles
  - ✅ Fast load time
  - ✅ Easy content updates

#### FR-005: SEO & Discoverability
- **Priority**: P1 (High)
- **Status**: ✅ Implemented
- **Description**: Content must be optimized for search engines
- **Acceptance Criteria**:
  - ✅ Dynamic meta tags
  - ✅ OpenGraph images
  - ✅ Structured data (JSON-LD)
  - ✅ XML sitemap
  - ✅ Semantic HTML

#### FR-006: Draft Preview
- **Priority**: P2 (Medium)
- **Status**: ✅ Implemented
- **Description**: Editors must be able to preview unpublished content
- **Acceptance Criteria**:
  - ✅ Secure preview URLs
  - ✅ Preview mode indicator
  - ✅ Easy exit from preview mode

#### FR-007: AI-Assisted Content (Future)
- **Priority**: P3 (Low)
- **Status**: 🔄 Planned
- **Description**: Integration with AI services for content assistance
- **Acceptance Criteria**:
  - Content scraping with Firecrawl
  - AI summarization (Anthropic/OpenAI)
  - Automated content suggestions

### Non-Functional Requirements

#### NFR-001: Performance
- **Page Load**: First Contentful Paint < 1.5s
- **Time to Interactive**: < 3s on 4G
- **Lighthouse Score**: > 90 across all metrics
- **Image Optimization**: WebP/AVIF with lazy loading

#### NFR-002: Scalability
- **Database**: Support for 1000+ blog posts
- **Storage**: Unlimited media via cloud storage
- **Traffic**: Handle 10k+ monthly visitors
- **Edge Distribution**: Global CDN coverage

#### NFR-003: Security
- **Authentication**: Secure admin access
- **API Protection**: Rate limiting and validation
- **Data Privacy**: GDPR-compliant data handling
- **Content Security**: CSP headers
- **Environment Secrets**: Secure secret management

#### NFR-004: Accessibility
- **WCAG 2.1**: AA compliance minimum
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and semantic HTML
- **Color Contrast**: 4.5:1 minimum ratio

#### NFR-005: SEO Performance
- **Core Web Vitals**: Pass all metrics
- **Mobile-First**: Responsive and mobile-optimized
- **Semantic HTML**: Proper heading structure
- **Schema Markup**: Rich snippets support

#### NFR-006: Developer Experience
- **Type Safety**: Full TypeScript coverage
- **Code Quality**: ESLint + Prettier
- **Hot Reload**: Instant development feedback
- **Documentation**: Comprehensive code docs

## Technical Constraints

### Platform Constraints
- **Hosting**: Cloudflare Workers (serverless, edge computing)
- **Database**: PostgreSQL for CMS, D1 for edge deployment
- **Storage**: S3-compatible (R2 or Supabase)
- **Email**: Resend.com for transactional emails

### Framework Constraints
- **Frontend**: Next.js 15+ with App Router
- **CMS**: Payload CMS 3.x
- **React**: Version 19.x
- **Node Runtime**: Edge-compatible code only

### Build Constraints
- **Bundle Size**: Worker bundle < 1MB
- **Build Time**: < 2 minutes for full deployment
- **Compatibility**: Node 18+ required for local development

## Dependencies

### Critical Dependencies
- Payload CMS availability and API stability
- Cloudflare Workers platform reliability
- PostgreSQL database uptime (Supabase)
- R2/S3 storage availability

### Service Dependencies
- **Resend**: Email delivery service
- **Cloudflare**: CDN, Workers, D1, R2
- **Supabase** (optional): Database and storage alternative

## Success Metrics

### Content Metrics
- Monthly blog posts published: 4-8
- Average post read time: 3-5 minutes
- Content categories: 3+ active tags

### Engagement Metrics
- Newsletter subscribers: Growth target 100+ in 3 months
- Monthly pageviews: 1000+ target
- Average session duration: > 2 minutes
- Bounce rate: < 60%

### Technical Metrics
- Lighthouse Performance: > 90
- Core Web Vitals: All green
- Uptime: > 99.9%
- Page load time: < 2s (median)

### SEO Metrics
- Indexed pages: 100% of published content
- Organic search traffic: 30%+ of total
- Featured snippets: 5+ blog posts

## Migration Roadmap

### Phase 01: Foundation (Completed ✅)
- Next.js + Payload CMS setup
- Blog post collection
- Admin interface
- Database configuration

### Phase 02: Core Features (Completed ✅)
- Blog listing page
- Blog detail pages
- Newsletter subscription
- Rich text rendering

### Phase 03: Enhancement (Completed ✅)
- SEO optimization
- OpenGraph images
- Sitemap generation
- Social sharing

### Phase 04: Advanced Features (Completed ✅)
- Related posts algorithm
- Draft preview mode
- Tag filtering
- Search functionality

### Phase 05: Production Deployment (Current)
- Legacy app deprecation
- Full migration to Next.js
- Cloudflare Workers deployment
- Performance optimization

### Phase 06: AI Integration (Planned)
- Firecrawl content scraping
- AI-powered content suggestions
- Automated summarization
- Content enhancement tools

## Risk Assessment

### Technical Risks
- **Cloudflare Workers Limitations**: Edge runtime constraints may limit certain Node.js features
  - Mitigation: Use edge-compatible alternatives, fallback to origin when needed
- **Database Migration Complexity**: PostgreSQL to D1 sync challenges
  - Mitigation: Payload migrations + manual data validation
- **Storage Provider Lock-in**: S3 compatibility issues between providers
  - Mitigation: Standard S3 API, tested across Supabase and R2

### Operational Risks
- **Content Loss**: Data corruption during migration
  - Mitigation: Regular backups, staging environment testing
- **Performance Regression**: New architecture slower than SPA
  - Mitigation: Performance monitoring, SSG for static content
- **SEO Impact**: URL changes affecting search rankings
  - Mitigation: 301 redirects, maintain slug structure

## Compliance & Legal

### Data Privacy
- GDPR compliance for EU visitors
- Cookie consent for analytics
- Privacy policy disclosure
- Data retention policies

### Content Licensing
- Original content: Creator retains copyright
- Third-party content: Proper attribution
- Media assets: Licensed or original only

## Future Considerations

### Potential Features
- Comments system (Phase 07)
- User accounts and profiles
- Content series/courses
- Podcast integration
- Video content hosting
- Multilingual support (Vietnamese + English)

### Technical Evolution
- Explore Next.js 16+ features
- Transition to Rust-based tools (oxc, turbopack)
- Edge caching optimization
- Real-time collaboration in CMS

## Stakeholders

### Primary Stakeholder
- **Content Creator**: Author, publisher, and system administrator

### Secondary Stakeholders
- **Newsletter Subscribers**: Content consumers
- **Search Engines**: Content indexers (Google, Bing)
- **Social Media Platforms**: Content sharers (Twitter, LinkedIn)

## Appendix

### Related Documentation
- `/docs/codebase-summary.md` - Technical architecture
- `/docs/code-standards.md` - Development guidelines
- `/docs/system-architecture.md` - System design
- `/apps/web/.env.example` - Environment configuration
- `/plans/` - Feature planning documents

### Key Decisions
1. **Payload CMS over WordPress/Ghost**: Self-hosted, developer-friendly, TypeScript-native
2. **Next.js over Remix/SvelteKit**: App Router maturity, Cloudflare Workers support via OpenNext
3. **Cloudflare Workers over Vercel/Netlify**: Cost efficiency, edge performance, D1/R2 integration
4. **PostgreSQL over MongoDB**: Relational data model, Payload CMS compatibility
5. **Resend over SendGrid**: Better developer experience, modern API
