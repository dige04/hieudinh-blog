# Phase 05: Draft Preview

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

Implement draft preview mode allowing content editors to view unpublished posts before publication.

## Key Insights (from Research)

1. **Next.js Draft Mode**: Native `draftMode()` from `next/headers`
2. **Secure URL**: Preview triggered via secret token in API route
3. **Payload Integration**: Use `draft: true` in Payload queries when draft mode enabled
4. **Live Preview**: Payload 3.0 supports `admin.livePreview` for real-time editing

## Requirements

### Must Have
- `/api/preview` route to enable draft mode with secret validation
- `/api/exit-preview` route to disable draft mode
- Modify post queries to respect draft mode
- Visual indicator when viewing draft content

### Nice to Have
- Payload Admin "Preview" button integration
- Live preview with real-time updates
- Preview banner with "Exit Preview" button

## Architecture

```
Preview Flow:
1. Editor clicks Preview in Payload Admin
2. Redirects to /api/preview?secret=XXX&slug=post-slug
3. API validates secret, enables draftMode(), redirects to /blog/post-slug
4. Page fetches with draft: true, showing unpublished content
5. Editor clicks "Exit Preview" -> /api/exit-preview -> draftMode().disable()

Payload Config Addition:
admin: {
  livePreview: {
    url: ({ data }) => `${SITE_URL}/api/preview?secret=${SECRET}&slug=${data.slug}`,
    collections: ['weekly'],
  }
}
```

## Related Code Files

| File | Purpose |
|------|---------|
| `/src/app/blog/[slug]/page.tsx` | Needs draft mode query modification |
| `/src/payload.config.ts` | Add livePreview config |
| `.env.example` | Add PREVIEW_SECRET |

## Implementation Steps

### Step 1: Create Preview API Route
```tsx
// src/app/api/preview/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  // Validate secret
  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid secret', { status: 401 })
  }

  if (!slug) {
    return new Response('Missing slug', { status: 400 })
  }

  // Enable draft mode
  const draft = await draftMode()
  draft.enable()

  // Redirect to the post
  redirect(`/blog/${slug}`)
}
```

### Step 2: Create Exit Preview Route
```tsx
// src/app/api/exit-preview/route.ts
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
  const draft = await draftMode()
  draft.disable()
  redirect('/blog')
}
```

### Step 3: Update Blog Post Page Query
```tsx
// Update src/app/blog/[slug]/page.tsx
import { draftMode } from 'next/headers'

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'weekly',
    where: { slug: { equals: slug } },
    limit: 1,
    draft: isDraft, // Include drafts when in preview mode
  })

  const post = result.docs[0]

  // Also check for draft status when not in preview
  if (!post || (!isDraft && post.status !== 'published')) {
    notFound()
  }

  return (
    <main>
      {isDraft && <PreviewBanner />}
      {/* ... rest of content ... */}
    </main>
  )
}
```

### Step 4: Create Preview Banner Component
```tsx
// src/components/PreviewBanner.tsx
import Link from 'next/link'

export function PreviewBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-black text-center py-2 z-50">
      <span className="font-medium">Preview Mode</span>
      <Link href="/api/exit-preview" className="ml-4 underline">
        Exit Preview
      </Link>
    </div>
  )
}
```

### Step 5: Update Payload Config (Optional Live Preview)
```tsx
// src/payload.config.ts
export default buildConfig({
  admin: {
    user: Users.slug,
    livePreview: {
      url: ({ data }) =>
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/preview?secret=${process.env.PREVIEW_SECRET}&slug=${data.slug}`,
      collections: ['weekly'],
    },
    // ...
  },
  // ...
})
```

## Todo List

- [ ] Add `PREVIEW_SECRET` to `.env.example`
- [ ] Create `src/app/api/preview/route.ts` - enable draft mode
- [ ] Create `src/app/api/exit-preview/route.ts` - disable draft mode
- [ ] Create `src/components/PreviewBanner.tsx` - visual indicator
- [ ] Update blog post page to respect draft mode
- [ ] Update Payload config with livePreview (optional)
- [ ] Test preview flow end-to-end
- [ ] Document preview URL format for editors

## Success Criteria

- [ ] `/api/preview?secret=XXX&slug=YYY` enables draft mode
- [ ] Draft posts visible when draft mode enabled
- [ ] Draft posts return 404 when draft mode disabled
- [ ] Preview banner visible during draft mode
- [ ] Exit preview button works correctly
- [ ] Secret validation prevents unauthorized access

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Secret exposed in URL | Medium | High | Use HTTPS, don't log URLs, rotate secret |
| Draft mode persists unexpectedly | Low | Low | Clear instructions, auto-expire |
| Cloudflare caching issues | Medium | Medium | Set cache-control headers for preview routes |

## Security Considerations

- Use strong, random PREVIEW_SECRET (min 32 chars)
- PREVIEW_SECRET only in server environment, never exposed to client
- Preview routes behind HTTPS only
- Consider IP allowlisting for extra security
- Log preview access attempts for audit

## Next Steps

After completion:
1. Document preview workflow for content editors
2. Consider auto-expiring preview sessions
3. Add preview mode to related posts query
