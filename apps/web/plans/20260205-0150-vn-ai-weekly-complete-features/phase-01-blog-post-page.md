# Phase 01: Blog Post Page

## Context

- **Parent Plan**: [plan.md](./plan.md)
- **Dependencies**: None (foundational phase)
- **Blocks**: Phase 03, 04, 05

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-05 |
| Priority | P0 |
| Status | Pending |
| Estimate | 3 hours |

Complete blog post page with Lexical RichText rendering, reading progress indicator, and social sharing functionality.

## Key Insights (from Research)

1. **Lexical Rendering**: Use `@payloadcms/richtext-lexical/react` RichText component with custom JSXConverters
2. **Reading Progress**: CSS scroll-driven animations preferred, framer-motion fallback
3. **Social Sharing**: Web Share API on mobile, copy-to-clipboard on desktop
4. **Personal Insight**: Separate styled section for `personalInsight` field

## Requirements

### Must Have
- Render Lexical richText content with prose styling
- Display reading progress bar (article-scoped)
- Social share buttons (copy link, native share on mobile)
- Personal insight section with distinct styling
- Mobile responsive layout

### Nice to Have
- Highlight-to-share tooltip
- Estimated read time recalculation

## Architecture

```
BlogPostPage (Server Component)
├── ReadingProgress (Client Component) - sticky top bar
├── article
│   ├── header (tag, readTime, date, title, excerpt)
│   ├── thumbnail (next/image)
│   ├── RichText (content)
│   └── PersonalInsight (personalInsight richText)
├── SocialShare (Client Component)
└── SubscribeSection (existing)
```

## Related Code Files

| File | Purpose |
|------|---------|
| `/src/app/blog/[slug]/page.tsx` | Current scaffold - needs RichText integration |
| `/src/collections/Weekly.ts` | Collection schema with content + personalInsight fields |
| `/src/components/blog/SubscribeSection.tsx` | Existing subscribe UI |

## Implementation Steps

### Step 1: Create RichText Component
```tsx
// src/components/RichText.tsx
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

interface Props {
  content: SerializedEditorState
  className?: string
}

export function RichText({ content, className }: Props) {
  return (
    <div className={cn('prose prose-neutral dark:prose-invert max-w-none', className)}>
      <PayloadRichText data={content} />
    </div>
  )
}
```

### Step 2: Create ReadingProgress Component
```tsx
// src/components/ReadingProgress.tsx
'use client'
import { useScroll, motion } from 'framer-motion'
import { useRef } from 'react'

export function ReadingProgress({ target }: { target: React.RefObject<HTMLElement> }) {
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50"
      style={{ scaleX: scrollYProgress }}
    />
  )
}
```

### Step 3: Create SocialShare Component
```tsx
// src/components/SocialShare.tsx
'use client'
import { Share2, Link, Twitter } from 'lucide-react'
import { toast } from 'sonner'

export function SocialShare({ title, url }: { title: string; url: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }
  // ...
}
```

### Step 4: Update Blog Post Page
Integrate all components into `/src/app/blog/[slug]/page.tsx`:
- Import and use RichText for content
- Wrap article in ref for ReadingProgress
- Add SocialShare after article
- Style personalInsight section distinctly

## Todo List

- [ ] Create `src/components/RichText.tsx` with PayloadRichText wrapper
- [ ] Create `src/components/ReadingProgress.tsx` with framer-motion
- [ ] Create `src/components/SocialShare.tsx` with Web Share API
- [ ] Update `src/app/blog/[slug]/page.tsx` to use new components
- [ ] Add personal insight section with distinct styling
- [ ] Add thumbnail image with next/image
- [ ] Test on mobile devices

## Success Criteria

- [ ] Lexical content renders with proper typography (headings, lists, code blocks)
- [ ] Reading progress tracks article scroll, not full page
- [ ] Share button uses native share on mobile, clipboard on desktop
- [ ] Personal insight section visually distinct from main content
- [ ] No hydration mismatches

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Lexical custom blocks not rendering | Medium | High | Implement fallback for unknown blocks |
| framer-motion bundle size | Low | Low | Tree-shaking enabled by default |
| Web Share API not available | Low | Low | Fallback to clipboard already implemented |

## Security Considerations

- No user input on this page (read-only content)
- Ensure thumbnail URLs validated against remotePatterns in next.config

## Next Steps

After completion:
1. Proceed to Phase 03 (SEO) for OG images
2. Proceed to Phase 04 (Related Posts) for post recommendations
