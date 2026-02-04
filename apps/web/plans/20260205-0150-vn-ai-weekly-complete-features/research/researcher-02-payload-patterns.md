# Research Report: Payload CMS 3.x Patterns & Next.js App Router Integration

## 1. Rich Text Rendering (Lexical)
**Best Practice**: Direct JSX Rendering (`@payloadcms/richtext-lexical/react`)
- **Avoid**: `lexicalHTMLField` (legacy/redundant)
- **Component**: Wrap `RichText` from Payload to map internal nodes to your design system.
- **Custom Blocks**: Pass `JSXConverters` prop to `RichText` component to render custom React components for blocks (e.g., `<MyCustomBlock />`).
- **Static/SEO**: Use `convertLexicalToHTML` server-side only when generating metadata or RSS feeds.

```tsx
// src/components/RichText.tsx
import { RichText as PayloadRichText } from '@payloadcms/richtext-lexical/react'

export const RichText = ({ content }) => (
  <div className="prose">
    <PayloadRichText data={content} converters={myCustomConverters} />
  </div>
)
```

## 2. Draft/Preview Mode
**Implementation**: Native Next.js `draftMode()`
- **Secure URL**: Payload Admin → Document → "Preview" button triggers API route.
- **Route Handler**: `/api/preview?secret=...&slug=...` validates secret, enables `draftMode()`, redirects to content.
- **Page Fetching**:
  ```tsx
  import { draftMode } from 'next/headers'
  const { isEnabled } = draftMode()
  const data = await payload.find({ ..., draft: isEnabled })
  ```
- **Live Preview**: Payload 3.0 supports live preview in the admin panel via the `admin.livePreview` config, pointing to the same frontend URL.

## 3. Image Optimization
**Strategy**: Payload `imageSizes` + `next/image`
- **Pre-processing**: Define `imageSizes` (e.g., mobile, tablet, desktop) in Collection Config. Payload uses `sharp` to resize on upload.
- **Delivery**: Use `next/image` for client-side format conversion (WebP/AVIF) and lazy loading.
- **Layout Shift**: ALWAYS pass `width` and `height` from Payload's `doc.sizes` to `next/image`.
- **Remote**: Add domain/S3 bucket to `next.config.mjs` `remotePatterns`.

## 4. Caching Strategies
**Core**: On-Demand Revalidation (`revalidateTag`)
- **Native Integration**: Call `revalidateTag` directly in Payload `afterChange`/`afterDelete` hooks (since Payload 3.0 runs in the same process).
- **Tagging Convention**:
  - Global: `'collection_slug'` (e.g., `'posts'`) for lists.
  - Granular: `'collection_slug_id'` (e.g., `'posts_123'`) for detail pages.
- **Fetching**:
  - **Native**: `fetch(url, { next: { tags: ['posts'] } })`
  - **Local API**: Wrap `payload.find()` with `unstable_cache`.

## 5. Admin Customization
**Framework**: React Server Components (RSC)
- **Components**: Registered via file path strings in `payload.config.ts` (bundling requirement).
- **Views**: Replace `dashboard` or add custom tabs (Root, Collection, Global, Document levels).
- **UI**: Use `@payloadcms/ui` imports (Gutter, Button) for consistent theming.
- **Data**: Fetch directly in RSC views using `payload` local API.

## Unresolved Questions
1. Specific `unstable_cache` wrapper implementation for generic `payload.find` calls to reduce boilerplate?
2. Exact setup for `admin.livePreview` url generation function with multiple collections?

## Citations
- Payload Docs: Rich Text (Lexical), Uploads, Admin Views
- Next.js Docs: Image Optimization, Incremental Static Regeneration (ISR)
