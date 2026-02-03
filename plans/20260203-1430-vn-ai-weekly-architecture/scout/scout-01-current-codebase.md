# Scout Report: Current Codebase Analysis

## 1. Components Structure

### Blog Components (`src/components/blog/`)
| File | Purpose | Migration Notes |
|------|---------|-----------------|
| BlogCard.tsx | Post preview cards | Replace `react-router-dom` Link → `next/link` |
| LeftSidebar.tsx | Navigation sidebar | Update to Next.js routing |
| RightSidebar.tsx | Secondary content | Minimal changes |
| SearchBar.tsx | Search input | Add `"use client"` |
| SearchOverlay.tsx | Search modal | Add `"use client"` |
| SocialLinks.tsx | Social links | Static, easy migrate |
| TagFilter.tsx | Tag filtering | Add `"use client"` |

### Shadcn UI (`src/components/ui/`)
~45 components: accordion, button, card, dialog, dropdown-menu, form, input, select, tabs, toast, etc.
**Status**: Fully compatible with Next.js - just copy and update imports.

## 2. Pages & Routing

### Current Routes (React Router in App.tsx)
| Route | Component | Next.js Path |
|-------|-----------|--------------|
| `/` | About.tsx | `app/page.tsx` |
| `/blog` | Index.tsx | `app/blog/page.tsx` |
| `/blog/:slug` | BlogPost.tsx | `app/blog/[slug]/page.tsx` |
| `*` | NotFound.tsx | `app/not-found.tsx` |

### Providers to Migrate
- QueryClientProvider → `app/providers.tsx` with `"use client"`
- TooltipProvider → client wrapper
- Toaster → client wrapper

## 3. Data Layer

### Content Structure (`src/data/blogData.ts`)
```typescript
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;      // Raw HTML
  thumbnail: string;
  tag: string;
  tagColor: 'pink' | 'orange' | 'green' | 'blue' | 'purple' | 'yellow';
  date: string;
  readTime: string;
  slug: string;
}
```
**Current content**: 4 Vietnamese AI Weekly posts (W01-W04 2026)

### Profile Object
```typescript
profile = { name, bio, avatar, location, work, social: {...} }
```

## 4. Config Files

### tailwind.config.ts
- CSS variables for theming (`hsl(var(...))`)
- Custom animations (accordion, etc.)
- **Action**: Copy to Next.js, port CSS vars to `app/globals.css`

### vite.config.ts
- `@` alias for src/
- **Action**: Remove, use `tsconfig.json` paths in Next.js

### package.json
**Keep**: react, lucide-react, @radix-ui/*, clsx, tailwind-merge, zod, date-fns
**Remove**: react-router-dom, vite, @vitejs/*
**Add**: next, payload, @payloadcms/*, drizzle-orm

## 5. Migration Mapping to Payload CMS

| Current | Payload CMS |
|---------|-------------|
| blogPosts array | `Weekly` collection |
| BlogPost.content (HTML) | textarea or richText field |
| BlogPost.tag | select or tags array |
| profile object | `SiteConfig` global |

## Unresolved Questions
1. Keep existing HTML content or convert to Lexical richText?
2. How to handle `tagColor` mapping in Payload?
